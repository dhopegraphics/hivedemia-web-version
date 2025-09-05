import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const TUTORIAL_KEYS = {
  QUIZ_ROOM: "quiz_room_tutorial_completed",
  HOME_PAGE: "home_page_tutorial_completed",
  // Add more tutorial keys here for other screens
} as const;

type TutorialKey = keyof typeof TUTORIAL_KEYS;

export const useTutorial = (tutorialKey: TutorialKey) => {
  const [shouldShowTutorial, setShouldShowTutorial] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkTutorialStatus = useCallback(async () => {
    try {
      const storageKey = TUTORIAL_KEYS[tutorialKey];
      const completed = await AsyncStorage.getItem(storageKey);
      setShouldShowTutorial(!completed);
    } catch (error) {
      console.error("Error checking tutorial status:", error);
      // If there's an error, show the tutorial to be safe
      setShouldShowTutorial(true);
    } finally {
      setIsLoading(false);
    }
  }, [tutorialKey]);

  useEffect(() => {
    checkTutorialStatus();
  }, [checkTutorialStatus]);

  const markTutorialAsCompleted = async () => {
    try {
      const storageKey = TUTORIAL_KEYS[tutorialKey];
      await AsyncStorage.setItem(storageKey, "true");
      setShouldShowTutorial(false);
    } catch (error) {
      console.error("Error marking tutorial as completed:", error);
    }
  };

  const resetTutorial = async () => {
    try {
      const storageKey = TUTORIAL_KEYS[tutorialKey];
      await AsyncStorage.removeItem(storageKey);
      setShouldShowTutorial(true);
    } catch (error) {
      console.error("Error resetting tutorial:", error);
    }
  };

  return {
    shouldShowTutorial,
    isLoading,
    markTutorialAsCompleted,
    resetTutorial,
  };
};
