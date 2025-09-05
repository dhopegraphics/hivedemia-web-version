import { supabase } from "@/backend/supabase";
import { create } from "zustand";

// Web-compatible navigation utility
const webRouter = {
  push: (path) => {
    if (typeof window !== "undefined") {
      window.location.href = path;
    }
  },
  replace: (path) => {
    if (typeof window !== "undefined") {
      window.location.replace(path);
    }
  },
};

const useForgetPassword = create((set, get) => ({
  activeTab: "phone", // 'phone', 'email', or 'recovery'
  phone: "",
  email: "",
  recoveryCode: "", // For the 8-digit recovery code input
  otp: "",
  step: 1, // 1: input, 2: OTP, 3: new password
  newPassword: "",
  confirmPassword: "",
  isLoading: false,
  error: null,
  // Actions
  setActiveTab: (tab) =>
    set({
      activeTab: tab,
      error: null,
      step: 1,
      otp: "",
      phone: "",
      email: "",
      recoveryCode: "",
    }),
  setPhone: (phone) => set({ phone }),
  setEmail: (email) => set({ email }),
  setRecoveryCode: (code) => set({ recoveryCode: code }),
  setOtp: (otp) => set({ otp }),
  setNewPassword: (password) => set({ newPassword: password }),
  setConfirmPassword: (password) => set({ confirmPassword: password }),
  setStep: (step) => set({ step }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  resetAllState: () =>
    set({
      activeTab: "phone",
      phone: "",
      email: "",
      recoveryCode: "",
      otp: "",
      step: 1,
      newPassword: "",
      confirmPassword: "",
      isLoading: false,
      error: null,
    }),

  handleSendCode: async () => {
    const { activeTab, phone, email } = get();
    set({ isLoading: true, error: null });

    try {
      if (activeTab === "phone") {
        if (!phone) throw new Error("Phone number is required.");
        const fullPhoneNumber = `+233${phone}`;
        const { error } = await supabase.auth.signInWithOtp({
          phone: fullPhoneNumber,
        });
        if (error) throw error;
        set({ isLoading: false, step: 2 });
      } else if (activeTab === "email") {
        if (!email) throw new Error("Email is required.");
        // Use resetPasswordForEmail for email reset
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: "hivedemia:///(auth)/ForgotPassword?step=3",
        });
        if (error) throw error;
        set({ isLoading: false, step: 4 }); // Show "Check your email" screen
      } else if (activeTab === "recovery") {
        set({
          isLoading: false,
          error: "Recovery code sending not implemented.",
        });
        return;
      } else {
        throw new Error("Invalid method selected.");
      }
    } catch (error) {
      set({ isLoading: false, error: error.message });
    }
  },

  handleVerifyOtp: async () => {
    const { activeTab, phone, otp } = get();
    set({ isLoading: true, error: null });

    try {
      if (activeTab === "phone") {
        if (!otp || otp.length < 6) throw new Error("Valid OTP is required.");
        const fullPhoneNumber = `+233${phone}`;
        const { data, error } = await supabase.auth.verifyOtp({
          phone: fullPhoneNumber,
          token: otp,
          type: "sms",
        });
        if (error) throw error;
        if (data && (data.session || data.user)) {
          set({ isLoading: false, step: 3, otp: "" });
        } else {
          throw new Error(
            "OTP verification succeeded but no session/user data received."
          );
        }
      }
    } catch (error) {
      set({ isLoading: false, error: error.message });
    }
  },

  handleUpdatePassword: async () => {
    const { newPassword, confirmPassword } = get();
    set({ isLoading: true, error: null });

    if (!newPassword || !confirmPassword) {
      set({ isLoading: false, error: "Both password fields are required." });
      return;
    }
    if (newPassword !== confirmPassword) {
      set({ isLoading: false, error: "Passwords do not match." });
      return;
    }

    try {
      // The user should be authenticated at this point (after successful OTP or email link)
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      set({ isLoading: false });
      webRouter.replace("/auth/login");
      get().resetAllState();
    } catch (error) {
      set({ isLoading: false, error: error.message });
    }
  },
}));

export default useForgetPassword;
