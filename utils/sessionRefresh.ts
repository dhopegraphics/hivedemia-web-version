/**
 * Session refresh utility for maintaining persistent authentication
 * This helps ensure sessions don't expire unexpectedly
 */

import { supabase } from "@/backend/supabase";
import { useAuthStore } from "@/backend/store/authStore";

class SessionRefreshManager {
  private refreshInterval: NodeJS.Timeout | null = null;
  private readonly REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes
  private readonly REFRESH_THRESHOLD = 5 * 60; // 5 minutes before expiry

  /**
   * Start automatic session refresh
   */
  start() {
    if (typeof window === "undefined") return; // Server-side guard

    this.stop(); // Clear any existing interval

    this.refreshInterval = setInterval(() => {
      this.checkAndRefreshSession();
    }, this.REFRESH_INTERVAL);

    console.log("✅ Session refresh manager started");
  }

  /**
   * Stop automatic session refresh
   */
  stop() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log("🛑 Session refresh manager stopped");
    }
  }

  /**
   * Check if session needs refresh and refresh if necessary
   */
  private async checkAndRefreshSession() {
    try {
      const { session } = useAuthStore.getState();

      if (!session || !session.expires_at) {
        return; // No session to refresh
      }

      const now = Date.now() / 1000; // Current time in seconds
      const expiresAt = session.expires_at;
      const timeUntilExpiry = expiresAt - now;

      // If session expires within threshold, refresh it
      if (timeUntilExpiry <= this.REFRESH_THRESHOLD) {
        console.log("🔄 Session refresh needed, refreshing...");

        const { data, error } = await supabase.auth.refreshSession();

        if (error) {
          console.error("Session refresh failed:", error);
          return;
        }

        if (data.session) {
          const refreshedSession = {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            user: {
              id: data.session.user.id,
              email: data.session.user.email!,
            },
            expires_at: data.session.expires_at!,
          };

          await useAuthStore.getState().setSession(refreshedSession);
          console.log("✅ Session refreshed successfully");
        }
      } else {
        console.log(
          `Session still valid for ${Math.round(timeUntilExpiry / 60)} minutes`
        );
      }
    } catch (error) {
      console.error("Error during session refresh check:", error);
    }
  }

  /**
   * Manually refresh session
   */
  async refreshNow(): Promise<boolean> {
    try {
      console.log("🔄 Manual session refresh requested...");

      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error("Manual session refresh failed:", error);
        return false;
      }

      if (data.session) {
        const refreshedSession = {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          user: {
            id: data.session.user.id,
            email: data.session.user.email!,
          },
          expires_at: data.session.expires_at!,
        };

        await useAuthStore.getState().setSession(refreshedSession);
        console.log("✅ Manual session refresh successful");
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error during manual session refresh:", error);
      return false;
    }
  }
}

// Export singleton instance
export const sessionRefreshManager = new SessionRefreshManager();

/**
 * Hook to use session refresh manager
 */
export function useSessionRefresh() {
  return {
    start: () => sessionRefreshManager.start(),
    stop: () => sessionRefreshManager.stop(),
    refreshNow: () => sessionRefreshManager.refreshNow(),
  };
}
