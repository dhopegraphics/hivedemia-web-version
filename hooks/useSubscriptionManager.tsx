import { useSubscription } from "@/context/useSubscriptionContext";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "./use-toast";

export interface SubscriptionFeatures {
  canUseAI: boolean;
  canGenerateQuiz: boolean;
  canAdaptLecturerStyle: boolean;
  canAccessPremiumContent: boolean;
  canUseOfflineMode: boolean;
  hasUnlimitedAccess: boolean;
  canUsePrioritySupport: boolean;
  canAccessAdvancedQuizOptions: boolean; // Optional for future features
}

export const useSubscriptionManager = () => {
  const router = useRouter();
  const { toast } = useToast();
  const {
    currentSubscription,
    subscriptionPlans,
    isLoading,
    isSyncing,
    paymentInProgress,
    initializePayment,
    cancelSubscription,
    renewSubscription,
    checkSubscriptionStatus,
    refreshSubscriptionData,
    isFeatureUnlocked,
    getRemainingDays,
    autoRenewSubscription,
  } = useSubscription();

  const [features, setFeatures] = useState<SubscriptionFeatures>({
    canUseAI: false,
    canGenerateQuiz: false,
    canAdaptLecturerStyle: false,
    canAccessPremiumContent: false,
    canUseOfflineMode: false,
    hasUnlimitedAccess: false,
    canUsePrioritySupport: false,
    canAccessAdvancedQuizOptions: false,
  });

  const updateFeatures = useCallback(() => {
    setFeatures({
      canUseAI:
        isFeatureUnlocked("Access to basic AI features") ||
        isFeatureUnlocked("Unlimited AI assistance"),
      canGenerateQuiz:
        isFeatureUnlocked("Limited quiz generation") ||
        isFeatureUnlocked("Advanced quiz generation"),
      canAdaptLecturerStyle: isFeatureUnlocked("Lecturer style adaptation"),
      canAccessPremiumContent: isFeatureUnlocked("Premium study materials"),
      canUseOfflineMode: isFeatureUnlocked("Offline access"),
      hasUnlimitedAccess: isFeatureUnlocked("Unlimited AI assistance"),
      canUsePrioritySupport: isFeatureUnlocked("Priority support"),
      canAccessAdvancedQuizOptions: isFeatureUnlocked("Advanced quiz options"),
    });
  }, [isFeatureUnlocked]);

  // Update features when subscription changes
  useEffect(() => {
    updateFeatures();
  }, [currentSubscription, updateFeatures]);

  const checkFeatureAccess = useCallback(
    (featureName: keyof SubscriptionFeatures): boolean => {
      if (!currentSubscription?.isActive) {
        return false;
      }
      return features[featureName];
    },
    [features, currentSubscription]
  );

  const promptForUpgrade = useCallback(
    (featureName: string) => {
      if (
        confirm(
          `${featureName} is a premium feature. Upgrade your subscription to access it. Would you like to upgrade now?`
        )
      ) {
        router.push("/dashboard/subscription");
      }
    },
    [router]
  );

  const getSubscriptionStatus = useCallback(() => {
    if (!currentSubscription) {
      return {
        status: "none",
        message: "No active subscription",
        color: "#9CA3AF",
      };
    }

    if (!currentSubscription.isActive) {
      return {
        status: "expired",
        message: "Subscription expired",
        color: "#EF4444",
      };
    }

    const remainingDays = getRemainingDays();
    if (remainingDays <= 7) {
      return {
        status: "expiring",
        message: `Expires in ${remainingDays} day${
          remainingDays !== 1 ? "s" : ""
        }`,
        color: "#F59E0B",
      };
    }

    return {
      status: "active",
      message: `Active (${remainingDays} days left)`,
      color: "#10B981",
    };
  }, [currentSubscription, getRemainingDays]);

  const handleSubscriptionAction = useCallback(
    async (action: "cancel" | "autorenew" | "upgrade" | "renew") => {
      try {
        switch (action) {
          case "cancel":
            await cancelSubscription();
            break;
          case "autorenew":
            await autoRenewSubscription();
            break;
          case "renew":
            await renewSubscription();
            break;
          case "upgrade":
            router.push("/Subscription");
            break;
        }
      } catch (error) {
        console.error(`Failed to ${action} subscription:`, error);
        toast({
          title: "Error",
          description: `Failed to ${action} subscription. Please try again.`,
          variant: "destructive",
        });
      }
    },
    [
      cancelSubscription,
      renewSubscription,
      autoRenewSubscription,
      router,
      toast,
    ]
  );

  return {
    // Subscription data
    currentSubscription,
    subscriptionPlans,
    isLoading,
    isSyncing,
    paymentInProgress,

    // Features
    features,
    checkFeatureAccess,
    promptForUpgrade,

    // Status
    getSubscriptionStatus,
    getRemainingDays,

    // Actions
    initializePayment,
    handleSubscriptionAction,
    checkSubscriptionStatus,
    refreshSubscriptionData,
  };
};
