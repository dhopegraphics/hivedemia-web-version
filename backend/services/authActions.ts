import { supabase } from "@/backend/supabase";
import { clearAllLocalDatabases } from "@/utils/clearSnapToSolveDatabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";

// Types for feedback and validation
export interface SignOutFeedback {
  reason: string;
  additionalComments?: string;
}

export interface AccountDeletionData {
  password: string;
  email: string;
  feedback?: string;
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Enhanced Authentication Actions Service
 * Provides secure sign-out and account deletion with proper validation
 */
export class AuthActionsService {
  /**
   * Validates user password by attempting to sign in
   */
  static async validateUserPassword(
    email: string,
    password: string
  ): Promise<ValidationResult> {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          return { isValid: false, message: "Incorrect password" };
        }
        return { isValid: false, message: error.message };
      }

      return { isValid: true };
    } catch (error) {
      console.error("Password validation error:", error);
      return { isValid: false, message: "Failed to validate password" };
    }
  }

  /**
   * Validates email format and matches current user
   */
  static async validateUserEmail(
    inputEmail: string
  ): Promise<ValidationResult> {
    try {
      const { data: userData, error } = await supabase.auth.getUser();

      if (error || !userData?.user?.email) {
        return { isValid: false, message: "Unable to verify current user" };
      }

      const normalizedInput = inputEmail.toLowerCase().trim();
      const normalizedUserEmail = userData.user.email.toLowerCase().trim();

      if (normalizedInput !== normalizedUserEmail) {
        return { isValid: false, message: "Email does not match your account" };
      }

      return { isValid: true };
    } catch (error) {
      console.error("Email validation error:", error);
      return { isValid: false, message: "Failed to validate email" };
    }
  }

  /**
   * Sends sign-out feedback to analytics/backend
   */
  static async submitSignOutFeedback(feedback: SignOutFeedback): Promise<void> {
    try {
      // You can implement your analytics or feedback submission here
      // For now, we'll log it and optionally store it
      console.log("Sign-out feedback:", feedback);

      // Optional: Send to your analytics service
      // await Analytics.track('user_sign_out', feedback);

      // Optional: Store in Supabase for analysis
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        await supabase
          .from("user_feedback")
          .insert({
            user_id: userData.user.id,
            type: "sign_out",
            reason: feedback.reason,
            comments: feedback.additionalComments,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
      }
    } catch (error) {
      console.warn("Failed to submit sign-out feedback:", error);
      // Don't block sign-out if feedback submission fails
    }
  }

  /**
   * Sends account deletion feedback to analytics/backend
   */
  static async submitDeletionFeedback(feedback: string): Promise<void> {
    try {
      console.log("Account deletion feedback:", feedback);

      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        await supabase
          .from("user_feedback")
          .insert({
            user_id: userData.user.id,
            type: "account_deletion",
            reason: feedback,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
      }
    } catch (error) {
      console.warn("Failed to submit deletion feedback:", error);
    }
  }

  /**
   * Clears all AsyncStorage data
   */
  static async clearAllAsyncStorage(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.warn("Failed to clear AsyncStorage:", error);
    }
  }

  /**
   * Clears all SecureStore data
   */
  static async clearAllSecureStore(): Promise<void> {
    try {
      const keys = [
        "userToken",
        "userProfile",
        "session",
        "onboardingComplete",
        "authToken",
        "refreshToken",
        "userPreferences",
        "biometricEnabled",
      ];

      await Promise.all(
        keys.map(async (key) => {
          try {
            await SecureStore.deleteItemAsync(key);
          } catch (error) {
            console.warn(`Failed to delete SecureStore key ${key}:`, error);
          }
        })
      );
    } catch (error) {
      console.warn("Failed to clear SecureStore:", error);
    }
  }

  /**
   * Deletes all SQLite databases
   */
  static async deleteAllSQLiteDatabases(): Promise<void> {
    try {
      const sqliteDir = FileSystem.documentDirectory + "SQLite";
      const dirInfo = await FileSystem.getInfoAsync(sqliteDir);

      if (dirInfo.exists) {
        const files = await FileSystem.readDirectoryAsync(sqliteDir);
        await Promise.all(
          files.map((file) =>
            FileSystem.deleteAsync(`${sqliteDir}/${file}`, { idempotent: true })
          )
        );
      }
    } catch (error) {
      console.warn("Failed to delete SQLite databases:", error);
    }
  }

  /**
   * Comprehensive local data cleanup
   */
  static async performCompleteDataCleanup(): Promise<void> {
    try {
      await Promise.all([
        this.clearAllAsyncStorage(),
        this.clearAllSecureStore(),
        this.deleteAllSQLiteDatabases(),
        clearAllLocalDatabases(),
      ]);
    } catch (error) {
      console.error("Error during data cleanup:", error);
      throw new Error("Failed to clean up local data completely");
    }
  }

  /**
   * Enhanced secure sign-out with feedback and password validation
   */
  static async performSecureSignOut(
    feedback: SignOutFeedback,
    password: string,
    logout: () => Promise<void>
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // 1. Get current user email for password validation
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData?.user?.email) {
        return { success: false, message: "Unable to verify current user" };
      }

      // 2. Validate password
      const passwordValidation = await this.validateUserPassword(
        userData.user.email,
        password
      );

      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: passwordValidation.message || "Password validation failed",
        };
      }

      // 3. Submit feedback (non-blocking)
      await this.submitSignOutFeedback(feedback);

      // 4. Perform sign-out using the store's logout function
      await logout();

      // 5. Clean up navigation and redirect
      router.dismissAll();
      router.replace("/(auth)");

      return { success: true };
    } catch (error) {
      console.error("Error during secure sign-out:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Sign-out failed",
      };
    }
  }

  /**
   * Enhanced secure account deletion with multiple validations
   */
  static async performSecureAccountDeletion(
    data: AccountDeletionData
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // 1. Get current user
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData?.user) {
        return { success: false, message: "No authenticated user found" };
      }

      // 2. Validate email
      const emailValidation = await this.validateUserEmail(data.email);
      if (!emailValidation.isValid) {
        return {
          success: false,
          message: emailValidation.message || "Email validation failed",
        };
      }

      // 3. Validate password
      const passwordValidation = await this.validateUserPassword(
        userData.user.email!,
        data.password
      );

      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: passwordValidation.message || "Password validation failed",
        };
      }

      // 4. Submit deletion feedback (non-blocking)
      if (data.feedback) {
        await this.submitDeletionFeedback(data.feedback);
      }

      // 5. Delete account from Supabase
      const { error: deleteError } = await supabase.rpc("delete_user");
      if (deleteError) {
        console.error("Supabase delete error:", deleteError.message);
        return {
          success: false,
          message: "Failed to delete account from server. Please try again.",
        };
      }

      // 6. Perform complete local data cleanup
      await this.performCompleteDataCleanup();

      // 7. Navigate to auth screen
      router.dismissAll();
      router.replace("/(auth)");

      return { success: true };
    } catch (error) {
      console.error("Error during account deletion:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Account deletion failed",
      };
    }
  }

  /**
   * Check if user has network connectivity
   */
  static async checkNetworkConnectivity(): Promise<boolean> {
    try {
      const response = await fetch("https://www.google.com", {
        method: "HEAD",
        cache: "no-cache",
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Show network error alert
   */
  static showNetworkError(): void {
    Alert.alert(
      "No Internet Connection",
      "Please check your internet connection and try again.",
      [{ text: "OK", style: "default" }]
    );
  }
}
