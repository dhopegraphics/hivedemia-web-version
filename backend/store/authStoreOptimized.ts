// Optimized Authentication Store with Memory Leak Prevention
import { supabase } from "@/backend/supabase";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

type Session = {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
  };
  expires_at: number;
};

interface AuthState {
  session: Session | null;
  hydrated: boolean;
  hasCompletedOnboarding: boolean;
  user: Session["user"] | null;
  isValidating: boolean;
  setSession: (session: Session | null) => Promise<void>;
  hydrateSession: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  logout: () => Promise<void>;
  setOnboarded: (value: boolean) => Promise<void>;
}

// Singleton pattern for session validation to prevent multiple concurrent validations
class SessionValidator {
  private static instance: SessionValidator;
  private validationPromise: Promise<boolean> | null = null;
  private lastValidation: number = 0;
  private readonly VALIDATION_THROTTLE = 30000; // 30 seconds

  static getInstance(): SessionValidator {
    if (!SessionValidator.instance) {
      SessionValidator.instance = new SessionValidator();
    }
    return SessionValidator.instance;
  }

  async validateSession(authStore: any): Promise<boolean> {
    const now = Date.now();

    // Throttle validation requests
    if (
      now - this.lastValidation < this.VALIDATION_THROTTLE &&
      this.validationPromise
    ) {
      return this.validationPromise;
    }

    // If already validating, return existing promise
    if (this.validationPromise) {
      return this.validationPromise;
    }

    this.validationPromise = this.performValidation(authStore);
    this.lastValidation = now;

    try {
      const result = await this.validationPromise;
      return result;
    } finally {
      this.validationPromise = null;
    }
  }

  private async performValidation(authStore: any): Promise<boolean> {
    try {
      // Check network connectivity first
      const NetInfo = await import("@react-native-community/netinfo");
      const { isConnected } = await NetInfo.default.fetch();

      if (!isConnected) {
        const { session } = authStore.getState();
        return !!session;
      }

      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.warn("Session validation error:", error.message);
        const { session } = authStore.getState();
        return !!session;
      }

      if (!currentSession) {
        const { session } = authStore.getState();
        if (session) {
          return true;
        }

        authStore.setState({ session: null, user: null });
        await SecureStore.deleteItemAsync("session");
        return false;
      }

      // Update local session with validated session
      const validatedSession: Session = {
        access_token: currentSession.access_token,
        refresh_token: currentSession.refresh_token,
        user: {
          id: currentSession.user.id,
          email: currentSession.user.email!,
        },
        expires_at: currentSession.expires_at!,
      };

      authStore.setState({
        session: validatedSession,
        user: validatedSession.user,
      });
      await SecureStore.setItemAsync(
        "session",
        JSON.stringify(validatedSession)
      );
      return true;
    } catch (error) {
      console.error("Session validation failed:", error);
      const { session } = authStore.getState();
      if (session) {
        return true;
      }

      authStore.setState({ session: null, user: null });
      await SecureStore.deleteItemAsync("session");
      return false;
    }
  }
}

export const useAuthStore = create<AuthState>((set, get) => {
  const validator = SessionValidator.getInstance();

  return {
    session: null,
    hydrated: false,
    hasCompletedOnboarding: false,
    user: null,
    isValidating: false,

    setSession: async (session) => {
      try {
        if (session) {
          // Validate session before storing
          if (!session.access_token || !session.user || !session.user.id) {
            console.warn("Invalid session provided to setSession");
            await SecureStore.deleteItemAsync("session");
            set({ session: null, user: null });
            return;
          }
          await SecureStore.setItemAsync("session", JSON.stringify(session));
          set({ session, user: session.user });
        } else {
          await SecureStore.deleteItemAsync("session");
          set({ session: null, user: null });
        }
      } catch (error) {
        console.error("Error setting session:", error);
        // Fallback to clear state on error
        set({ session: null, user: null });
      }
    },

    setOnboarded: async (value: boolean) => {
      try {
        await SecureStore.setItemAsync(
          "onboardingComplete",
          value ? "true" : "false"
        );
        set({ hasCompletedOnboarding: value });
      } catch (error) {
        console.error("Error setting onboarding status:", error);
      }
    },

    hydrateSession: async () => {
      try {
        const [rawSession, onboarded] = await Promise.all([
          SecureStore.getItemAsync("session"),
          SecureStore.getItemAsync("onboardingComplete"),
        ]);

        let parsed: Session | null = null;

        if (rawSession) {
          try {
            parsed = JSON.parse(rawSession);
            // Validate the parsed session has required fields
            if (
              parsed &&
              parsed.access_token &&
              parsed.user &&
              parsed.user.id
            ) {
              set({ session: parsed, user: parsed.user });
            } else {
              console.warn(
                "Invalid session data found in storage, clearing..."
              );
              await SecureStore.deleteItemAsync("session");
              set({ session: null, user: null });
            }
          } catch (parseError) {
            console.error("Failed to parse stored session:", parseError);
            await SecureStore.deleteItemAsync("session");
            set({ session: null, user: null });
          }
        }

        set({ hasCompletedOnboarding: onboarded === "true" });
      } catch (e) {
        console.error("Failed to hydrate auth store", e);
        // Ensure session is null on error
        set({ session: null, user: null });
      } finally {
        set({ hydrated: true });
      }
    },

    validateSession: async (): Promise<boolean> => {
      const state = get();
      if (state.isValidating) {
        // Already validating, wait for completion
        return new Promise((resolve) => {
          const checkValidation = () => {
            const currentState = get();
            if (!currentState.isValidating) {
              resolve(!!currentState.session);
            } else {
              setTimeout(checkValidation, 100);
            }
          };
          checkValidation();
        });
      }

      set({ isValidating: true });

      try {
        const result = await validator.validateSession({
          getState: get,
          setState: set,
        });
        return result;
      } finally {
        set({ isValidating: false });
      }
    },

    logout: async () => {
      try {
        await Promise.all([
          SecureStore.deleteItemAsync("session"),
          supabase.auth.signOut(),
        ]);
        set({ session: null, user: null });
      } catch (error) {
        console.error("Error during logout:", error);
        // Ensure state is cleared even if logout fails
        set({ session: null, user: null });
      }
    },
  };
});

// Export singleton validator for external use if needed
export { SessionValidator };
