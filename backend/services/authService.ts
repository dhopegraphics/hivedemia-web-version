import { supabase, isSupabaseConfigured } from "@/backend/supabase";
import { signUpWithProfile, checkUsernameAvailability } from "./auth";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  fullName: string;
  username?: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    username?: string;
  };
}

export interface AuthResponse {
  user: AuthUser | null;
  error: string | null;
  needsVerification?: boolean;
}

/**
 * Authentication service for login and signup operations
 */
export class AuthService {
  /**
   * Sign in with email and password
   */
  static async signIn(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { email, password } = credentials;

      // Check if Supabase is configured
      if (!isSupabaseConfigured) {
        return {
          user: null,
          error:
            "Authentication service is not configured. Please check your environment variables.",
        };
      }

      // Validate input
      if (!email || !password) {
        return {
          user: null,
          error: "Email and password are required",
        };
      }

      // Attempt to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        // Handle specific error cases
        if (error.message.includes("Invalid login credentials")) {
          return {
            user: null,
            error:
              "Invalid email or password. Please check your credentials and try again.",
          };
        }

        if (error.message.includes("Email not confirmed")) {
          return {
            user: null,
            error:
              "Please verify your email address before signing in. Check your inbox for the verification link.",
            needsVerification: true,
          };
        }

        if (error.message.includes("Too many requests")) {
          return {
            user: null,
            error:
              "Too many login attempts. Please wait a few minutes before trying again.",
          };
        }

        return {
          user: null,
          error: error.message || "Failed to sign in. Please try again.",
        };
      }

      if (!data?.user) {
        return {
          user: null,
          error: "Sign in failed. Please try again.",
        };
      }

      return {
        user: data.user,
        error: null,
      };
    } catch (error) {
      console.error("Sign in error:", error);
      return {
        user: null,
        error: "An unexpected error occurred. Please try again.",
      };
    }
  }

  /**
   * Sign up with email, password, and profile information
   */
  static async signUp(signupData: SignupData): Promise<AuthResponse> {
    try {
      const { email, password, fullName, username } = signupData;

      // Check if Supabase is configured
      if (!isSupabaseConfigured) {
        return {
          user: null,
          error:
            "Authentication service is not configured. Please check your environment variables.",
        };
      }

      // Generate username if not provided
      const finalUsername = username || this.generateUsernameFromEmail(email);

      // Use the existing signUpWithProfile function from auth.js
      const result = await signUpWithProfile(
        email,
        password,
        fullName,
        finalUsername
      );

      if (result.error) {
        return {
          user: null,
          error: result.error,
        };
      }

      return {
        user: result.user,
        error: null,
        needsVerification: true, // Supabase requires email verification by default
      };
    } catch (error) {
      console.error("Sign up error:", error);
      return {
        user: null,
        error:
          "An unexpected error occurred during registration. Please try again.",
      };
    }
  }

  /**
   * Generate a username from email
   */
  private static generateUsernameFromEmail(email: string): string {
    const baseUsername = email.split("@")[0].toLowerCase();
    // Remove any non-alphanumeric characters except underscore
    const cleanUsername = baseUsername.replace(/[^a-z0-9_]/g, "");
    // Ensure it starts with a letter
    return cleanUsername.match(/^[a-z]/) ? cleanUsername : `u${cleanUsername}`;
  }

  /**
   * Check if username is available
   */
  static async isUsernameAvailable(
    username: string
  ): Promise<{ available: boolean; error: string | null }> {
    try {
      const result = await checkUsernameAvailability(username);
      return {
        available: result.available,
        error: result.error,
      };
    } catch (error) {
      console.error("Username availability check error:", error);
      return {
        available: false,
        error: "Unable to check username availability. Please try again.",
      };
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      console.error("Sign out error:", error);
      return { error: "Failed to sign out. Please try again." };
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      if (!email) {
        return { error: "Email address is required" };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      console.error("Password reset error:", error);
      return { error: "Failed to send reset email. Please try again." };
    }
  }

  /**
   * Resend verification email
   */
  static async resendVerification(
    email: string
  ): Promise<{ error: string | null }> {
    try {
      if (!email) {
        return { error: "Email address is required" };
      }

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      console.error("Resend verification error:", error);
      return {
        error: "Failed to resend verification email. Please try again.",
      };
    }
  }
}
