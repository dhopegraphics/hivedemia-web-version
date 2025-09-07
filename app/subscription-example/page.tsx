/**
 * Example usage of the converted SubscriptionProvider in Next.js
 * This demonstrates how to use the subscription context in your components
 */

"use client";

import { useSubscription } from "@/context/useSubscriptionContext";
import { useEffect } from "react";

export default function SubscriptionExample() {
  const {
    currentSubscription,
    subscriptionPlans,
    isLoading,
    initializePayment,
    isFeatureUnlocked,
    getRemainingDays,
    cancelSubscription,
  } = useSubscription();

  useEffect(() => {
    console.log("Current subscription:", currentSubscription);
    console.log("Available plans:", subscriptionPlans);
  }, [currentSubscription, subscriptionPlans]);

  const handleSubscribe = async (planId: string) => {
    const plan = subscriptionPlans.find((p) => p.id === planId);
    if (!plan) return;

    try {
      // This will open payment URL in a new tab
      const result = await initializePayment(plan, "+233123456789");
      console.log("Payment initialized:", result);
    } catch (error) {
      console.error("Payment initialization failed:", error);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelSubscription();
      console.log("Subscription cancelled successfully");
    } catch (error) {
      console.error("Cancellation failed:", error);
    }
  };

  if (isLoading) {
    return <div>Loading subscription data...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Subscription Management</h1>

      {/* Current Subscription Status */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Current Subscription</h2>
        {currentSubscription ? (
          <div>
            <p className="text-green-600 font-medium">✅ Active Subscription</p>
            <p>Plan ID: {currentSubscription.planId}</p>
            <p>Days remaining: {getRemainingDays()}</p>
            <p>Auto-renew: {currentSubscription.autoRenew ? "Yes" : "No"}</p>
            <button
              onClick={handleCancel}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Cancel Subscription
            </button>
          </div>
        ) : (
          <p className="text-gray-600">No active subscription</p>
        )}
      </div>

      {/* Available Plans */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subscriptionPlans.map((plan) => (
            <div
              key={plan.id}
              className={`border rounded-lg p-4 ${
                plan.isPopular
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200"
              }`}
            >
              {plan.isPopular && (
                <div className="text-blue-600 font-medium text-sm mb-2">
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="text-gray-600 text-sm mb-2">{plan.description}</p>
              <p className="text-2xl font-bold text-green-600 mb-2">
                ${plan.price}
              </p>
              <p className="text-sm text-gray-500 mb-4">{plan.duration} days</p>
              <ul className="text-sm space-y-1 mb-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={currentSubscription?.planId === plan.id}
                className={`w-full px-4 py-2 rounded font-medium ${
                  currentSubscription?.planId === plan.id
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {currentSubscription?.planId === plan.id
                  ? "Current Plan"
                  : "Subscribe"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Access Check */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Feature Access</h2>
        <div className="space-y-2">
          {["premium_support", "advanced_features", "unlimited_usage"].map(
            (feature) => (
              <div key={feature} className="flex items-center">
                <span
                  className={`w-3 h-3 rounded-full mr-3 ${
                    isFeatureUnlocked(feature) ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="capitalize">
                  {feature.replace("_", " ")}:{" "}
                  {isFeatureUnlocked(feature) ? "Unlocked" : "Locked"}
                </span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
