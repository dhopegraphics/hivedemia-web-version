import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AuthService,
  LoginCredentials,
  SignupData,
} from "@/backend/services/authService";
import { useAuthStore } from "@/backend/store/authStore";
import { useToast } from "./use-toast";
import { supabase } from "@/backend/supabase";

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
  const { setSession } = useAuthStore();
  const { toast } = useToast();

  const clearError = () => setError(null);

  const signIn = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsSigningIn(true);
    setError(null);

    try {
      const result = await AuthService.signIn(credentials);

      if (result.error) {
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
        // Get the actual session from Supabase
        const { data: sessionData } = await supabase.auth.getSession();

        if (sessionData?.session && sessionData.session.user?.email) {
          // Create a compatible session object for the auth store
          const compatibleSession = {
            access_token: sessionData.session.access_token,
            refresh_token: sessionData.session.refresh_token,
            user: {
              id: sessionData.session.user.id,
              email: sessionData.session.user.email,
            },
            expires_at:
              sessionData.session.expires_at || Date.now() / 1000 + 3600,
          };

          await setSession(compatibleSession);
        }

        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });

        // Redirect to dashboard
        router.push("/dashboard");
        return true;
      }

      return false;
    } catch (err) {
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
          // If no verification needed, get session from Supabase and set it
          const { data: sessionData } = await supabase.auth.getSession();

          if (sessionData?.session && sessionData.session.user?.email) {
            const compatibleSession = {
              access_token: sessionData.session.access_token,
              refresh_token: sessionData.session.refresh_token,
              user: {
                id: sessionData.session.user.id,
                email: sessionData.session.user.email,
              },
              expires_at:
                sessionData.session.expires_at || Date.now() / 1000 + 3600,
            };

            await setSession(compatibleSession);
          }

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
