import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
} from "react-native";
import { useColorScheme } from "nativewind";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/backend/supabase";
import { useToast } from "@/context/ToastContext";
import { colors } from "@/constants/Colors";
import { useCourseStore } from "@/backend/store/useCourseStore";

const CreateCourse = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress] = useState(new Animated.Value(0));
  const { showToast } = useToast();

  // Form state
  const [courseData, setCourseData] = useState({
    title: "",
    code: "",
    description: "",
    professor: "",
    color: "#00DF82", // Default to primary color
    icon: "school", // Default icon
  });

  // Available course icons
  const courseIcons = [
    { name: "school", label: "School" },
    { name: "history-edu", label: "History" },
    { name: "science", label: "Science" },
    { name: "calculate", label: "Math" },
    { name: "language", label: "Language" },
    { name: "computer", label: "Computer" },
    { name: "music-note", label: "Music" },
    { name: "palette", label: "Art" },
  ];

  // Available colors
  const colorOptions = [
    "#00DF82", // Primary
    "#FF6B6B", // Red
    "#4E8AF4", // Blue
    "#FFC107", // Yellow
    "#9C27B0", // Purple
    "#FF5722", // Orange
    "#607D8B", // Gray
  ];

  const animateProgress = () => {
    Animated.timing(creationProgress, {
      toValue: 1,
      duration: 2000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  const handleInputChange = (field, value) => {
    setCourseData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    setIsCreating(true);
    animateProgress();

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("You must be logged in to create a course.");
        return;
      }

      // 💡 Ensure courses table exists
      await useCourseStore.getState().initCourseTable();

      const newCourse = {
        createdby: user.id,
        title: courseData.title.trim(),
        code: courseData.code.trim(),
        description: courseData.description.trim(),
        professor: courseData.professor.trim(),
        color: courseData.color,
        icon: courseData.icon,
      };

      const saved = await useCourseStore.getState().addLocalCourse(newCourse);

      if (!saved) throw new Error("Save failed");

      showToast(`${saved.code} saved locally`, "success", 400);

      await useCourseStore.getState().syncWithSupabase();
      router.back();
    } catch (e) {
      console.error("Submit failed:", e);
      alert("An error occurred. Please try again.");
    } finally {
      setIsCreating(false);
      creationProgress.setValue(0);
    }
  };

  const CreationLoader = () => (
    <View
      className="absolute inset-0 items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <View
        className={`p-6 rounded-2xl items-center ${
          isDark ? "bg-primaryDark" : "bg-white"
        }`}
        style={{ width: 280 }}
      >
        <View className="relative w-full h-3 bg-gray-200 rounded-full mb-4 overflow-hidden">
          <Animated.View
            className="absolute h-full rounded-full"
            style={{
              width: creationProgress.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
              backgroundColor: colors.primary,
            }}
          />
        </View>

        <View className="flex-row items-center">
          <Ionicons
            name="school"
            size={24}
            color={colors.primary}
            style={{ marginRight: 8 }}
          />
          <Text
            className={`text-lg font-semibold ${
              isDark ? "text-offwhite" : "text-dark"
            }`}
          >
            Creating {courseData.title || "your course"}...
          </Text>
        </View>

        <Text
          className={`mt-2 text-center ${
            isDark ? "text-offwhite/80" : "text-dark/80"
          }`}
        >
          Setting up your learning space
        </Text>
      </View>
    </View>
  );

  return (
    <View
      className="flex-1  "
      style={{ backgroundColor: isDark ? colors.dark : colors.light }}
    >
      {/* Header */}
      <View
        className="px-6 pt-20  pb-4"
        style={{
          backgroundColor: isDark ? colors.primaryDark : colors.primary,
        }}
      >
        <View className="flex-row justify-between items-center mb-2">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text className="text-xl font-bold" style={{ color: colors.white }}>
            Create Course
          </Text>
          <TouchableOpacity onPress={handleSubmit}>
            <Text className="font-medium" style={{ color: colors.white }}>
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isCreating && <CreationLoader />}

      {/* Main Content */}
      <ScrollView
        className="flex-1 px-6 pt-6"
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* Course Preview */}
        <View
          className="mb-6 p-4 rounded-xl flex-row items-center"
          style={{ backgroundColor: courseData.color || colors.primary }}
        >
          <MaterialIcons
            name={courseData.icon || "school"}
            size={32}
            color={colors.white}
            style={{ marginRight: 12 }}
          />
          <View>
            <Text className="text-xl font-bold" style={{ color: colors.white }}>
              {courseData.title || "New Course"}
            </Text>
            <Text style={{ color: colors.white }}>
              {courseData.code || "COURSE 101"}
            </Text>
          </View>
        </View>

        {/* Form Fields */}
        <View className="mb-6">
          <Text
            className="text-sm mb-1"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            Course Title
          </Text>
          <TextInput
            className="p-3 rounded-lg mb-4"
            style={{
              backgroundColor: isDark
                ? `${colors.primaryDark}80`
                : colors.white,
              color: isDark ? colors.offwhite : colors.dark,
            }}
            placeholder="e.g. World History"
            placeholderTextColor={
              isDark ? `${colors.offwhite}80` : `${colors.dark}80`
            }
            value={courseData.title}
            onChangeText={(text) => handleInputChange("title", text)}
          />

          <Text
            className="text-sm mb-1"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            Course Code
          </Text>
          <TextInput
            className="p-3 rounded-lg mb-4"
            style={{
              backgroundColor: isDark
                ? `${colors.primaryDark}80`
                : colors.white,
              color: isDark ? colors.offwhite : colors.dark,
            }}
            placeholder="e.g. HIST 201"
            placeholderTextColor={
              isDark ? `${colors.offwhite}80` : `${colors.dark}80`
            }
            value={courseData.code}
            onChangeText={(text) => handleInputChange("code", text)}
          />

          <Text
            className="text-sm mb-1"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            Professor
          </Text>
          <TextInput
            className="p-3 rounded-lg mb-4"
            style={{
              backgroundColor: isDark
                ? `${colors.primaryDark}80`
                : colors.white,
              color: isDark ? colors.offwhite : colors.dark,
            }}
            placeholder="e.g. Dr. Samantha Chen"
            placeholderTextColor={
              isDark ? `${colors.offwhite}80` : `${colors.dark}80`
            }
            value={courseData.professor}
            onChangeText={(text) => handleInputChange("professor", text)}
          />

          <Text
            className="text-sm mb-1"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            Description
          </Text>
          <TextInput
            className="p-3 rounded-lg mb-4 h-24"
            style={{
              backgroundColor: isDark
                ? `${colors.primaryDark}80`
                : colors.white,
              color: isDark ? colors.offwhite : colors.dark,
              textAlignVertical: "top",
            }}
            placeholder="Course description..."
            placeholderTextColor={
              isDark ? `${colors.offwhite}80` : `${colors.dark}80`
            }
            multiline
            value={courseData.description}
            onChangeText={(text) => handleInputChange("description", text)}
          />
        </View>

        {/* Icon Selection */}
        <View className="mb-6">
          <Text
            className="text-sm mb-3"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            Select Icon
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            <View className="flex-row space-x-3">
              {courseIcons.map((icon) => (
                <TouchableOpacity
                  key={icon.name}
                  className={`w-14 h-14 rounded-full items-center justify-center ${
                    courseData.icon === icon.name ? "border-2" : ""
                  }`}
                  style={{
                    backgroundColor: isDark
                      ? `${colors.primaryDark}80`
                      : `${colors.primary}20`,
                    borderColor: colors.primary,
                  }}
                  onPress={() => handleInputChange("icon", icon.name)}
                >
                  <MaterialIcons
                    name={icon.name}
                    size={24}
                    color={
                      courseData.icon === icon.name
                        ? colors.primary
                        : isDark
                        ? colors.offwhite
                        : colors.dark
                    }
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Color Selection */}
        <View className="mb-6">
          <Text
            className="text-sm mb-3"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            Select Color
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            <View className="flex-row space-x-3">
              {colorOptions.map((color) => (
                <TouchableOpacity
                  key={color}
                  className={`w-10 h-10 rounded-full ${
                    courseData.color === color ? "border-2 border-white" : ""
                  }`}
                  style={{ backgroundColor: color }}
                  onPress={() => handleInputChange("color", color)}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          className="p-4 rounded-lg items-center mt-4"
          style={{ backgroundColor: colors.primary }}
          onPress={handleSubmit}
        >
          <Text className="font-bold" style={{ color: colors.white }}>
            Create Course
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default CreateCourse;
