import { supabase } from "../supabase";
import { HubtelDirectDebitService } from "./HubtelDirectDebitService";

interface AutoRenewalConfig {
  gracePeriod: number; // days
  retryAttempts: number;
  retryDelay: number; // hours
}

export class SubscriptionRenewalService {
  private hubtelService: HubtelDirectDebitService;
  private config: AutoRenewalConfig;

  constructor(
    hubtelService: HubtelDirectDebitService,
    config: AutoRenewalConfig = {
      gracePeriod: 3,
      retryAttempts: 3,
      retryDelay: 24,
    }
  ) {
    this.hubtelService = hubtelService;
    this.config = config;
  }

  /**
   * Processes subscription renewal for a user
   */
  async processRenewal(subscriptionId: string) {
    try {
      // Get subscription details
      const { data: subscription, error } = await supabase
        .from("user_subscriptions")
        .select(
          `
          *,
          subscription_plans (
            id,
            name,
            price,
            duration_days,
            features
          ),
          users!user_subscriptions_user_id_fkey (
            id,
            phone
          )
        `
        )
        .eq("id", subscriptionId)
        .single();

      if (error || !subscription) {
        throw new Error(`Failed to fetch subscription: ${error?.message}`);
      }

      // Check if direct debit is approved
      const preapprovalStatus = await this.hubtelService.checkPreapprovalStatus(
        subscription.direct_debit_reference
      );

      if (preapprovalStatus.data.preapprovalStatus !== "APPROVED") {
        throw new Error("Direct debit not approved");
      }

      // Attempt direct debit charge
      const chargeResponse = await this.hubtelService.chargeDirectDebit(
        subscription.users.phone,
        subscription.subscription_plans.price,
        `Auto-renewal for ${subscription.subscription_plans.name}`
      );

      // Update subscription with new dates and payment info
      const newEndDate = new Date();
      newEndDate.setDate(
        newEndDate.getDate() + subscription.subscription_plans.duration_days
      );

      await supabase
        .from("user_subscriptions")
        .update({
          start_date: new Date().toISOString(),
          end_date: newEndDate.toISOString(),
          last_renewal_attempt: new Date().toISOString(),
          renewal_status: "success",
          status: "active",
        })
        .eq("id", subscriptionId);

      // Record payment transaction
      await supabase.from("payment_transactions").insert({
        user_id: subscription.user_id,
        subscription_id: subscriptionId,
        amount: subscription.subscription_plans.price,
        status: "success",
        payment_method: "direct_debit",
        transaction_reference: chargeResponse.data.transactionId,
        client_reference: chargeResponse.data.clientReference,
      });

      return {
        success: true,
        message: "Subscription renewed successfully",
        data: chargeResponse,
      };
    } catch (error) {
      console.error("Failed to process renewal:", error);

      // Record failed attempt
      await supabase
        .from("user_subscriptions")
        .update({
          last_renewal_attempt: new Date().toISOString(),
          renewal_status: "failed",
          renewal_error: error instanceof Error ? error.message : String(error),
        })
        .eq("id", subscriptionId);

      throw error;
    }
  }

  /**
   * Schedules next renewal attempt based on config
   */
  async scheduleNextAttempt(subscriptionId: string, attemptCount: number) {
    if (attemptCount >= this.config.retryAttempts) {
      await this.handleRenewalFailure(subscriptionId);
      return;
    }

    // Schedule next attempt using edge function
    const nextAttemptDate = new Date();
    nextAttemptDate.setHours(
      nextAttemptDate.getHours() + this.config.retryDelay
    );

    await supabase.from("renewal_attempts").insert({
      subscription_id: subscriptionId,
      attempt_count: attemptCount + 1,
      scheduled_for: nextAttemptDate.toISOString(),
    });
  }

  /**
   * Handles final renewal failure
   */
  private async handleRenewalFailure(subscriptionId: string) {
    await supabase
      .from("user_subscriptions")
      .update({
        status: "expired",
        auto_renew: false,
        renewal_status: "failed_final",
      })
      .eq("id", subscriptionId);
  }
}
