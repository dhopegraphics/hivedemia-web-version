/**
 * Keyboard Controller Setup Utility
 *
 * This file ensures react-native-keyboard-controller is properly initialized
 * and provides fallbacks to prevent crashes when the native module isn't ready.
 */

import { Platform } from "react-native";

let isInitialized = false;

// Polyfill for KeyboardController if the native module isn't ready
export const initializeKeyboardController = () => {
  if (isInitialized) return;

  try {
    // Only run on native platforms
    if (Platform.OS === "web") {
      isInitialized = true;
      return;
    }

    // Dynamically import and initialize keyboard controller
    import("react-native-keyboard-controller")
      .then(({ KeyboardController }) => {
        try {
          // Check if the preload method exists and initialize it
          if (
            KeyboardController &&
            typeof KeyboardController.preload === "function"
          ) {
            KeyboardController.preload();
          } else if (KeyboardController) {
            // Create a polyfill for the preload method if it doesn't exist
            KeyboardController.preload = () => {};
          }
          isInitialized = true;
        } catch (preloadError) {
          console.warn("KeyboardController.preload error:", preloadError);
          // Still mark as initialized to prevent repeated attempts
          isInitialized = true;
        }
      })
      .catch((importError) => {
        console.warn("KeyboardController module not available:", importError);
        isInitialized = true;
      });
  } catch (error) {
    console.warn("KeyboardController initialization failed:", error);
    isInitialized = true;
  }
};

// Safe keyboard controller access
export const getSafeKeyboardController = async () => {
  try {
    const { KeyboardController } = await import(
      "react-native-keyboard-controller"
    );

    // Ensure preload method exists
    if (!KeyboardController.preload) {
      KeyboardController.preload = () => {};
    }

    return KeyboardController;
  } catch (error) {
    console.warn("Could not access KeyboardController:", error);
    // Return a mock object with required methods
    return {
      preload: () => console.log("Mock KeyboardController.preload called"),
    };
  }
};

// Initialize keyboard controller on import
initializeKeyboardController();
