"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/backend/store/authStore";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

/**
 * Client-side authentication guard component
 */
export function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = "/auth/login",
}: AuthGuardProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { session, hydrated, validateSession } = useAuthStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const checkAuth = async () => {
      try {
        // Wait for hydration first
        if (!hydrated) {
          return;
        }

        // Validate session
        const isValid = await validateSession();

        if (requireAuth && !isValid) {
          router.push(redirectTo);
          return;
        }

        if (!requireAuth && isValid && redirectTo.includes("/auth/")) {
          router.push("/dashboard");
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Auth check failed:", error);
        if (requireAuth) {
          router.push(redirectTo);
        } else {
          setIsLoading(false);
        }
      }
    };

    checkAuth();
  }, [
    isMounted,
    hydrated,
    session,
    requireAuth,
    redirectTo,
    router,
    validateSession,
  ]);

  // Prevent hydration mismatch by not rendering until client-side
  if (!isMounted) {
    return null;
  }

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If we need auth but don't have it, don't render children
  if (requireAuth && !session) {
    return null;
  }

  // If we don't need auth but have it and should redirect, don't render children
  if (!requireAuth && session && redirectTo.includes("/auth/")) {
    return null;
  }

  return <>{children}</>;
}
