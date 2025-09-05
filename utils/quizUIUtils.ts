import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export interface TabAnimationState {
  tabPosition: { value: number };
  tabIndicatorStyle: any;
}

/**
 * Custom hook for tab animation utilities in quiz room
 */
export const useTabAnimation = (width: number): TabAnimationState => {
  const tabPosition = useSharedValue(0);

  const tabIndicatorStyle = useAnimatedStyle(() => {
    const containerWidth = width - 32; // Account for padding
    const tabWidth = containerWidth / 3; // Width of each tab

    return {
      position: "absolute",
      width: tabWidth - 8, // Slightly smaller than tab for better visual
      height: "90%",
      backgroundColor: "rgba(255, 255, 255, 0.3)",
      borderRadius: 6,
      transform: [{ translateX: 4 + tabPosition.value * tabWidth }], // 4px offset for padding
      top: "18%",
      left: 0,
    };
  });

  return {
    tabPosition,
    tabIndicatorStyle,
  };
};

/**
 * Handles tab change animation and state update for 3 tabs
 */
export const handleTabChange = (
  tab: string,
  tabPosition: { value: number },
  setActiveTab: (tab: string) => void
): void => {
  let targetPosition = 0;

  if (tab === "generate") {
    targetPosition = 0;
  } else if (tab === "import") {
    targetPosition = 1;
  } else if (tab === "previous") {
    targetPosition = 2;
  }

  tabPosition.value = withTiming(targetPosition, {
    duration: 300,
  });
  setActiveTab(tab);
};

/**
 * Creates navigation functions that can be called with router instance
 */
export const createNavigationFunctions = (router: any) => ({
  /**
   * Navigates to quiz completion screen
   */
  navigateToQuizCompletion: (quizId: string): void => {
    router.push({
      pathname: "/QuizHome/Active" as any,
      params: { quizId },
    });
  },

  /**
   * Navigates to subscription screen
   */
  navigateToSubscription: (): void => {
    router.push("/Subscription");
  },
});
