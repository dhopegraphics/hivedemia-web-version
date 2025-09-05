import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

/**
 * Utility to detect and handle fresh app installations
 * This helps ensure that on a completely fresh install,
 * any stale data is properly cleared
 */

const INSTALL_MARKER_KEY = "app_install_marker";
const CURRENT_APP_VERSION = "1.0.0"; // Update this when you want to force a fresh state

export class FreshInstallDetector {
  /**
   * Check if this is a fresh installation or if we need to clear stale data
   */
  static async checkAndHandleFreshInstall(): Promise<boolean> {
    try {
      const installMarker = await SecureStore.getItemAsync(INSTALL_MARKER_KEY);

      // If no install marker exists, this is a fresh install
      if (!installMarker) {
        console.log("Fresh app installation detected");
        await this.clearAllStaleData();
        await this.markInstallation();
        return true;
      }

      // Check if the install marker matches current version
      if (installMarker !== CURRENT_APP_VERSION) {
        console.log("App version changed, clearing stale data");
        await this.clearAllStaleData();
        await this.markInstallation();
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking fresh install:", error);
      // On error, assume fresh install and clear data to be safe
      await this.clearAllStaleData();
      await this.markInstallation();
      return true;
    }
  }

  /**
   * Mark the current installation
   */
  private static async markInstallation(): Promise<void> {
    try {
      await SecureStore.setItemAsync(INSTALL_MARKER_KEY, CURRENT_APP_VERSION);
    } catch (error) {
      console.error("Error marking installation:", error);
    }
  }

  /**
   * Clear all potentially stale data
   */
  private static async clearAllStaleData(): Promise<void> {
    try {
      console.log("Clearing all stale data for fresh start...");

      // Clear specific SecureStore keys that might have stale auth data
      const secureStoreKeys = [
        "session",
        "onboardingComplete",
        "userProfile",
        "userToken",
        "authToken",
        "refreshToken",
        "userPreferences",
        "biometricEnabled",
      ];

      await Promise.allSettled(
        secureStoreKeys.map(async (key) => {
          try {
            await SecureStore.deleteItemAsync(key);
          } catch (error) {
            // Ignore errors for non-existent keys
            console.warn(`Could not delete SecureStore key ${key}:`, error);
          }
        })
      );

      // Clear AsyncStorage as well
      try {
        await AsyncStorage.clear();
      } catch (error) {
        console.warn("Could not clear AsyncStorage:", error);
      }

      console.log("Stale data cleared successfully");
    } catch (error) {
      console.error("Error clearing stale data:", error);
    }
  }

  /**
   * Force a fresh install state (useful for testing or reset scenarios)
   */
  static async forceFreshInstall(): Promise<void> {
    await SecureStore.deleteItemAsync(INSTALL_MARKER_KEY);
    await this.clearAllStaleData();
    console.log("Forced fresh install state");
  }
}
