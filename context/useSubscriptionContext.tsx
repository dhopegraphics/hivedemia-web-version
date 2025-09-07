import { useAuthStore } from "@/backend/store/authStore";
import { AsyncStorage } from "@/utils/browserStorage";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { supabase } from "../backend/supabase";

// Storage keys for consistent cache management
const STORAGE_KEYS = {
  SUBSCRIPTION: "hivedemia_user_subscription",
  PLANS: "hivedemia_subscription_plans",
  USER_ID: "hivedemia_current_user_id",
  SYNC_TIMESTAMP: "hivedemia_last_sync",
} as const;

// Types
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: number;
  features: string[];
  description: string;
  isPopular?: boolean;
}

export interface UserSubscription {
  id?: string;
  planId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  autoRenew: boolean;
  paymentMethod?: string;
  transactionId?: string;
  userId?: string; // SECURITY: Track which user owns this subscription
}

export interface PaymentConfig {
  merchantAccount: number;
  basicAuth: string;
  callbackUrl: string;
  branding: "enabled" | "disabled";
}

export interface PaymentData {
  transactionId?: string;
  clientReference: string;
  subscriptionId?: string;
  planId: string;
  phone?: string;
  amount: number;
  status: string;
  hubtelResponse?: HubtelPaymentData;
  userId: string;
}

export interface HubtelPaymentData {
  transactionId?: string;
  checkoutId?: string;
  status?: string;
  amount?: number;
  customerPhoneNumber?: string;
  [key: string]: unknown; // For additional Hubtel response fields
}

export interface AuthState {
  user: { id: string; email: string } | null;
}

interface SubscriptionContextType {
  // State
  currentSubscription: UserSubscription | null;
  subscriptionPlans: SubscriptionPlan[];
  isLoading: boolean;
  isInitialLoading: boolean; // New: separate initial load from refresh
  isSyncing: boolean; // New: background sync indicator
  paymentInProgress: boolean;
  currentClientReference: string | null;
  pendingPlanId: string | null;

  // Renewal modal state
  showRenewalModal: boolean;
  renewalPlan: SubscriptionPlan | null;

  // Actions
  initializePayment: (
    plan: SubscriptionPlan,
    customerPhone: string
  ) => Promise<{ paymentUrl: string; clientReference: string }>;
  cancelSubscription: () => Promise<void>;
  renewSubscription: () => Promise<void>;
  checkSubscriptionStatus: () => Promise<void>;
  refreshSubscriptionData: () => Promise<void>;
  syncSubscriptionData: () => Promise<void>; // New: background sync
  manualSyncSubscriptionData: () => Promise<void>; // New: manual sync
  initializeSubscriptionData: () => Promise<void>; // New: for RootLayout initialization
  loadSubscriptionBeforeNavigation: () => Promise<void>; // New: for index screen
  isFeatureUnlocked: (feature: string) => boolean;
  getRemainingDays: () => number;

  // Payment status check
  checkPaymentStatus: (clientReference: string) => Promise<string | null>;

  // Renewal modal handlers
  handleRenewalConfirm: (phoneNumber: string) => Promise<void>;
  handleRenewalCancel: () => void;
  autoRenewSubscription: () => Promise<void>;

  // SECURITY: Clear user data on logout
  clearUserData: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

const clientId = process.env.EXPO_PUBLIC_HUBTEL_API_ID;
const clientSecret = process.env.EXPO_PUBLIC_HUBTEL_API_KEY;

// Configuration for Hubtel Checkout
const PAYMENT_CONFIG: PaymentConfig = {
  merchantAccount: 2030495,
  basicAuth: `${clientId}:${clientSecret}`,
  callbackUrl:
    "https://rbbdyktqphxycjmfzcsw.supabase.co/functions/v1/hubtel-callback",
  branding: "enabled",
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({
  children,
}) => {
  // Core state
  const [currentSubscription, setCurrentSubscription] =
    useState<UserSubscription | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<
    SubscriptionPlan[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Payment state
  const [paymentInProgress, setPaymentInProgress] = useState(false);
  const [currentClientReference, setCurrentClientReference] = useState<
    string | null
  >(null);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);

  // Modal state
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewalPlan, setRenewalPlan] = useState<SubscriptionPlan | null>(null);

  // Control flags
  const isInitializedRef = useRef(false);
  const syncInProgressRef = useRef(false);
  const mountedRef = useRef(true);
  const hasAttemptedInitialOnlineFetchRef = useRef(false);

  // Cache management functions
  const getCachedData = async () => {
    try {
      const [cachedSub, cachedPlans, cachedUserId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION),
        AsyncStorage.getItem(STORAGE_KEYS.PLANS),
        AsyncStorage.getItem(STORAGE_KEYS.USER_ID),
      ]);

      const subscription = cachedSub ? JSON.parse(cachedSub) : null;
      const plans = cachedPlans ? JSON.parse(cachedPlans) : [];

      return { subscription, plans, userId: cachedUserId };
    } catch (error) {
      console.error("❌ Failed to read cache:", error);
      return { subscription: null, plans: [], userId: null };
    }
  };

  const saveCachedData = async (
    subscription: UserSubscription | null,
    plans?: SubscriptionPlan[],
    userId?: string
  ) => {
    try {
      const currentUser = userId || useAuthStore.getState().user?.id;
      if (!currentUser) return;

      const savePromises = [
        AsyncStorage.setItem(STORAGE_KEYS.USER_ID, currentUser),
        AsyncStorage.setItem(
          STORAGE_KEYS.SYNC_TIMESTAMP,
          new Date().toISOString()
        ),
      ];

      if (subscription) {
        const subscriptionWithUser = { ...subscription, userId: currentUser };
        savePromises.push(
          AsyncStorage.setItem(
            STORAGE_KEYS.SUBSCRIPTION,
            JSON.stringify(subscriptionWithUser)
          )
        );
      }

      if (plans && plans.length > 0) {
        savePromises.push(
          AsyncStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans))
        );
      }

      await Promise.all(savePromises);
    } catch (error) {
      console.error("❌ Failed to save cache:", error);
    }
  };

  const clearCachedData = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.SUBSCRIPTION),
        AsyncStorage.removeItem(STORAGE_KEYS.PLANS),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_ID),
        AsyncStorage.removeItem(STORAGE_KEYS.SYNC_TIMESTAMP),
      ]);
    } catch (error) {
      console.error("❌ Failed to clear cache:", error);
    }
  };

  // Load subscription plans from cache first, then sync
  const loadSubscriptionPlans = useCallback(
    async (triggerOnlineSync = false) => {
      try {
        // Always load from cache first for instant display
        const { plans } = await getCachedData();
        if (plans.length > 0) {
          setSubscriptionPlans(plans);
        }

        // If explicitly asked or if no cached plans, trigger online sync
        if (triggerOnlineSync || plans.length === 0) {
          try {
            const { data, error } = await supabase
              .from("subscription_plans")
              .select("*")
              .eq("is_active", true)
              .order("price", { ascending: true });

            if (error) throw error;

            const freshPlans: SubscriptionPlan[] = data.map((plan) => ({
              id: plan.id,
              name: plan.name,
              price: plan.price,
              duration: plan.duration_days,
              features: plan.features,
              description: plan.description,
              isPopular: plan.is_popular,
            }));

            // Only update if data changed
            if (JSON.stringify(freshPlans) !== JSON.stringify(plans)) {
              setSubscriptionPlans(freshPlans);
              await saveCachedData(null, freshPlans);
            }
          } catch (error) {
            console.warn(
              "❌ Background sync of subscription plans failed:",
              error
            );
            // Ignore network errors for background sync
          }
        }
      } catch (error) {
        console.error("❌ Failed to load subscription plans:", error);
      }
    },
    []
  );

  // Load user subscription - try online first on initial mount, fallback to cache
  const loadUserSubscription = useCallback(
    async (triggerOnlineSync = false) => {
      try {
        const currentUser = useAuthStore.getState().user;

        if (!currentUser) {
          setCurrentSubscription(null);
          return;
        }

        // Always load from cache first for instant display
        const { subscription, userId } = await getCachedData();
        if (subscription && userId === currentUser.id) {
          setCurrentSubscription(subscription);
        } else if (subscription && userId !== currentUser.id) {
          // Different user - clear cache
          await clearCachedData();
          setCurrentSubscription(null);
        }

        // If explicitly asked or if no cached subscription, trigger online sync
        if (triggerOnlineSync || !subscription) {
          try {
            const { data, error } = await supabase
              .from("user_subscriptions")
              .select(
                `
              *,
              subscription_plans(*)
            `
              )
              .eq("user_id", currentUser.id)
              .eq("status", "active")
              .single();

            if (error && error.code !== "PGRST116") {
              throw error;
            }

            if (data) {
              const freshSubscription: UserSubscription = {
                id: data.id,
                planId: data.plan_id,
                startDate: data.start_date,
                endDate: data.end_date,
                isActive: data.status === "active",
                autoRenew: data.auto_renew,
                paymentMethod: data.payment_method,
                transactionId: data.transaction_id,
                userId: currentUser.id,
              };

              // Only update if data changed
              if (
                JSON.stringify(freshSubscription) !==
                JSON.stringify(subscription)
              ) {
                setCurrentSubscription(freshSubscription);
                await saveCachedData(
                  freshSubscription,
                  undefined,
                  currentUser.id
                );
              }
            } else if (subscription) {
              // If there was a cached subscription but no online one, clear it
              setCurrentSubscription(null);
              await saveCachedData(null, undefined, currentUser.id);
            }
          } catch (error) {
            console.warn(
              "❌ Background sync of user subscription failed:",
              error
            );
            // Ignore network errors for background sync
          }
        }
      } catch (error) {
        console.error("❌ Failed to load user subscription:", error);
      }
    },
    []
  );

  // Background sync function
  const syncSubscriptionData = useCallback(async () => {
    if (syncInProgressRef.current || !mountedRef.current) return;

    try {
      syncInProgressRef.current = true;
      setIsSyncing(true);

      const currentUser = useAuthStore.getState().user;
      if (!currentUser) {
        setCurrentSubscription(null);
        await clearCachedData();
        return;
      }

      await loadUserSubscription();
    } catch (error) {
      console.error("❌ Background sync failed:", error);
    } finally {
      syncInProgressRef.current = false;
      if (mountedRef.current) {
        setIsSyncing(false);
      }
    }
  }, [loadUserSubscription]);

  // Manual sync for pull-to-refresh
  const manualSyncSubscriptionData = useCallback(async () => {
    await syncSubscriptionData();
  }, [syncSubscriptionData]);

  // Refresh function
  const refreshSubscriptionData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadUserSubscription(), loadSubscriptionPlans()]);
    } catch (error) {
      console.error("❌ Failed to refresh subscription data:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadUserSubscription, loadSubscriptionPlans]);

  // Initialize subscription data for external triggers (e.g., RootLayout)
  const initializeSubscriptionData = useCallback(async () => {
    // Don't duplicate if we've already attempted initial online fetch
    if (hasAttemptedInitialOnlineFetchRef.current) {
      return;
    }

    hasAttemptedInitialOnlineFetchRef.current = true;

    try {
      // Always try to load plans
      await loadSubscriptionPlans(true);

      // Only load user subscription if user is authenticated
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        await loadUserSubscription(true);
      }
    } catch (error) {
      console.error("❌ External initialization failed:", error);
    }
  }, [loadUserSubscription, loadSubscriptionPlans]);

  // Load subscription data before navigation (for index screen)
  const loadSubscriptionBeforeNavigation = useCallback(async () => {
    try {
      // Load subscription plans from cache immediately, then sync in background
      loadSubscriptionPlans(); // No await, no parameter means triggerOnlineSync is false

      // Load user subscription from cache immediately, then sync in background
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        loadUserSubscription(); // No await, no parameter means triggerOnlineSync is false
      } else {
        // If no user, ensure currentSubscription is null and clear cache
        setCurrentSubscription(null);
        clearCachedData();
      }
    } catch (error) {
      console.error("❌ Pre-navigation subscription loading failed:", error);
      // Don't throw - let navigation proceed even if subscription loading fails
    }
  }, [loadUserSubscription, loadSubscriptionPlans]);

  // Initialize on mount
  useEffect(() => {
    if (isInitializedRef.current) return;

    const initialize = async () => {
      try {
        isInitializedRef.current = true;
        hasAttemptedInitialOnlineFetchRef.current = true;

        // Always load subscription plans first (doesn't need user auth)
        await loadSubscriptionPlans(true);

        // Check if user is authenticated, if not, we'll wait for auth change
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          await loadUserSubscription(true);
        } else {
        }
      } catch (error) {
        console.error("❌ Initialization failed:", error);
      } finally {
        setIsInitialLoading(false);
        setIsLoading(false);
      }
    };

    initialize();
  }, [loadUserSubscription, loadSubscriptionPlans]);

  // Listen for auth state changes to load subscription when user becomes available
  useEffect(() => {
    let previousUser: { id: string; email: string } | null =
      useAuthStore.getState().user;

    const unsubscribe = useAuthStore.subscribe((state: AuthState) => {
      const currentUser = state.user;

      if (currentUser && !previousUser) {
        // User just logged in

        loadUserSubscription(true).catch((error) => {
          console.error("❌ Failed to load subscription after login:", error);
        });
      } else if (!currentUser && previousUser) {
        setCurrentSubscription(null);
        clearCachedData().catch((error) => {
          console.error("❌ Failed to clear cache after logout:", error);
        });
      }

      previousUser = currentUser;
    });

    return unsubscribe;
  }, [loadUserSubscription]);

  // Check if we need to load subscription data when component mounts or comes into focus
  useEffect(() => {
    const checkAndLoadSubscription = async () => {
      const currentUser = useAuthStore.getState().user;

      // If user is authenticated but we don't have subscription data, try to load it
      if (currentUser && !currentSubscription && !isLoading && !isSyncing) {
        try {
          await loadUserSubscription(true); // Try online first
        } catch (error) {
          console.error("❌ Failed to load subscription on focus:", error);
        }
      }
    };

    // Check on mount and periodically
    checkAndLoadSubscription();

    // Set up an interval to check periodically (every 30 seconds)
    const interval = setInterval(checkAndLoadSubscription, 30000);

    return () => clearInterval(interval);
  }, [currentSubscription, isLoading, isSyncing, loadUserSubscription]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      syncInProgressRef.current = false;
    };
  }, []);

  const saveSubscriptionToStorage = useCallback(
    async (subscription: UserSubscription) => {
      try {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) {
          console.error("Cannot save subscription: User not authenticated");
          return;
        }

        const subscriptionWithUser = {
          ...subscription,
          userId: currentUser.id,
        };

        await saveCachedData(subscriptionWithUser);
        setCurrentSubscription(subscriptionWithUser);
      } catch (error) {
        console.error("Failed to save subscription to storage:", error);
      }
    },
    []
  );

  const checkSubscriptionStatus = useCallback(async () => {
    if (!currentSubscription) return;

    const now = new Date();
    const endDate = new Date(currentSubscription.endDate);

    if (now > endDate) {
      const expiredSubscription = {
        ...currentSubscription,
        isActive: false,
      };
      await saveSubscriptionToStorage(expiredSubscription);

      toast.error("Subscription Expired", {
        description:
          "Your subscription has expired. Please renew to continue enjoying premium features.",
        action: {
          label: "Renew Now",
          onClick: () => {
            // Add renewal action here
          },
        },
      });
    }
  }, [currentSubscription, saveSubscriptionToStorage]);

  // Check subscription status when it changes
  useEffect(() => {
    if (currentSubscription) {
      checkSubscriptionStatus();
    }
  }, [currentSubscription, checkSubscriptionStatus]);

  const generateClientReference = () => {
    return `hivedemia_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const createPurchaseInfo = (
    plan: SubscriptionPlan,
    customerPhone: string,
    clientReference?: string
  ) => ({
    amount: plan.price,
    purchaseDescription: `${plan.name} subscription for Hivedemia - ${plan.description}`,
    customerPhoneNumber: customerPhone,
    clientReference: clientReference || generateClientReference(),
  });

  const createPendingTransaction = async (
    plan: SubscriptionPlan,
    phone: string,
    clientReference: string
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create pending subscription
      const now = new Date();
      const endDate = new Date(
        now.getTime() + plan.duration * 24 * 60 * 60 * 1000
      );

      const { data: subscription, error: subError } = await supabase
        .from("user_subscriptions")
        .insert({
          user_id: user.id,
          plan_id: plan.id,
          client_reference: clientReference,
          status: "pending", // Start as pending
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          auto_renew: false,
          payment_method: "hubtel",
        })
        .select()
        .single();

      if (subError) throw subError;

      // Create pending payment transaction
      await supabase.from("payment_transactions").insert({
        user_id: user.id,
        subscription_id: subscription.id,
        client_reference: clientReference,
        transaction_id: `pending_${clientReference}`, // Will be updated on success
        amount: plan.price,
        currency: "GHS",
        status: "pending",
        payment_method: "hubtel",
        payment_data: { phone, planId: plan.id },
      });

      return subscription;
    } catch (error) {
      toast.error("Failed to create pending transaction", {
        description: `${error}`,
      });

      throw error;
    }
  };

  const initializePayment = async (
    plan: SubscriptionPlan,
    customerPhone: string
  ) => {
    try {
      setPaymentInProgress(true);

      if (!customerPhone || customerPhone.length < 10) {
        throw new Error("Please provide a valid phone number");
      }

      const clientRef = generateClientReference();
      setCurrentClientReference(clientRef);
      setPendingPlanId(plan.id);
      setPendingPhone(customerPhone);

      const purchaseInfo = createPurchaseInfo(plan, customerPhone, clientRef);
      await createPendingTransaction(plan, customerPhone, clientRef);

      const { data, error } = await supabase.functions.invoke(
        "hubtel-initiate",
        {
          body: {
            planId: plan.id,
            amount: purchaseInfo.amount,
            phone: purchaseInfo.customerPhoneNumber,
            callbackUrl: PAYMENT_CONFIG.callbackUrl,
            clientReference: purchaseInfo.clientReference,
            description: purchaseInfo.purchaseDescription,
          },
        }
      );

      if (error) throw new Error(error.message);

      // Open payment URL in a new tab for web
      if (data.paymentUrl && typeof window !== "undefined") {
        window.open(data.paymentUrl, "_blank", "noopener,noreferrer");
      }

      return { paymentUrl: data.paymentUrl, clientReference: clientRef };
    } catch (error) {
      toast.error("Payment Error", {
        description: `${error || "An error occurred"}`,
      });
      setPaymentInProgress(false);
      throw error;
    }
  };

  const handlePaymentSuccess = async (
    plan: SubscriptionPlan,
    paymentData: PaymentData
  ) => {
    try {
      const { error: subError } = await supabase
        .from("user_subscriptions")
        .update({
          status: "active",
          transaction_id: paymentData.transactionId,
          updated_at: new Date().toISOString(),
        })
        .eq("client_reference", paymentData.clientReference)
        .select();

      if (subError) {
        console.error("Failed to update subscription:", subError);
        throw new Error("Failed to update subscription status");
      }

      const { error: txnError } = await supabase
        .from("payment_transactions")
        .update({
          status: "success",
          transaction_id: paymentData.transactionId,
          hubtel_response: paymentData.hubtelResponse || paymentData,
          updated_at: new Date().toISOString(),
        })
        .eq("client_reference", paymentData.clientReference)
        .select();

      if (txnError) {
        console.error("Failed to update transaction:", txnError);
        // Don't throw here as subscription was already updated
      }

      // Handle payment success
      const updatedSubscription: UserSubscription = {
        id: paymentData.subscriptionId || generateClientReference(),
        planId: plan.id,
        startDate: new Date().toISOString(),
        endDate: new Date(
          Date.now() + plan.duration * 24 * 60 * 60 * 1000
        ).toISOString(),
        isActive: true,
        autoRenew: false,
        paymentMethod: "hubtel",
        transactionId: paymentData.transactionId,
        userId: paymentData.userId,
      };

      await saveSubscriptionToStorage(updatedSubscription);
      setCurrentSubscription(updatedSubscription);

      // Reset payment state
      setPaymentInProgress(false);
      setCurrentClientReference(null);
      setPendingPlanId(null);
      setPendingPhone(null);

      toast.success("Payment Successful!", {
        description: `Your ${plan.name} subscription is now active! You now have access to all premium features.`,
        action: {
          label: "Great!",
          onClick: () => {
            loadUserSubscription();
          },
        },
      });

      return updatedSubscription;
    } catch (error) {
      console.error("Failed to process successful payment:", error);

      // Show error to user but don't fail the payment
      toast.warning("Payment Processed", {
        description:
          "Your payment was successful but there was an issue updating your account. Please contact support if you don't see your subscription activated shortly.",
      });

      throw error;
    }
  };

  const checkPaymentStatus = async (clientReference: string) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "hubtel-status-check",
        {
          body: { clientReference },
        }
      );

      // Handle Supabase function invocation errors
      if (error) {
        console.error("❌ Supabase function error:", error);
        throw new Error(`Edge Function error: ${error.message}`);
      }

      // Handle our custom error responses from the Edge Function
      if (data?.error) {
        console.error("❌ Hubtel API error:", {
          error: data.error,
          details: data.details,
          step: data.step,
        });
        throw new Error(`Hubtel error: ${data.error} - ${data.details}`);
      }

      // Handle missing data
      if (!data || !data.success) {
        console.error("❌ Invalid response structure:", data);
        throw new Error("Invalid response from status check API");
      }

      const paymentStatus = data.data?.status;

      // Process payment based on status
      if (paymentStatus === "Paid") {
        await handleSuccessfulPayment(clientReference, data.data);
        return "Paid";
      } else if (paymentStatus === "Unpaid") {
        // Don't call handleFailedPayment immediately for Unpaid
        // Let the polling continue unless it's been too long
        return "Unpaid";
      } else if (paymentStatus === "Refunded") {
        await handleFailedPayment(clientReference);
        return "Refunded";
      }

      return paymentStatus || null;
    } catch (err) {
      console.error("💥 Payment status check failed:", err);

      // Return null to indicate failure, let the caller decide how to handle
      return null;
    }
  };

  const handleSuccessfulPayment = async (
    clientReference: string,
    hubtelPaymentData: HubtelPaymentData
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get the pending subscription and plan details
      const { data: subscription } = await supabase
        .from("user_subscriptions")
        .select(
          `
          *,
          subscription_plans (
            id,
            name,
            price,
            duration_days,
            features,
            description,
            is_popular
          )
        `
        )
        .eq("client_reference", clientReference)
        .single();

      if (!subscription || !subscription.subscription_plans) {
        throw new Error("Subscription or plan not found");
      }

      // Convert plan data to SubscriptionPlan format
      const planData = subscription.subscription_plans;
      const plan: SubscriptionPlan = {
        id: planData.id,
        name: planData.name,
        price: planData.price,
        duration: planData.duration_days,
        features: planData.features,
        description: planData.description,
        isPopular: planData.is_popular,
      };

      // Format payment data with transaction details
      const formattedPaymentData = {
        transactionId:
          hubtelPaymentData.transactionId || hubtelPaymentData.checkoutId,
        clientReference,
        subscriptionId: subscription.id,
        planId: plan.id,
        phone: pendingPhone || subscription.phone,
        amount: plan.price,
        status: "success",
        hubtelResponse: hubtelPaymentData,
        userId: user.id, // SECURITY: Include user ID
        ...hubtelPaymentData,
      };

      // Call the main payment success handler
      await handlePaymentSuccess(plan, formattedPaymentData);

      return subscription;
    } catch (error) {
      console.error("Failed to process successful payment:", error);
      throw error;
    }
  };

  const handleFailedPayment = async (clientReference: string) => {
    try {
      // Update subscription status to cancelled
      await supabase
        .from("user_subscriptions")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("client_reference", clientReference);

      // Update payment transaction
      await supabase
        .from("payment_transactions")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("client_reference", clientReference);

      // Reset local state
      setCurrentClientReference(null);
      setPendingPlanId(null);
      setPendingPhone(null);
    } catch (error) {
      console.error("Failed to handle payment failure:", error);
      throw error;
    }
  };

  const cancelSubscription = async () => {
    try {
      if (!currentSubscription) {
        throw new Error("No active subscription found");
      }

      // Create audit trail
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User authentication required for cancellation");
      }

      // Begin transaction-safe cancellation
      const cancellationData = {
        status: "cancelled",
        auto_renew: false,
        updated_at: new Date().toISOString(),
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
      };

      // Update subscription in Supabase with error handling
      const { data: updatedSub, error: updateError } = await supabase
        .from("user_subscriptions")
        .update(cancellationData)
        .eq("id", currentSubscription.id)
        .eq("user_id", user.id) // Double verification
        .select()
        .single();

      if (updateError) {
        console.error(
          "❌ Failed to update subscription in database:",
          updateError
        );
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      if (!updatedSub) {
        throw new Error("Subscription update verification failed");
      }

      // Create cancellation audit log
      try {
        await supabase.from("subscription_audit_logs").insert({
          user_id: user.id,
          subscription_id: currentSubscription.id,
          action: "cancelled",
          timestamp: new Date().toISOString(),
          details: {
            original_plan_id: currentSubscription.planId,
            cancellation_reason: "user_requested",
            previous_status: currentSubscription.isActive
              ? "active"
              : "inactive",
          },
        });
      } catch (auditError) {
        // Don't fail cancellation if audit logging fails
        console.warn("⚠️ Failed to create audit log:", auditError);
      }

      // Update local state with transaction safety
      const cancelledSubscription = {
        ...currentSubscription,
        isActive: false,
        autoRenew: false,
        userId: user.id, // SECURITY: Ensure user ID is maintained
      };

      // Update storage first, then state (atomic operation simulation)
      await saveSubscriptionToStorage(cancelledSubscription);
      setCurrentSubscription(cancelledSubscription);

      // Don't show alert here - let the UI component handle success message
    } catch (error) {
      console.error("❌ SECURE CANCELLATION FAILED:", error);

      // Enhanced error logging for production debugging
      const errorDetails = {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        subscriptionId: currentSubscription?.id,
        planId: currentSubscription?.planId,
        stack: error instanceof Error ? error.stack : undefined,
      };

      toast.error("Cancellation Failed", {
        description: `Failed to cancel your subscription. Please try again later. Error: ${errorDetails}`,
      });

      throw error; // Re-throw for UI component to handle
    }
  };

  const renewSubscription = async () => {
    try {
      if (!currentSubscription) {
        throw new Error("No subscription to renew");
      }

      const plan = subscriptionPlans.find(
        (p) => p.id === currentSubscription.planId
      );
      if (!plan) {
        throw new Error("Subscription plan not found");
      }

      // Set the plan and show the renewal modal
      setRenewalPlan(plan);
      setShowRenewalModal(true);
    } catch (error) {
      console.error("Failed to renew subscription:", error);
      toast.error("Error", {
        description: "Failed to renew subscription. Please try again.",
      });
    }
  };

  // Handle renewal modal actions
  const handleRenewalConfirm = async (phoneNumber: string) => {
    if (renewalPlan) {
      try {
        await initializePayment(renewalPlan, phoneNumber);
        setShowRenewalModal(false);
        setRenewalPlan(null);
      } catch (error) {
        toast.error("Error", {
          description: `Failed to renew subscription: ${error}`,
        });
      }
    }
  };

  const handleRenewalCancel = () => {
    setShowRenewalModal(false);
    setRenewalPlan(null);
  };

  const isFeatureUnlocked = (feature: string): boolean => {
    if (!currentSubscription || !currentSubscription.isActive) {
      return false;
    }

    const plan = subscriptionPlans.find(
      (p) => p.id === currentSubscription.planId
    );
    return plan?.features.includes(feature) || false;
  };

  const getRemainingDays = (): number => {
    if (!currentSubscription || !currentSubscription.isActive) {
      return 0;
    }

    const now = new Date();
    const endDate = new Date(currentSubscription.endDate);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  };

  const autoRenewSubscription = async () => {
    try {
      if (!currentSubscription) {
        throw new Error("No active subscription found");
      }

      // Get user's phone number
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("phone")
        .eq("user_id", user?.id)
        .single();

      if (profileError || !profile?.phone) {
        throw new Error("Phone number required for auto-renewal");
      }

      // TODO: Implement DirectDebitManager for Next.js
      // For now, just show a toast that this feature is not available
      toast.info("Auto-Renew Feature", {
        description:
          "Auto-renewal feature is coming soon. Please manually renew when needed.",
      });

      // Show Direct Debit setup UI (commented out until DirectDebitManager is implemented)
      // setShowDirectDebitSetup(true);
      // setPendingPhone(profile.phone);
    } catch (error) {
      toast.error("Error", {
        description: `Failed to enable auto-renew: ${error}`,
      });
    }
  };

  // SECURITY: Clear all user data on logout
  const clearUserData = async () => {
    try {
      await clearCachedData();

      // Clear all state
      setCurrentSubscription(null);
      setSubscriptionPlans([]);
      setCurrentClientReference(null);
      setPendingPlanId(null);
      setPendingPhone(null);
      setShowRenewalModal(false);
      setRenewalPlan(null);
      setPaymentInProgress(false);

      // Reset control flags
      isInitializedRef.current = false;
      syncInProgressRef.current = false;
    } catch (error) {
      console.error("❌ Failed to clear user data:", error);
      toast.error("Error", {
        description: `Failed to clear user data: ${error}`,
      });
    }
  };

  const value: SubscriptionContextType = {
    currentSubscription,
    subscriptionPlans,
    isLoading,
    isInitialLoading,
    isSyncing,
    paymentInProgress,
    initializePayment,
    cancelSubscription,
    renewSubscription,
    checkSubscriptionStatus,
    refreshSubscriptionData,
    syncSubscriptionData,
    manualSyncSubscriptionData,
    initializeSubscriptionData,
    loadSubscriptionBeforeNavigation,
    isFeatureUnlocked,
    getRemainingDays,
    checkPaymentStatus,
    currentClientReference,
    pendingPlanId,
    showRenewalModal,
    renewalPlan,
    handleRenewalConfirm,
    handleRenewalCancel,
    autoRenewSubscription,
    clearUserData,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return context;
};

export default SubscriptionContext;
