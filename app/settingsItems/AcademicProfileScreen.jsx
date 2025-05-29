import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { supabase } from "@/backend/supabase";
import { colors } from "@/constants/Colors";
import { useColorScheme } from "nativewind";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function AcademicProfileScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [profile, setProfile] = useState({
    university_id: "",
    major: "",
    year: "",
  });
  const [universities, setUniversities] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAcademicProfile();
    fetchUniversities();
  }, []);

  const fetchAcademicProfile = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("profiles")
        .select("university_id")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      if (data) setProfile(data);
    } catch (error) {
      console.error("Error fetching academic profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUniversities = async () => {
    try {
      const { data, error } = await supabase
        .from("universities")
        .select("id, name");

      if (error) throw error;
      setUniversities(data || []);
    } catch (error) {
      console.error("Error fetching universities:", error);
    }
  };

  const updateAcademicProfile = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const updates = {
        user_id: user.id,
        university_id: profile.university_id,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("profiles").upsert(updates);

      if (error) throw error;
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating academic profile:", error);
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
          Academic Information
        </Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text
            className={`mb-1 font-JakartaSemiBold ${
              isDark ? "text-primary-100" : "text-gray"
            }`}
          >
            University
          </Text>
          {isEditing ? (
            <View
              className={`p-2 rounded-lg ${
                isDark ? "bg-gray-700" : "bg-gray-100"
              }`}
            >
              <Picker
                selectedValue={profile.university_id}
                onValueChange={(itemValue) =>
                  setProfile({ ...profile, university_id: itemValue })
                }
                style={{ color: isDark ? "white" : "black" }}
              >
                <Picker.Item label="Select University" value="" />
                {universities.map((uni) => (
                  <Picker.Item key={uni.id} label={uni.name} value={uni.id} />
                ))}
              </Picker>
            </View>
          ) : (
            <Text className={`p-3 ${isDark ? "text-white" : "text-black"}`}>
              {universities.find((u) => u.id === profile.university_id)?.name ||
                "Not set"}
            </Text>
          )}
        </View>

        <View>
          <Text
            className={`mb-1 font-JakartaSemiBold text-primary-100 ${
              isDark ? "dark:text-primary-100" : "text-gray"
            }`}
          >
            Major/Program
          </Text>
          {isEditing ? (
            <TextInput
              className={`p-3 rounded-lg ${
                isDark ? "bg-gray-700 text-white" : "bg-gray-100 text-black"
              }`}
              value={profile.major}
              onChangeText={(text) => setProfile({ ...profile, major: text })}
              placeholder="Enter your major"
              placeholderTextColor={isDark ? colors.offwhite : colors.dark}
            />
          ) : (
            <Text className={`p-3 ${isDark ? "text-white" : "text-black"}`}>
              {profile.major || "Not set"}
            </Text>
          )}
        </View>

        <View>
          <Text
            className={`mb-1 font-JakartaSemiBold text-primary-100 ${
              isDark ? "dark:text-primary-100" : "text-gray-600"
            }`}
          >
            Year of Study
          </Text>
          {isEditing ? (
            <View
              className={`p-2 rounded-lg ${
                isDark ? "bg-gray-700" : "bg-gray-100"
              }`}
            >
              <Picker
                selectedValue={profile.year}
                onValueChange={(itemValue) =>
                  setProfile({ ...profile, year: itemValue })
                }
                style={{ color: isDark ? "white" : "black" }}
              >
                <Picker.Item label="Select Year" value="" />
                <Picker.Item label="Freshman" value="freshman" />
                <Picker.Item label="Sophomore" value="sophomore" />
                <Picker.Item label="Junior" value="junior" />
                <Picker.Item label="Senior" value="senior" />
                <Picker.Item label="Graduate" value="graduate" />
              </Picker>
            </View>
          ) : (
            <Text className={`p-3 ${isDark ? "text-white" : "text-black"}`}>
              {profile.year
                ? profile.year.charAt(0).toUpperCase() + profile.year.slice(1)
                : "Not set"}
            </Text>
          )}
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
              onPress={updateAcademicProfile}
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
            <Text className="text-white">Edit Academic Profile</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
