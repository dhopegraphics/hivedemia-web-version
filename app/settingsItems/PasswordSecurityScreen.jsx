import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { supabase } from "@/backend/supabase";
import { colors } from "@/constants/Colors";
import { useColorScheme } from "nativewind";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function PasswordSecurityScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      className="flex-1  p-4"
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
          Password & Security
        </Text>
      </View>

      {error ? (
        <View className="bg-red-100 p-3 rounded-lg mb-4">
          <Text className="text-red-700">{error}</Text>
        </View>
      ) : null}

      {success ? (
        <View className="bg-green-100 p-3 rounded-lg mb-4">
          <Text className="text-green-700">{success}</Text>
        </View>
      ) : null}

      <View className="space-y-4">
        <View>
          <Text
            className={`mb-1 font-JakartaSemiBold ${
              isDark ? "text-primary-100" : "text-gray"
            }`}
          >
            Current Password
          </Text>
          <TextInput
            className={`p-3 rounded-lg ${
              isDark ? "bg-primary-200 text-white" : "bg-gray text-black"
            }`}
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
          />
        </View>

        <View>
          <Text
            className={`mb-1 font-JakartaSemiBold  mt-2 ${
              isDark ? "text-primary-100" : "text-gray"
            }`}
          >
            New Password
          </Text>
          <TextInput
            className={`p-3 rounded-lg ${
              isDark ? "bg-primary-200 text-white" : "bg-gray text-black"
            }`}
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password (min 6 chars)"
          />
        </View>

        <View>
          <Text
            className={`mb-1  font-JakartaSemiBold  mt-2  ${
              isDark ? "text-primary-100" : "text-gray"
            }`}
          >
            Confirm New Password
          </Text>
          <TextInput
            className={`p-3 rounded-lg ${
              isDark ? "bg-primary-200 text-white" : "bg-gray text-black"
            }`}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
          />
        </View>
      </View>

      <TouchableOpacity
        className="mt-8 py-3 bg-primary-100 rounded-lg items-center"
        onPress={handlePasswordChange}
        disabled={loading}
      >
        <Text className="text-white">
          {loading ? "Updating..." : "Update Password"}
        </Text>
      </TouchableOpacity>

      <View className="mt-8">
        <Text
          className={`text-lg font-semibold mb-4 ${
            isDark ? "text-white" : "text-black"
          }`}
        >
          Security
        </Text>

        <View
          className={`p-4 rounded-lg ${isDark ? "bg-primary-200" : "bg-gray"}`}
        >
          <View className="flex-row justify-between items-center mb-3">
            <Text className={`${isDark ? "text-primary-100" : "text-gray"}`}>
              Two-Factor Authentication
            </Text>
            <TouchableOpacity className="py-1 px-3 bg-primary-100 rounded-lg">
              <Text className="text-white">Enable</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-between items-center">
            <Text className={`${isDark ? "text-primary-100" : "text-gray"}`}>
              Active Sessions
            </Text>
            <TouchableOpacity className="py-1 px-3 bg-gray-500 rounded-lg">
              <Text className="text-white">View</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
