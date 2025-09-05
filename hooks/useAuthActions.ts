import {
  AccountDeletionData,
  AuthActionsService,
  SignOutFeedback,
} from "@/backend/services/authActions";
import { useAuthStore } from "@/backend/store/authStore";
import { useUserStore } from "@/backend/store/useUserStore";
import { useSubscription } from "@/context/useSubscriptionContext";
import { useState } from "react";
import { useToast } from "./use-toast";
import { useRouter } from "next/navigation";

/**
 * Custom hook for managing enhanced authentication actions
 * Provides secure sign-out and account deletion with proper UX
 */
export const useAuthActions = () => {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { profile } = useUserStore();
  const { clearUserData } = useSubscription();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { toast } = useToast();
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  /**
   * Enhanced sign-out with feedback collection and password validation
   */
  const performEnhancedSignOut = async (
    feedback: SignOutFeedback,
    password: string
  ): Promise<void> => {
    setIsSigningOut(true);

    try {
      // Check network connectivity first
      const hasNetwork = await AuthActionsService.checkNetworkConnectivity();
      if (!hasNetwork) {
        AuthActionsService.showNetworkError();
        return;
      }

      const result = await AuthActionsService.performSecureSignOut(
        feedback,
        password,
        logout,
        () => router.push("/auth/login")
      );

      if (!result.success) {
        toast({
          title: "Sign Out Failed",
          description:
            result.message ||
            "An error occurred during sign-out. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Success feedback
      toast({
        title: "Signed Out Successfully",
        description:
          "Thank you for your feedback. We hope to see you again soon!",
      });
      await clearUserData();
    } catch (error) {
      console.error("Enhanced sign-out error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  /**
   * Enhanced account deletion with double verification
   */
  const performEnhancedAccountDeletion = async (
    data: AccountDeletionData
  ): Promise<void> => {
    setIsDeletingAccount(true);

    try {
      // Check network connectivity first
      const hasNetwork = await AuthActionsService.checkNetworkConnectivity();
      if (!hasNetwork) {
        AuthActionsService.showNetworkError();
        return;
      }

      const result = await AuthActionsService.performSecureAccountDeletion(
        data,
        () => router.push("/auth/login")
      );

      if (!result.success) {
        toast({
          title: "Account Deletion Failed",
          description:
            result.message || "Failed to delete account. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Success feedback
      toast({
        title: "Account Deleted",
        description:
          "Your account has been permanently deleted. Thank you for using Hivedemia.",
      });
      await clearUserData();
    } catch (error) {
      console.error("Enhanced account deletion error:", error);
      toast({
        title: "Error",
        description:
          "An unexpected error occurred during account deletion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  /**
   * Validates if user can perform authentication actions
   */
  const validateAuthActions = async (): Promise<boolean> => {
    try {
      // Check if user is authenticated
      const hasNetwork = await AuthActionsService.checkNetworkConnectivity();
      if (!hasNetwork) {
        AuthActionsService.showNetworkError();
        return false;
      }

      return true;
    } catch (error) {
      console.error("Auth actions validation error:", error);
      toast({
        title: "Validation Error",
        description:
          "Unable to validate current session. Please sign in again.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    // State
    isSigningOut,
    isDeletingAccount,
    userEmail: profile?.email,

    // Actions
    performEnhancedSignOut,
    performEnhancedAccountDeletion,
    validateAuthActions,

    // Utilities
    isPerformingAction: isSigningOut || isDeletingAccount,
  };
};
