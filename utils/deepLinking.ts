import { supabase } from "@/backend/supabase";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";

// Required for web compatibility
WebBrowser.maybeCompleteAuthSession();

// Create redirect URI for the app
export const redirectTo = makeRedirectUri({
  scheme: "hivedemia",
  path: "/auth/callback",
});

/**
 * Creates a session from a deep link URL containing auth tokens
 * This handles both magic links and password reset confirmations
 */
export const createSessionFromUrl = async (url: string) => {
  try {
    const { params, errorCode } = QueryParams.getQueryParams(url);

    if (errorCode) {
      console.error("Deep link error:", errorCode);
      throw new Error(errorCode);
    }

    const { access_token, refresh_token, type } = params;

    if (!access_token) {
      return null;
    }

    // Set the session with Supabase
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      console.error("Session creation error:", error);
      throw error;
    }

    // Handle different types of authentication flows
    if (type === "recovery" || type === "password_recovery") {
      // Password reset flow - navigate to reset password screen

      router.replace("/(auth)/password-reset/reset-password");
    } else if (type === "signup" || type === "email") {
      // Email confirmation or magic link - navigate to home

      router.replace("/(home)");
    } else {
      router.replace("/(home)");
    }

    return data.session;
  } catch (error) {
    console.error("Error processing deep link:", error);
    // Navigate to auth screen on error
    router.replace("/(auth)");
    throw error;
  }
};

/**
 * Handle deep links when the app is already running
 */
export const handleDeepLink = (url: string) => {
  if (
    url.includes("/auth/") ||
    url.includes("access_token=") ||
    url.includes("refresh_token=")
  ) {
    createSessionFromUrl(url);
  }
};

/**
 * Send a magic link for email authentication
 */
export const sendMagicLink = async (email: string) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) throw error;
  return { success: true };
};

/**
 * Enhanced password reset with proper redirect handling
 */
export const sendPasswordResetEmail = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo,
  });

  if (error) throw error;
  return { success: true };
};

/**
 * OAuth authentication with proper redirect handling
 */
export const performOAuth = async (provider: "google" | "github" | "apple") => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;

  const res = await WebBrowser.openAuthSessionAsync(
    data?.url ?? "",
    redirectTo
  );

  if (res.type === "success") {
    const { url } = res;
    await createSessionFromUrl(url);
  }

  return res;
};
