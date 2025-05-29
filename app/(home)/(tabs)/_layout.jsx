import { Tabs } from "expo-router";
import {
  MaterialCommunityIcons,
  Ionicons,
  Feather,
  FontAwesome5,
} from "@expo/vector-icons";
import React, { useRef, useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";
import { BlurView } from "expo-blur";
import { StyleSheet, Platform } from "react-native";
import { useColorScheme } from "nativewind";
import { useToast } from "@/context/ToastContext";
import { useCourseStore } from "@/backend/store/useCourseStore";
import { colors } from "@/constants/Colors";

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { showToast } = useToast();

  useEffect(() => {
    const init = async () => {
      await useCourseStore.getState().initCourseTable();
      await useCourseStore.getState().syncFromSupabaseToLocal();
    };
    init();
  }, []);

  const isConnectedRef = useRef(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (isConnectedRef.current === null) {
        isConnectedRef.current = state.isConnected;
        return;
      }

      if (!state.isConnected && isConnectedRef.current !== false) {
        showToast("No Internet Connection", "error", 500);
      }

      if (state.isConnected && isConnectedRef.current === false) {
        showToast("Internet Connection restored", "success", 500);
      }

      isConnectedRef.current = state.isConnected;
    });

    return () => unsubscribe();
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? colors.primary : colors.primaryDark,
        tabBarInactiveTintColor: isDark ? "#94a3b8" : "#64748b",
        tabBarStyle: {
          position: "absolute",
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === "ios" ? 90 : 70,
          paddingBottom: Platform.OS === "ios" ? 25 : 10,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={100}
            tint={isDark ? "dark" : "light"}
            style={[StyleSheet.absoluteFill, { overflow: "hidden" }]}
          />
        ),
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "home-variant" : "home-variant-outline"}
              size={size}
              color={color}
            />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="Planner"
        options={{
          title: "Planner",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "calendar" : "calendar-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="QuizRoom"
        options={{
          title: "QuizHive",
          tabBarIcon: ({ color, size, focused }) => (
            <FontAwesome5
              name={focused ? "question-circle" : "question"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="StudyPlace"
        options={{
          title: "Hive",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "library" : "library-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Hubs"
        options={{
          title: "Hub",
          tabBarIcon: ({ color, size, focused }) => (
            <Feather
              name={focused ? "grid" : "grid"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
