"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/backend/store/authStore";

/**
 * Component to hydrate auth session on app start
 * Prevents hydration mismatch by waiting for client-side mounting
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const { hydrateSession, hydrated } = useAuthStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !hydrated) {
      hydrateSession();
    }
  }, [isMounted, hydrated, hydrateSession]);

  // Prevent hydration mismatch by not rendering until client-side
  if (!isMounted) {
    return null;
  }

  return <>{children}</>;
}
