// Helper to normalize Ghana phone numbers to 233XXXXXXXXX
import { supabase } from "../supabase";

function normalizeGhanaPhone(phone: string): string {
  // Remove all non-digit characters
  let clean = phone.replace(/\D/g, "");
  console.log(
    `Phone validation - Original: ${phone}, Clean: ${clean}, Length: ${clean.length}`
  );

  // Remove leading country code if double (e.g. 00233...)
  if (clean.startsWith("00233")) {
    clean = clean.slice(2);
    console.log(`Removed 00 prefix, now: ${clean}`);
  }
  // If starts with 0 and is 10 digits, convert to 233XXXXXXXXX
  if (clean.length === 10 && clean.startsWith("0")) {
    const result = "233" + clean.slice(1);
    console.log(`Converted 0X format to 233X: ${result}`);
    return result;
  }
  // If starts with 233 and is 12 digits, return as is
  if (clean.length === 12 && clean.startsWith("233")) {
    console.log(`Valid 233X format: ${clean}`);
    return clean;
  }
  // If starts with 233 and is 13 digits (e.g. +233...), remove leading +
  if (clean.length === 13 && clean.startsWith("233")) {
    const result = clean.slice(1);
    console.log(`Removed extra digit, now: ${result}`);
    return result;
  }

  console.error(
    `Phone validation failed - Clean: ${clean}, Length: ${
      clean.length
    }, Starts with 233: ${clean.startsWith("233")}`
  );
  throw new Error(
    `Invalid Ghana phone number. Please enter a valid number in the format 0XXXXXXXXX or 233XXXXXXXXX.`
  );
}

export interface DirectDebitSetupResult {
  success: boolean;
  data?: {
    hubtelPreApprovalId: string;
    clientReferenceId: string;
    verificationType: "USSD" | "OTP";
    otpPrefix?: string;
    preapprovalStatus: string;
  };
  error?: string;
}

export interface DirectDebitVerificationResult {
  success: boolean;
  approved?: boolean;
  error?: string;
}

export class DirectDebitManager {
  /**
   * Initiates direct debit setup for a user
   */
  static async initiateSetup(
    phoneNumber: string
  ): Promise<DirectDebitSetupResult> {
    try {
      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("User not authenticated");
      }

      // Normalize and validate phone number
      const cleanPhone = normalizeGhanaPhone(phoneNumber);
      console.log("Normalized phoneNumber:", cleanPhone);

      // Check if user already has approved direct debit
      const { data: existingSetup } = await supabase
        .from("direct_debit_preapprovals")
        .select("*")
        .eq("user_id", user.id)
        .eq("customer_phone", cleanPhone)
        .eq("status", "APPROVED")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (existingSetup) {
        return {
          success: true,
          data: {
            hubtelPreApprovalId: existingSetup.hubtel_preapproval_id,
            clientReferenceId: existingSetup.client_reference,
            verificationType: "COMPLETED" as any,
            preapprovalStatus: "APPROVED",
          },
        };
      }

      // Call edge function to initiate setup
      const { data, error } = await supabase.functions.invoke(
        "initiate-direct-debit",
        {
          body: { phone: cleanPhone },
        }
      );

      if (error) {
        throw new Error(
          error.message || "Failed to initiate direct debit setup"
        );
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to initiate direct debit setup");
      }

      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      console.error("Failed to initiate direct debit setup:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Verifies OTP for direct debit setup
   */
  static async verifyOTP(
    phoneNumber: string,
    otpCode: string,
    preapprovalId: string,
    clientReference: string
  ): Promise<DirectDebitVerificationResult> {
    try {
      // Normalize and validate phone number
      const cleanPhone = normalizeGhanaPhone(phoneNumber);

      const { data, error } = await supabase.functions.invoke(
        "verify-direct-debit-otp",
        {
          body: {
            phone: cleanPhone,
            otpCode,
            preapprovalId,
            clientReference,
          },
        }
      );

      if (error) {
        throw new Error(error.message || "Failed to verify OTP");
      }

      if (!data.success) {
        throw new Error(data.error || "OTP verification failed");
      }

      return {
        success: true,
        approved: data.data.preapprovalStatus === "APPROVED",
      };
    } catch (error) {
      console.error("Failed to verify OTP:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Checks if user has approved direct debit
   */
  static async checkDirectDebitStatus(userId: string): Promise<{
    hasApprovedDirectDebit: boolean;
    phoneNumber?: string;
    clientReference?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from("direct_debit_preapprovals")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "APPROVED")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return { hasApprovedDirectDebit: false };
      }

      return {
        hasApprovedDirectDebit: true,
        phoneNumber: data.customer_phone,
        clientReference: data.client_reference,
      };
    } catch (error) {
      console.error("Failed to check direct debit status:", error);
      return { hasApprovedDirectDebit: false };
    }
  }

  /**
   * Enables auto-renewal for user's active subscription
   */
  static async enableAutoRenewal(userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Check if user has approved direct debit
      const directDebitStatus = await this.checkDirectDebitStatus(userId);

      if (!directDebitStatus.hasApprovedDirectDebit) {
        throw new Error(
          "Direct debit must be set up before enabling auto-renewal"
        );
      }

      // Update user's active subscription
      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          auto_renew: true,
          payment_method: "direct_debit",
          direct_debit_reference: directDebitStatus.clientReference,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("status", "active");

      if (error) {
        throw new Error("Failed to enable auto-renewal");
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to enable auto-renewal:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Disables auto-renewal for user's subscription
   */
  static async disableAutoRenewal(userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          auto_renew: false,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("status", "active");

      if (error) {
        throw new Error("Failed to disable auto-renewal");
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to disable auto-renewal:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Gets subscription renewal status and upcoming renewal info
   */
  static async getRenewalInfo(userId: string): Promise<{
    autoRenewEnabled: boolean;
    nextRenewalDate?: string;
    renewalStatus?: string;
    daysUntilRenewal?: number;
    renewalAttempts?: number;
    lastError?: string;
  }> {
    try {
      const { data: subscription } = await supabase
        .from("user_subscriptions")
        .select(
          `
          auto_renew,
          end_date,
          renewal_status,
          renewal_attempts,
          renewal_error,
          next_renewal_attempt
        `
        )
        .eq("user_id", userId)
        .eq("status", "active")
        .single();

      if (!subscription) {
        return { autoRenewEnabled: false };
      }

      const endDate = new Date(subscription.end_date);
      const now = new Date();
      const daysUntilRenewal = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        autoRenewEnabled: subscription.auto_renew || false,
        nextRenewalDate: subscription.end_date,
        renewalStatus: subscription.renewal_status,
        daysUntilRenewal: Math.max(0, daysUntilRenewal),
        renewalAttempts: subscription.renewal_attempts || 0,
        lastError: subscription.renewal_error,
      };
    } catch (error) {
      console.error("Failed to get renewal info:", error);
      return { autoRenewEnabled: false };
    }
  }
}
