import { useAuthStore } from "@/backend/store/authStore";
import { useUserStore } from "@/backend/store/useUserStore";
import { supabase } from "@/backend/supabase";
import ActionButton from "@/components/ActionButton";
import ConfirmationModal from "@/components/ConfirmationModal";
import ProfileHeader from "@/components/ProfileHeader";
import SettingsItem from "@/components/SettingsItem";
import SettingsSection from "@/components/SettingsSection";
import { colors } from "@/constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  Share,
  Switch,
  Text,
  View,
} from "react-native";

const SettingsScreen = () => {
  const navigation = useNavigation();
  // App settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const isMounted = useRef(false);
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const [darkModeSwitchValue, setDarkModeSwitchValue] = useState(isDark);

  const isDark = colorScheme === "dark";
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { profile, hydrateProfile, fetchProfileFromSupabase } = useUserStore();
  const { logout } = useAuthStore();

  useEffect (() => {
    const fetchUserProfile = async () => {
      try {
        await hydrateProfile();
        await fetchProfileFromSupabase();
      } catch (error) { 
        console.error("Error fetching user profile:", error);
      }
    };
    fetchUserProfile();
  }, [hydrateProfile, fetchProfileFromSupabase]);

  useEffect(() => {
    setDarkModeSwitchValue(isDark);
  }, [isDark]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleSignOut = async () => {
    setShowSignOutModal(false);

    try {
      await logout();
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Error signing out:", error.message);
      } else {
        console.log("Signed out successfully");
        router.replace("/(auth)");
      }
    } catch (error) {
      console.error("Error during sign out cleanup:", error);
    }
  };

  const handleDeleteAccount = async () => {
    setShowDeleteModal(false);

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData?.user) {
        console.error("❌ User fetch error:", userError?.message);
        Alert.alert("Error", "No authenticated user found.");
        return;
      }

      const { error: deleteError } = await supabase.rpc("delete_user");
      if (deleteError) {
        console.error("❌ Supabase delete error:", deleteError.message);
        Alert.alert("Error", "Failed to delete account. Please try again.");
        return;
      }

      // Clear AsyncStorage
      await AsyncStorage.multiRemove([
        "hasCompletedOnboarding",
        // Add more keys here if needed
      ]);

      console.log("✅ Account deleted successfully");
      router.replace("/(auth)");
    } catch (err) {
      console.error("❌ Unexpected error during deletion:", err);
      Alert.alert("Error", "An unexpected error occurred.");
    }
  };

  const handleRateApp = async () => {
    // For iOS - would need to replace with your app store ID
    const appStoreUrl =
      "itms-apps://itunes.apple.com/app/idYOUR_APP_ID?action=write-review";

    // For Android
    const playStoreUrl = "market://details?id=com.hivedemia.app";

    try {
      await Linking.openURL(Platform.OS === "ios" ? appStoreUrl : playStoreUrl);
    } catch (error) {
      console.error("Error opening app store:", error);
    }
  };

  const handleContactSupport = () => {
    Linking.openURL("mailto:support@hivedemia.com?subject=Hivedemia Support");
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message:
          "Check out Hivedemia - the ultimate learning companion for students!",
        url: "https://hivedemia.com/download",
        title: "Hivedemia",
      });
    } catch (error) {
      console.error("Error sharing:", error.message);
    }
  };

  return (
    <>
      <ScrollView
        style={{ backgroundColor: isDark ? colors.dark : colors.light }}
        className={`flex-1 pt-16 `}
      >
        {/* Profile Header */}
        <ProfileHeader
          user={profile}
          isDark={isDark}
          colors={colors}
          onPressAvatar={() => navigation.openDrawer()}
        />

        {/* Account Settings */}
        <SettingsSection title="Account" isDark={isDark} colors={colors}>
          <SettingsItem
            icon="person"
            label="Personal Information"
            onPress={() =>
              router.push("/settingsItems/PersonalInformationScreen")
            }
            isDark={isDark}
            colors={colors}
          />
          <SettingsItem
            icon="school"
            label="Academic Profile"
            onPress={() => router.push("/settingsItems/AcademicProfileScreen")}
            isDark={isDark}
          />
          <SettingsItem
            icon="lock"
            label="Password & Security"
            onPress={() => router.push("/settingsItems/PasswordSecurityScreen")}
            isDark={isDark}
          />
          <SettingsItem
            icon="notifications"
            label="Notification Preferences"
            onPress={() =>
              router.push("/settingsItems/NotificationPreferencesScreen")
            }
            isDark={isDark}
          />
        </SettingsSection>

        {/* App Preferences */}
        <SettingsSection title="App Preferences" isDark={isDark}>
          <SettingsItem
            icon="palette"
            label="Dark Mode"
            rightComponent={
              <Switch
                value={darkModeSwitchValue}
                onValueChange={() => {
                  const nextValue = !darkModeSwitchValue;
                  setDarkModeSwitchValue(nextValue); // instant visual response
                  if (isMounted.current) {
                    toggleColorScheme(); // updates the actual theme
                  }
                }}
                trackColor={{ false: "#e5e7eb", true: "#00DF82" }}
                thumbColor={darkModeSwitchValue ? "#fff" : "#f3f4f6"}
              />
            }
            isDark={isDark}
          />
          <SettingsItem
            icon="notifications-active"
            label="Push Notifications"
            rightComponent={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#e5e7eb", true: "#00DF82" }}
                thumbColor={notificationsEnabled ? "#fff" : "#f3f4f6"}
              />
            }
            isDark={isDark}
          />
          <SettingsItem
            icon="fingerprint"
            label="Biometric Login"
            rightComponent={
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{ false: "#e5e7eb", true: "#00DF82" }}
                thumbColor={biometricEnabled ? "#fff" : "#f3f4f6"}
              />
            }
            isDark={isDark}
          />
          <SettingsItem
            icon="cloud-sync"
            label="Auto Sync Your Data"
            rightComponent={
              <Switch
                value={autoSyncEnabled}
                onValueChange={setAutoSyncEnabled}
                trackColor={{ false: "#e5e7eb", true: "#00DF82" }}
                thumbColor={autoSyncEnabled ? "#fff" : "#f3f4f6"}
              />
            }
            isDark={isDark}
          />
        </SettingsSection>

        {/* Support & About */}
        <SettingsSection title="Support & About" isDark={isDark}>
          <SettingsItem
            icon="help"
            label="Help Center"
            onPress={() => Linking.openURL("https://hivedemia.com/help")}
            isDark={isDark}
          />
          <SettingsItem
            icon="email"
            label="Contact Support"
            onPress={handleContactSupport}
            isDark={isDark}
          />
          <SettingsItem
            icon="info"
            label="About Hivedemia"
            onPress={() => router.push("/settingsItems/AboutUs")}
            isDark={isDark}
          />
          <SettingsItem
            icon="rate-review"
            label="Rate the App"
            onPress={handleRateApp}
            isDark={isDark}
          />
          <SettingsItem
            icon="share"
            label="Share Hivedemia"
            onPress={handleShareApp}
            isDark={isDark}
          />
        </SettingsSection>

        {/* Legal */}
        <SettingsSection title="Legal" isDark={isDark}>
          <SettingsItem
            icon="policy"
            label="Privacy Policy"
            onPress={() =>
              router.push("/termsAndconditions/PrivacyPolicyScreen")
            }
            isDark={isDark}
          />
          <SettingsItem
            icon="gavel"
            label="Terms of Service"
            onPress={() =>
              router.push("/termsAndconditions/TermsOfServiceScreen")
            }
            isDark={isDark}
          />
          <SettingsItem
            icon="copyright"
            label="Licenses"
            onPress={() => console.log("Licenses")}
            isDark={isDark}
          />
        </SettingsSection>

        {/* Account Actions */}
        <View
          className={`p-6 mt-4 dark:bg-dark ${isDark ? "bg-dark" : "bg-white"}`}
        >
          <ActionButton
            icon="logout"
            label="Sign Out"
            onPress={() => setShowSignOutModal(true)}
            isRed
            isDark={isDark}
          />
          <ActionButton
            icon="delete"
            label="Delete Account"
            onPress={() => setShowDeleteModal(true)}
            isRed
            isDark={isDark}
            className="mt-4"
          />
        </View>

        {/* Version Info */}
        <View className="items-center py-6">
          <Text
            className={`text-base font-JakartaBold ${
              isDark ? "text-primary-100" : "text-green-400"
            }`}
          >
            Hivedemia v1.0.0
          </Text>
          <Text
            className={`text-xs mt-1 ${isDark ? "text-offwhite" : "text-gray"}`}
          >
            © 2025 Smart Hive Labs.
          </Text>
        </View>
        <View className=" mt-40" />
      </ScrollView>
      <ConfirmationModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Your Account?"
        description="All your data will be permanently removed. This cannot be undone."
        confirmText="Delete Account"
        isDestructive={true}
      />
      <ConfirmationModal
        visible={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleSignOut}
        title="Sign Out of Hivedemia?"
        description="You'll need to sign in again to access your study materials and progress."
        confirmText="Sign Out"
        isDestructive={true}
      />
    </>
  );
};

export default SettingsScreen;
