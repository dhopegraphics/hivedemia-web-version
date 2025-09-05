import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

export interface QuizValidationResult {
  canGenerate: boolean;
  reason?: string;
  shouldShowUpgrade?: boolean;
}

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  canAccessAdvancedQuizOptions: boolean;
}

/**
 * Validates if user can generate a quiz based on their subscription status and quota
 */
export const validateQuizGeneration = async (
  subscriptionStatus: SubscriptionStatus
): Promise<QuizValidationResult> => {
  const { hasActiveSubscription, canAccessAdvancedQuizOptions } =
    subscriptionStatus;

  try {
    if (!hasActiveSubscription) {
      // FREE USERS: Only 1 quiz generation EVER
      const hasGeneratedFlag = await AsyncStorage.getItem(
        "hasGeneratedFreeQuiz"
      );
      if (hasGeneratedFlag === "true") {
        return {
          canGenerate: false,
          reason:
            "Free users can only generate one quiz. Please upgrade to generate more quizzes.",
          shouldShowUpgrade: true,
        };
      }
      return { canGenerate: true };
    }

    if (hasActiveSubscription && !canAccessAdvancedQuizOptions) {
      // BASIC SUBSCRIBERS: 2 quiz limit
      const basicQuizCountStr = await AsyncStorage.getItem(
        "basicSubscriberQuizCount"
      );
      const basicQuizCount = basicQuizCountStr ? Number(basicQuizCountStr) : 0;

      if (basicQuizCount >= 2) {
        return {
          canGenerate: false,
          reason:
            "You have reached your 2-quiz limit. Upgrade to Premium for unlimited access.",
          shouldShowUpgrade: true,
        };
      }
      return { canGenerate: true };
    }

    // PREMIUM SUBSCRIBERS: Unlimited access
    return { canGenerate: true };
  } catch (error) {
    console.error("Error validating quiz generation:", error);
    return {
      canGenerate: false,
      reason: "Error checking quota. Please try again.",
    };
  }
};

/**
 * Updates quota tracking after successful quiz creation
 */
export const updateQuotaAfterGeneration = async (
  subscriptionStatus: SubscriptionStatus
): Promise<void> => {
  const { hasActiveSubscription, canAccessAdvancedQuizOptions } =
    subscriptionStatus;

  try {
    if (!hasActiveSubscription) {
      // FREE USERS: Mark that they have generated their one quiz
      await AsyncStorage.setItem("hasGeneratedFreeQuiz", "true");
    } else if (hasActiveSubscription && !canAccessAdvancedQuizOptions) {
      // BASIC SUBSCRIBERS: Increment quiz count after successful generation
      const basicQuizCountStr = await AsyncStorage.getItem(
        "basicSubscriberQuizCount"
      );
      const currentCount = basicQuizCountStr ? Number(basicQuizCountStr) : 0;
      await AsyncStorage.setItem(
        "basicSubscriberQuizCount",
        String(currentCount + 1)
      );
    }
    // PREMIUM SUBSCRIBERS: No quota tracking needed
  } catch (error) {
    console.error("Error updating quota after generation:", error);
    throw error;
  }
};

/**
 * Loads current quota state for display purposes
 */
export const loadQuotaState = async (
  subscriptionStatus: SubscriptionStatus
): Promise<{
  hasGeneratedOnce: boolean;
  basicSubscriberQuizCount: number;
}> => {
  const { hasActiveSubscription, canAccessAdvancedQuizOptions } =
    subscriptionStatus;

  try {
    // Load persistent "generate once" flag for free users
    const hasGeneratedFlag = await AsyncStorage.getItem("hasGeneratedFreeQuiz");
    const hasGeneratedOnce = hasGeneratedFlag === "true";

    // Load quiz count for BASIC subscribers
    let basicSubscriberQuizCount = 0;
    if (hasActiveSubscription && !canAccessAdvancedQuizOptions) {
      const countValue = await AsyncStorage.getItem("basicSubscriberQuizCount");
      basicSubscriberQuizCount = countValue ? Number(countValue) : 0;
    }

    return {
      hasGeneratedOnce,
      basicSubscriberQuizCount,
    };
  } catch (error) {
    console.error("Failed to load quota state:", error);
    return {
      hasGeneratedOnce: false,
      basicSubscriberQuizCount: 0,
    };
  }
};

/**
 * Shows appropriate alert for quiz generation limits
 */
export const showQuizLimitAlert = (
  reason: string,
  shouldShowUpgrade: boolean,
  onUpgrade: () => void
): void => {
  if (shouldShowUpgrade) {
    Alert.alert("Quiz Generation Limit Reached", reason, [
      { text: "Maybe Later", style: "cancel" },
      {
        text: "Upgrade Now",
        onPress: onUpgrade,
      },
    ]);
  } else {
    Alert.alert("Error", reason);
  }
};
