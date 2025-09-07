import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AuthService,
  LoginCredentials,
  SignupData,
} from "@/backend/services/authService";
import { useToast } from "./use-toast";

export interface UseAuthReturn {
  // Login
  signIn: (credentials: LoginCredentials) => Promise<boolean>;
  isSigningIn: boolean;

  // Signup
  signUp: (data: SignupData) => Promise<boolean>;
  isSigningUp: boolean;

  // General
  error: string | null;
  clearError: () => void;

  // Verification
  resendVerification: (email: string) => Promise<boolean>;
  isResendingVerification: boolean;
}

/**
 * Custom hook for authentication operations
 */
export function useAuth(): UseAuthReturn {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  const clearError = () => setError(null);

  const signIn = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsSigningIn(true);
    setError(null);

    try {
      console.log("🔄 Starting sign in process...");
      const result = await AuthService.signIn(credentials);

      if (result.error) {
        console.log("❌ Sign in failed:", result.error);
        setError(result.error);

        if (result.needsVerification) {
          toast({
            title: "Email Verification Required",
            description:
              "Please check your email and click the verification link.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign In Failed",
            description: result.error,
            variant: "destructive",
          });
        }

        return false;
      }

      if (result.user) {
        console.log("✅ Sign in successful, user:", result.user.email);

        // The Supabase auth state listener should automatically handle session management
        // No need to manually set session here to avoid conflicts

        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });

        console.log("🔄 Redirecting to dashboard...");
        // Use setTimeout to ensure toast shows before redirect
        setTimeout(() => {
          router.push("/dashboard");
        }, 100);

        return true;
      }

      return false;
    } catch (err) {
      console.error("Sign in error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSigningIn(false);
    }
  };

  const signUp = async (data: SignupData): Promise<boolean> => {
    setIsSigningUp(true);
    setError(null);

    try {
      const result = await AuthService.signUp(data);

      if (result.error) {
        setError(result.error);
        toast({
          title: "Registration Failed",
          description: result.error,
          variant: "destructive",
        });
        return false;
      }

      if (result.user) {
        if (result.needsVerification) {
          toast({
            title: "Registration Successful!",
            description:
              "Please check your email to verify your account before signing in.",
          });

          // Redirect to login page
          router.push("/auth/login");
        } else {
          // If no verification needed, session should already be set by Supabase auth listener
          // No need to manually get and set session here
          toast({
            title: "Welcome to Hivedemia!",
            description: "Your account has been created successfully.",
          });

          router.push("/dashboard");
        }

        return true;
      }

      return false;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSigningUp(false);
    }
  };

  const resendVerification = async (email: string): Promise<boolean> => {
    setIsResendingVerification(true);
    setError(null);

    try {
      const result = await AuthService.resendVerification(email);

      if (result.error) {
        setError(result.error);
        toast({
          title: "Failed to Send Email",
          description: result.error,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Verification Email Sent",
        description: "Please check your email for the verification link.",
      });

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      toast({
        title: "Failed to Send Email",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsResendingVerification(false);
    }
  };

  return {
    signIn,
    isSigningIn,
    signUp,
    isSigningUp,
    error,
    clearError,
    resendVerification,
    isResendingVerification,
  };
}
