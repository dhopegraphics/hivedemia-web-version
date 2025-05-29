import { useState, useEffect } from "react";
import { View, Text, Switch, TouchableOpacity } from "react-native";
import { supabase } from "@/backend/supabase";
import { colors } from "@/constants/Colors";
import { useColorScheme } from "nativewind";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function NotificationPreferencesScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [preferences, setPreferences] = useState({
    email_notifications: true,
    push_notifications: true,
    course_updates: true,
    assignment_reminders: true,
    discussion_activity: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotificationPreferences();
  }, []);

  const fetchNotificationPreferences = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error; // Ignore "no rows" error
      if (data) setPreferences(data);
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (key, value) => {
    const updatedPrefs = { ...preferences, [key]: value };
    setPreferences(updatedPrefs);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const updates = {
        user_id: user.id,
        ...updatedPrefs,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("notification_preferences")
        .upsert(updates);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating preferences:", error);
      // Revert on error
      setPreferences({ ...preferences });
    }
  };

  return (
    <View
      className="flex-1 p-4"
      style={{ backgroundColor: isDark ? colors.dark : colors.light }}
    >
      <View className="flex-row pt-16">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text
          className={`text-xl ml-16 font-bold mb-6 ${
            isDark ? "text-white" : "text-black"
          }`}
        >
          Notification Preferences
        </Text>
      </View>

      <View
        className={`rounded-lg overflow-hidden ${
          isDark ? "bg-gray-800" : "bg-white"
        }`}
      >
        <View className="p-4 border-b border-gray-200 flex-row justify-between items-center">
          <Text className={`${isDark ? "text-gray-300" : "text-gray-800"}`}>
            Email Notifications
          </Text>
          <Switch
            value={preferences.email_notifications}
            onValueChange={(value) =>
              updatePreferences("email_notifications", value)
            }
            trackColor={{ false: "#767577", true: "#3b82f6" }}
            thumbColor={preferences.email_notifications ? "#f4f3f4" : "#f4f3f4"}
          />
        </View>

        <View className="p-4 border-b border-gray-200 flex-row justify-between items-center">
          <Text className={`${isDark ? "text-gray-300" : "text-gray-800"}`}>
            Push Notifications
          </Text>
          <Switch
            value={preferences.push_notifications}
            onValueChange={(value) =>
              updatePreferences("push_notifications", value)
            }
            trackColor={{ false: "#767577", true: "#3b82f6" }}
            thumbColor={preferences.push_notifications ? "#f4f3f4" : "#f4f3f4"}
          />
        </View>

        <View className="p-4 border-b border-gray-200 flex-row justify-between items-center">
          <Text className={`${isDark ? "text-gray-300" : "text-gray-800"}`}>
            Course Updates
          </Text>
          <Switch
            value={preferences.course_updates}
            onValueChange={(value) =>
              updatePreferences("course_updates", value)
            }
            trackColor={{ false: "#767577", true: "#3b82f6" }}
            thumbColor={preferences.course_updates ? "#f4f3f4" : "#f4f3f4"}
          />
        </View>

        <View className="p-4 border-b border-gray-200 flex-row justify-between items-center">
          <Text className={`${isDark ? "text-gray-300" : "text-gray-800"}`}>
            Assignment Reminders
          </Text>
          <Switch
            value={preferences.assignment_reminders}
            onValueChange={(value) =>
              updatePreferences("assignment_reminders", value)
            }
            trackColor={{ false: "#767577", true: "#3b82f6" }}
            thumbColor={
              preferences.assignment_reminders ? "#f4f3f4" : "#f4f3f4"
            }
          />
        </View>

        <View className="p-4 flex-row justify-between items-center">
          <Text className={`${isDark ? "text-gray-300" : "text-gray-800"}`}>
            Discussion Activity
          </Text>
          <Switch
            value={preferences.discussion_activity}
            onValueChange={(value) =>
              updatePreferences("discussion_activity", value)
            }
            trackColor={{ false: "#767577", true: "#3b82f6" }}
            thumbColor={preferences.discussion_activity ? "#f4f3f4" : "#f4f3f4"}
          />
        </View>
      </View>

      <View className="mt-8">
        <Text
          className={`text-lg font-semibold mb-4 ${
            isDark ? "text-white" : "text-black"
          }`}
        >
          Notification Schedule
        </Text>

        <View
          className={`p-4 rounded-lg ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
        >
          <TouchableOpacity className="py-3 border-b border-gray-200 flex-row justify-between items-center">
            <Text className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Daily Digest
            </Text>
            <Text className={`${isDark ? "text-gray-400" : "text-gray-500"}`}>
              8:00 AM
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="py-3 flex-row justify-between items-center">
            <Text className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Assignment Reminders
            </Text>
            <Text className={`${isDark ? "text-gray-400" : "text-gray-500"}`}>
              9:00 AM
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
