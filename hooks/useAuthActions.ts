import {
  AccountDeletionData,
  AuthActionsService,
  SignOutFeedback,
} from "@/backend/services/authActions";
import { useAuthStore } from "@/backend/store/authStore";
import { useUserStore } from "@/backend/store/useUserStore";
import { useSubscription } from "@/context/useSubscriptionContext";
import { useState } from "react";
import { Alert } from "react-native";

/**
 * Custom hook for managing enhanced authentication actions
 * Provides secure sign-out and account deletion with proper UX
 */
export const useAuthActions = () => {
  const { logout } = useAuthStore();
  const { profile } = useUserStore();
  const { clearUserData } = useSubscription();
  const [isSigningOut, setIsSigningOut] = useState(false);
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
        logout
      );

      if (!result.success) {
        Alert.alert(
          "Sign Out Failed",
          result.message ||
            "An error occurred during sign-out. Please try again.",
          [{ text: "OK", style: "default" }]
        );
        return;
      }

      // Success feedback
      Alert.alert(
        "Signed Out Successfully",
        "Thank you for your feedback. We hope to see you again soon!",
        [{ text: "OK", style: "default" }]
      );
      await clearUserData();
    } catch (error) {
      console.error("Enhanced sign-out error:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.", [
        { text: "OK", style: "default" },
      ]);
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
        data
      );

      if (!result.success) {
        Alert.alert(
          "Account Deletion Failed",
          result.message || "Failed to delete account. Please try again.",
          [{ text: "OK", style: "default" }]
        );
        return;
      }

      // Success feedback
      Alert.alert(
        "Account Deleted",
        "Your account has been permanently deleted. Thank you for using Hivedemia.",
        [{ text: "OK", style: "default" }]
      );
      await clearUserData();
    } catch (error) {
      console.error("Enhanced account deletion error:", error);
      Alert.alert(
        "Error",
        "An unexpected error occurred during account deletion. Please try again.",
        [{ text: "OK", style: "default" }]
      );
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
      Alert.alert(
        "Validation Error",
        "Unable to validate current session. Please sign in again.",
        [{ text: "OK", style: "default" }]
      );
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
