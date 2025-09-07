"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/backend/store/authStore";
import { supabase } from "@/backend/supabase";
import { sessionRefreshManager } from "@/utils/sessionRefresh";
import "@/utils/authDebugger"; // Load auth debugger

/**
 * Component to hydrate auth session on app start and listen to auth changes
 * Prevents hydration mismatch by waiting for client-side mounting
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const { hydrateSession, hydrated, setSession, session } = useAuthStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !hydrated) {
      hydrateSession();
    }
  }, [isMounted, hydrated, hydrateSession]);

  // Listen to Supabase auth state changes
  useEffect(() => {
    if (!isMounted) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Supabase auth state changed:", event, session?.user?.email);

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session && session.user?.email) {
          // Create compatible session object for the auth store
          const compatibleSession = {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            user: {
              id: session.user.id,
              email: session.user.email,
            },
            expires_at: session.expires_at || Date.now() / 1000 + 3600,
          };

          await setSession(compatibleSession);
          console.log("✅ Session updated from Supabase auth state change");
        }
      } else if (event === "SIGNED_OUT") {
        await setSession(null);
        console.log("✅ Session cleared from Supabase auth state change");
      }
    });

    return () => subscription.unsubscribe();
  }, [isMounted, setSession]);

  // Start/stop session refresh manager based on auth state
  useEffect(() => {
    if (!isMounted) return;

    if (session) {
      // Start automatic session refresh when user is logged in
      sessionRefreshManager.start();
    } else {
      // Stop automatic session refresh when user is logged out
      sessionRefreshManager.stop();
    }

    // Cleanup on unmount
    return () => {
      sessionRefreshManager.stop();
    };
  }, [isMounted, session]);

  // Listen for cross-tab logout (storage events)
  useEffect(() => {
    if (!isMounted) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "session" && e.newValue === null) {
        // Session was cleared in another tab, clear this tab's session too
        console.log("🔄 Session cleared in another tab, syncing...");
        setSession(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [isMounted, setSession]);

  // Prevent hydration mismatch by not rendering until client-side
  if (!isMounted) {
    return null;
  }

  return <>{children}</>;
}
