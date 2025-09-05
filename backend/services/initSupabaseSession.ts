// src/backend/auth/initSupabaseSession.ts
import { supabase } from "@/backend/supabase";
import { useAuthStore } from "../store/authStore";

// Web-compatible network check
async function checkNetworkConnectivity(): Promise<boolean> {
  if (typeof navigator !== "undefined" && "onLine" in navigator) {
    return navigator.onLine;
  }

  try {
    const response = await fetch("/api/health", {
      method: "HEAD",
      cache: "no-cache",
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function initSupabaseSession() {
  const { session, setSession } = useAuthStore.getState();

  // Early return if no session exists locally
  if (!session) {
    console.log(
      "No local session found, skipping Supabase session initialization"
    );
    return;
  }

  try {
    // Check network connectivity first
    const isConnected = await checkNetworkConnectivity();
    if (!isConnected) {
      console.log("Offline: Keeping stored session without server sync");
      return;
    }

    // Background sync with quick timeout
    const syncPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Sync timeout")), 2000)
    );

    const result = await Promise.race([syncPromise, timeoutPromise]);
    const {
      data: { session: currentSession },
      error,
    } = result;

    if (error) {
      console.warn("Background sync error (non-critical):", error.message);
      return; // Keep stored session
    }

    if (!currentSession) {
      console.log("No server session found, keeping stored session");
      return; // Keep stored session for offline access
    }

    // Check if session needs refresh (only if significantly expired)
    const now = Math.floor(Date.now() / 1000);
    const isSignificantlyExpired =
      currentSession.expires_at && currentSession.expires_at < now - 300; // 5 minutes buffer

    if (isSignificantlyExpired) {
      try {
        const refreshResult = await Promise.race([
          supabase.auth.refreshSession(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Refresh timeout")), 2000)
          ),
        ]);

        const { data, error: refreshError } = refreshResult;
        if (data?.session) {
          await setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            user: {
              id: data.session.user.id,
              email: data.session.user.email!,
            },
            expires_at: data.session.expires_at!,
          });
        } else {
          console.warn(
            "Background refresh failed (non-critical):",
            refreshError?.message
          );
        }
      } catch (refreshError) {
        console.warn(
          "Background refresh timeout (non-critical):",
          refreshError
        );
      }
    } else if (session.access_token !== currentSession.access_token) {
      // Update session if tokens are different
      await setSession({
        access_token: currentSession.access_token,
        refresh_token: currentSession.refresh_token,
        user: {
          id: currentSession.user.id,
          email: currentSession.user.email!,
        },
        expires_at: currentSession.expires_at!,
      });
    } else {
    }
  } catch (error) {
    console.warn("Background session sync failed (non-critical):", error);
    // Always preserve stored session on any error
  }
}
