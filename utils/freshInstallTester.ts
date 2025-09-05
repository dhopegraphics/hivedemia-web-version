/**
 * Test script to verify fresh install detection and cleanup
 * This can be run manually for testing purposes
 */

import * as SecureStore from "expo-secure-store";
import { FreshInstallDetector } from "./freshInstallDetector";

export class FreshInstallTester {
  /**
   * Simulate a fresh install by clearing the install marker
   */
  static async simulateFreshInstall(): Promise<void> {
    console.log("🧪 Simulating fresh install...");
    await FreshInstallDetector.forceFreshInstall();
    console.log("✅ Fresh install simulation complete");
  }

  /**
   * Check current install state
   */
  static async checkInstallState(): Promise<void> {
    try {
      const installMarker = await SecureStore.getItemAsync(
        "app_install_marker"
      );
      const session = await SecureStore.getItemAsync("session");
      const onboarding = await SecureStore.getItemAsync("onboardingComplete");

      console.log("📊 Current install state:", {
        installMarker: installMarker || "not set",
        hasSession: !!session,
        onboardingComplete: onboarding || "not set",
      });
    } catch (error) {
      console.error("Error checking install state:", error);
    }
  }

  /**
   * Test the complete fresh install flow
   */
  static async testFreshInstallFlow(): Promise<void> {
    console.log("🧪 Testing fresh install flow...");

    // 1. Check initial state
    console.log("1. Initial state:");
    await this.checkInstallState();

    // 2. Run fresh install detection
    console.log("\n2. Running fresh install detection:");
    const isFresh = await FreshInstallDetector.checkAndHandleFreshInstall();
    console.log("Is fresh install:", isFresh);

    // 3. Check state after detection
    console.log("\n3. State after detection:");
    await this.checkInstallState();

    console.log("✅ Fresh install flow test complete");
  }
}

// Export for manual testing
// Usage: import { FreshInstallTester } from './utils/freshInstallTester';
// Then call: FreshInstallTester.testFreshInstallFlow();
