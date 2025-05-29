import { Redirect } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { initSupabaseSession } from "../backend/services/initSupabaseSession";
import { useAuthStore } from "../backend/store/authStore";


export default function Index() {
  const { session, hydrated, hydrateSession, hasCompletedOnboarding } =
    useAuthStore();

  useEffect(() => {
    // Only hydrate once on mount
    hydrateSession().then(() => {
      initSupabaseSession();
    });
    
  }, [hydrateSession]);

  // Show a spinner while hydrating (prevents blank screen confusion)
  if (!hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  // Onboarding logic: if not completed, always go to onboarding first
  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  // If no session, go to auth
  if (!session) {
    return <Redirect href="/(auth)" />;
  }

  // If session and onboarding complete, go to home
  return <Redirect href="/(home)/(tabs)" />;
}
