import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { useColorScheme } from "nativewind";
import { Ionicons } from "@expo/vector-icons";
import ConfirmationModal from "./ConfirmationModal";
import { supabase } from "@/backend/supabase";
import { useRouter } from "expo-router";

export default function CustomDrawerContent(props: any) {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const handleSignOut = async () => {
    setShowSignOutModal(false);

    try {
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

  return (
    <>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ flex: 1 }}
        style={[styles.container, isDark && styles.darkContainer]}
      >
        <View style={styles.header}>
          <Text style={[styles.headerText, isDark && styles.darkHeaderText]}>
            Hivedemia
          </Text>
        </View>

        <DrawerItemList {...props} />

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() => setShowSignOutModal(true)}
            style={styles.logoutButton}
          >
            <Ionicons
              name="log-out-outline"
              size={24}
              color={isDark ? "#f8fafc" : "#1e293b"}
            />
            <Text style={[styles.logoutText, isDark && styles.darkLogoutText]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>
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
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8fafc",
  },
  darkContainer: {
    backgroundColor: "#042222",
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  darkHeader: {
    borderBottomColor: "#334155",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
  },
  darkHeaderText: {
    color: "#f8fafc",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    marginTop: "auto",
  },
  darkFooter: {
    borderTopColor: "#334155",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    color: "#1e293b",
  },
  darkLogoutText: {
    color: "#f8fafc",
  },
});
