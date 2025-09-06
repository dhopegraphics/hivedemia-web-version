// Optimized Authentication Store with Memory Leak Prevention
import { supabase } from "@/backend/supabase";
import { create } from "zustand";

// Web-compatible secure storage utility
const webSecureStorage = {
  async getItemAsync(key: string): Promise<string | null> {
    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      return null;
    }
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setItemAsync(key: string, value: string): Promise<void> {
    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn(`Failed to set ${key} in localStorage:`, error);
    }
  },
  async deleteItemAsync(key: string): Promise<void> {
    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to delete ${key} from localStorage:`, error);
    }
  },
};

// Web-compatible network check
async function checkNetworkConnectivity(): Promise<{ isConnected: boolean }> {
  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    return { isConnected: true }; // Assume connected on server
  }

  if (typeof navigator !== "undefined" && "onLine" in navigator) {
    return { isConnected: navigator.onLine };
  }

  try {
    const response = await fetch("/api/health", {
      method: "HEAD",
      cache: "no-cache",
    });
    return { isConnected: response.ok };
  } catch {
    return { isConnected: false };
  }
}

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
  validateSessionInBackground: () => void;
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

  async validateSession(authStore: {
    getState: () => AuthState;
    setState: (state: Partial<AuthState>) => void;
  }): Promise<boolean> {
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

  private async performValidation(authStore: {
    getState: () => AuthState;
    setState: (state: Partial<AuthState>) => void;
  }): Promise<boolean> {
    try {
      // Always prioritize existing session first
      const { session } = authStore.getState();
      if (!session) {
        console.log("No stored session to validate");
        return false;
      }

      // Check if stored session is expired before network validation
      const now = Date.now() / 1000; // Convert to seconds
      if (session.expires_at && session.expires_at <= now) {
        console.log("Stored session has expired, clearing...");
        authStore.setState({ session: null, user: null });
        await webSecureStorage.deleteItemAsync("session");
        return false;
      }

      // Check network connectivity first
      const { isConnected } = await checkNetworkConnectivity();

      if (!isConnected) {
        console.log("Offline: Keeping stored session without validation");
        return true;
      }

      // Quick timeout for validation to prevent delays
      const validationPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Validation timeout")), 3000)
      );

      const result = await Promise.race([validationPromise, timeoutPromise]);
      const {
        data: { session: currentSession },
        error,
      } = result;

      if (error) {
        console.warn(
          "Session validation error, keeping stored session:",
          error.message
        );
        return true; // Keep stored session on any error
      }

      if (!currentSession) {
        console.log("No server session found - clearing local session");
        // If server says no session exists, clear local storage
        authStore.setState({ session: null, user: null });
        await webSecureStorage.deleteItemAsync("session");
        return false;
      }

      // Update local session with validated session only if it's different
      const validatedSession: Session = {
        access_token: currentSession.access_token,
        refresh_token: currentSession.refresh_token,
        user: {
          id: currentSession.user.id,
          email: currentSession.user.email!,
        },
        expires_at: currentSession.expires_at!,
      };

      // Only update if tokens are different (avoid unnecessary writes)
      if (session.access_token !== validatedSession.access_token) {
        authStore.setState({
          session: validatedSession,
          user: validatedSession.user,
        });
        await webSecureStorage.setItemAsync(
          "session",
          JSON.stringify(validatedSession)
        );
        console.log("Session updated with fresh tokens");
      } else {
        console.log("Session is up to date");
      }

      return true;
    } catch (error) {
      console.warn(
        "Session validation failed, clearing session to be safe:",
        error
      );
      // On validation failure, clear the session to be safe
      authStore.setState({ session: null, user: null });
      await webSecureStorage.deleteItemAsync("session");
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
            await webSecureStorage.deleteItemAsync("session");
            set({ session: null, user: null });
            return;
          }
          await webSecureStorage.setItemAsync(
            "session",
            JSON.stringify(session)
          );
          set({ session, user: session.user });
        } else {
          await webSecureStorage.deleteItemAsync("session");
          set({ session: null, user: null });
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
        // Skip localStorage access on server-side
        if (typeof window === "undefined") {
          set({ hasCompletedOnboarding: value });
          return;
        }
        await webSecureStorage.setItemAsync(
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
        // Skip hydration on server-side
        if (typeof window === "undefined") {
          set({ hydrated: true });
          return;
        }

        const [rawSession, onboarded] = await Promise.all([
          webSecureStorage.getItemAsync("session"),
          webSecureStorage.getItemAsync("onboardingComplete"),
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
              parsed.user.id &&
              parsed.expires_at
            ) {
              // Check if session is expired
              const now = Date.now() / 1000; // Convert to seconds
              if (parsed.expires_at > now) {
                set({ session: parsed, user: parsed.user });
              } else {
                console.log("Stored session has expired, clearing...");
                await webSecureStorage.deleteItemAsync("session");
                set({ session: null, user: null });
              }
            } else {
              console.warn(
                "Invalid session data found in storage, clearing..."
              );
              await webSecureStorage.deleteItemAsync("session");
              set({ session: null, user: null });
            }
          } catch (parseError) {
            console.error("Failed to parse stored session:", parseError);
            await webSecureStorage.deleteItemAsync("session");
            set({ session: null, user: null });
          }
        }

        // Only set onboarding as completed if we have a valid value
        // On fresh install, this should be null/undefined, so default to false
        const hasOnboarded = onboarded === "true";
        set({ hasCompletedOnboarding: hasOnboarded });

        // If onboarding flag is set but we have no session, something might be wrong
        // This could indicate a partial state from a previous install
        if (hasOnboarded && !parsed) {
          console.log(
            "Onboarding flag set but no valid session found - this might be stale data"
          );
        }
      } catch (e) {
        console.error("Failed to hydrate auth store", e);
        // Ensure session is null on error
        set({ session: null, user: null, hasCompletedOnboarding: false });
      } finally {
        set({ hydrated: true });
      }
    },

    validateSession: async (): Promise<boolean> => {
      // Immediate validation: if we have a stored session, return true immediately
      const state = get();
      if (state.session) {
        console.log("Using stored session immediately");
        return true;
      }

      // Only validate if no session exists
      if (state.isValidating) {
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

    validateSessionInBackground: () => {
      // Non-blocking background validation
      const state = get();
      if (!state.session || state.isValidating) {
        return; // No session to validate or already validating
      }

      // Run validation in background without affecting app flow
      setTimeout(async () => {
        try {
          const { isConnected } = await checkNetworkConnectivity();

          if (!isConnected) {
            console.log("Offline: Skipping background validation");
            return;
          }

          console.log("Running background session validation...");
          await validator.validateSession({
            getState: get,
            setState: set,
          });
          console.log("Background validation completed");
        } catch (error) {
          console.warn("Background validation failed (non-critical):", error);
        }
      }, 0);
    },

    logout: async () => {
      try {
        await Promise.all([
          webSecureStorage.deleteItemAsync("session"),
          webSecureStorage.deleteItemAsync("onboardingComplete"), // Clear onboarding state on logout
          webSecureStorage.deleteItemAsync("app_install_marker"), // Force fresh state on next login
          supabase.auth.signOut(),
        ]);
        set({ session: null, user: null, hasCompletedOnboarding: false });
        console.log("✅ Logout complete - all auth data cleared");
      } catch (error) {
        console.error("Error during logout:", error);
        // Ensure state is cleared even if logout fails
        set({ session: null, user: null, hasCompletedOnboarding: false });
      }
    },
  };
});

// Export singleton validator for external use if needed
export { SessionValidator };
