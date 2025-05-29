import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { supabase } from "@/backend/supabase";
import { colors } from "@/constants/Colors";
import { useColorScheme } from "nativewind";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function PersonalInformationScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [profile, setProfile] = useState({
    full_name: "",
    username: "",
    email: "",
    avatar_url: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      if (data) setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const updates = {
        user_id: user.id,
        full_name: profile.full_name,
        username: profile.username,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("profiles").upsert(updates);

      if (error) throw error;
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
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
          Personal Information
        </Text>
      </View>
      <View className="items-center mb-6">
        {profile.avatar_url ? (
          <Image
            source={{ uri: profile.avatar_url }}
            className="w-32 h-32 rounded-full mb-4"
          />
        ) : (
          <View className="w-32 h-32 rounded-full bg-gray-300 items-center justify-center mb-4">
            <Text className="text-4xl">👤</Text>
          </View>
        )}
        <TouchableOpacity className="py-2 px-4 bg-blue-500 rounded-lg">
          <Text className="text-white">Change Photo</Text>
        </TouchableOpacity>
      </View>

      <View className="space-y-4">
        <View>
          <Text
            className={`mb-1 font-JakartaSemiBold ${
              isDark ? "text-primary-100" : "text-gray"
            }`}
          >
            Full Name
          </Text>
          {isEditing ? (
            <TextInput
              className={`p-3 rounded-lg ${
                isDark ? "bg-gray-700 text-white" : "bg-gray-100 text-black"
              }`}
              value={profile.full_name}
              onChangeText={(text) =>
                setProfile({ ...profile, full_name: text })
              }
            />
          ) : (
            <Text className={`p-3 ${isDark ? "text-white" : "text-black"}`}>
              {profile.full_name || "Not set"}
            </Text>
          )}
        </View>

        <View>
          <Text
            className={`mb-1 font-JakartaSemiBold ${
              isDark ? "text-primary-100" : "text-gray-600"
            }`}
          >
            Username
          </Text>
          {isEditing ? (
            <TextInput
              className={`p-3 rounded-lg ${
                isDark ? "bg-gray-700 text-white" : "bg-gray-100 text-black"
              }`}
              value={profile.username}
              onChangeText={(text) =>
                setProfile({ ...profile, username: text })
              }
            />
          ) : (
            <Text className={`p-3 ${isDark ? "text-white" : "text-black"}`}>
              {profile.username || "Not set"}
            </Text>
          )}
        </View>

        <View>
          <Text
            className={`mb-1 font-JakartaSemiBold ${
              isDark ? "text-primary-100" : "text-gray-600"
            }`}
          >
            Email
          </Text>
          <Text className={`p-3 ${isDark ? "text-gray" : "text-gray"}`}>
            {profile.email}
          </Text>
        </View>
      </View>

      <View className="mt-8">
        {isEditing ? (
          <View className="flex-row justify-between">
            <TouchableOpacity
              className="py-3 px-6 bg-gray-500 rounded-lg"
              onPress={() => setIsEditing(false)}
            >
              <Text className="text-white">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="py-3 px-6 bg-blue-500 rounded-lg"
              onPress={updateProfile}
              disabled={loading}
            >
              <Text className="text-white">
                {loading ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            className="py-3 bg-blue-500 rounded-lg items-center"
            onPress={() => setIsEditing(true)}
          >
            <Text className="text-white">Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
