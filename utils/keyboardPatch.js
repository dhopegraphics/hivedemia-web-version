/**
 * Keyboard Controller Patch for react-native-gifted-chat compatibility
 *
 * This patch ensures that KeyboardController.preload is available immediately
 * to prevent crashes in react-native-gifted-chat
 */

import { Platform } from "react-native";

// Immediately patch the KeyboardController module if needed
if (Platform.OS !== "web") {
  // Multiple attempts to patch the keyboard controller
  const patchKeyboardController = () => {
    try {
      // Try to patch the module synchronously first
      const KeyboardControllerModule = require("react-native-keyboard-controller");

      if (KeyboardControllerModule) {
        // Check if KeyboardController is directly available
        if (KeyboardControllerModule.KeyboardController) {
          const { KeyboardController } = KeyboardControllerModule;

          // Ensure preload method exists
          if (typeof KeyboardController.preload !== "function") {
            KeyboardController.preload = () => {};
          } else {
          }
        }

        // Also check if KeyboardController is the default export
        if (
          KeyboardControllerModule.default &&
          KeyboardControllerModule.default.KeyboardController
        ) {
          const { KeyboardController } = KeyboardControllerModule.default;

          if (typeof KeyboardController.preload !== "function") {
            KeyboardController.preload = () => {};
          }
        }

        // Patch the module itself if it has a preload method at the top level
        if (KeyboardControllerModule.preload === undefined) {
          KeyboardControllerModule.preload = () => {};
        }
      }
    } catch (error) {
      console.warn("⚠️ Could not patch KeyboardController:", error.message);
    }
  };

  // Immediate patch
  patchKeyboardController();

  // Delayed patch in case module loads later
  setTimeout(patchKeyboardController, 100);
  setTimeout(patchKeyboardController, 500);
  setTimeout(patchKeyboardController, 1000);
}
