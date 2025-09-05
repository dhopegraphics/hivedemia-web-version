import { supabase } from "@/backend/supabase";
import { useCallback, useState } from "react";

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: {
    id: string;
    code: string;
    description: string;
    discount_percent: number;
    is_active: boolean;
    max_uses: number;
    current_uses: number;
  };
  discountedPrice?: number;
  originalPrice: number;
  discountAmount?: number;
  error?: string;
  shouldSkipPayment?: boolean; // For 100% discount
}

export interface CouponState {
  isValidating: boolean;
  validationResult: CouponValidationResult | null;
  error: string | null;
}

export const useCouponValidation = () => {
  const [state, setState] = useState<CouponState>({
    isValidating: false,
    validationResult: null,
    error: null,
  });

  const validateCoupon = useCallback(
    async (
      couponCode: string,
      planId: string,
      planPrice: number
    ): Promise<CouponValidationResult> => {
      setState((prev) => ({ ...prev, isValidating: true, error: null }));

      try {
        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error("Authentication required");
        }

        // Sanitize input
        const sanitizedCode = couponCode.trim().toUpperCase();

        // Call Edge Function for secure validation
        const { data, error } = await supabase.functions.invoke(
          "validate-coupon",
          {
            body: {
              coupon_code: sanitizedCode,
              user_id: user.id,
              plan_id: planId,
            },
          }
        );

        if (error) {
          console.error("Edge function error:", error);
          throw new Error(error.message || "Validation failed");
        }

        let result: CouponValidationResult;

        if (!data.success) {
          result = {
            isValid: false,
            originalPrice: planPrice,
            error: data.error || "Invalid coupon code",
          };
        } else {
          // Return successful validation result
          result = {
            isValid: true,
            coupon: data.coupon,
            originalPrice: planPrice,
            discountedPrice: data.final_price,
            discountAmount: data.discount_amount,
            shouldSkipPayment: data.subscription_created, // True if subscription was created (100% discount)
          };
        }

        setState((prev) => ({
          ...prev,
          isValidating: false,
          validationResult: result,
          error: result.isValid ? null : result.error || "Unknown error",
        }));

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Validation failed";
        const result: CouponValidationResult = {
          isValid: false,
          originalPrice: planPrice,
          error: errorMessage,
        };

        setState((prev) => ({
          ...prev,
          isValidating: false,
          validationResult: result,
          error: errorMessage,
        }));

        return result;
      }
    },
    []
  );

  const clearValidation = useCallback(() => {
    setState({
      isValidating: false,
      validationResult: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    validateCoupon,
    clearValidation,
  };
};
