/**
 * Debug utility for authentication issues
 * This helps identify why logout might not be working
 */

import { supabase } from "@/backend/supabase";
import { useAuthStore } from "@/backend/store/authStore";

export const authDebugger = {
  /**
   * Check current authentication state
   */
  async checkCurrentState() {
    console.log("🔍 === AUTH DEBUG REPORT ===");

    // Check Zustand store state
    const storeState = useAuthStore.getState();
    console.log("Zustand Store State:", {
      hasSession: !!storeState.session,
      hasUser: !!storeState.user,
      hydrated: storeState.hydrated,
      userEmail: storeState.session?.user?.email || "No email",
    });

    // Check Supabase session
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      console.log("Supabase Session:", {
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email || "No email",
        expiresAt: session?.expires_at
          ? new Date(session.expires_at * 1000).toLocaleString()
          : "No expiry",
        error: error?.message || "No error",
      });
    } catch (error) {
      console.error("Error checking Supabase session:", error);
    }

    // Check localStorage
    try {
      const storedSession = localStorage.getItem("session");
      console.log("LocalStorage Session:", {
        hasStoredSession: !!storedSession,
        sessionLength: storedSession?.length || 0,
      });

      if (storedSession) {
        try {
          const parsed = JSON.parse(storedSession);
          console.log("Parsed LocalStorage Session:", {
            hasAccessToken: !!parsed.access_token,
            hasUser: !!parsed.user,
            userEmail: parsed.user?.email || "No email",
            expiresAt: parsed.expires_at
              ? new Date(parsed.expires_at * 1000).toLocaleString()
              : "No expiry",
          });
        } catch (parseError) {
          console.error("Error parsing stored session:", parseError);
        }
      }
    } catch (storageError) {
      console.error("Error checking localStorage:", storageError);
    }

    console.log("🔍 === END AUTH DEBUG REPORT ===");
  },

  /**
   * Test logout process step by step
   */
  async testLogout() {
    console.log("🔍 === TESTING LOGOUT PROCESS ===");

    await this.checkCurrentState();

    console.log("🔄 Step 1: Starting logout...");
    try {
      await useAuthStore.getState().logout();
      console.log("✅ Step 1: Logout function completed");
    } catch (error) {
      console.error("❌ Step 1: Logout function failed:", error);
    }

    // Wait a moment for async operations
    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log("🔄 Step 2: Checking state after logout...");
    await this.checkCurrentState();

    console.log("🔍 === END LOGOUT TEST ===");
  },

  /**
   * Force clear all auth data (emergency cleanup)
   */
  async forceClearAll() {
    console.log("🚨 FORCE CLEARING ALL AUTH DATA");

    try {
      // Clear Supabase
      await supabase.auth.signOut();
      console.log("✅ Supabase cleared");
    } catch (error) {
      console.error("❌ Supabase clear failed:", error);
    }

    try {
      // Clear localStorage
      localStorage.removeItem("session");
      localStorage.removeItem("onboardingComplete");
      localStorage.removeItem("app_install_marker");
      console.log("✅ LocalStorage cleared");
    } catch (error) {
      console.error("❌ LocalStorage clear failed:", error);
    }

    try {
      // Clear Zustand store
      useAuthStore.setState({
        session: null,
        user: null,
        hasCompletedOnboarding: false,
      });
      console.log("✅ Zustand store cleared");
    } catch (error) {
      console.error("❌ Zustand clear failed:", error);
    }

    // Force page reload
    console.log("🔄 Force reloading page...");
    window.location.href = "/auth/login";
  },
};

// Make it globally available for debugging
if (typeof window !== "undefined") {
  (
    window as typeof window & { authDebugger: typeof authDebugger }
  ).authDebugger = authDebugger;
  console.log("🔧 Auth debugger available as window.authDebugger");
}
