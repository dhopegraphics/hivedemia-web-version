import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Animated,
  Easing,
} from "react-native";
import { useColorScheme } from "nativewind";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/backend/supabase";
import { useToast } from "@/context/ToastContext";
import { colors } from "@/constants/Colors";
import useGroupsStore from "@/backend/store/groupsStore";

function generateJoinCode(isPrivate, password = "") {
  const random = Math.random().toString(36).substring(2, 8); // e.g., "k2x9wd"
  return isPrivate ? `${random}-${password}` : random;
}

const GroupCreation = () => {
  const { colorScheme } = useColorScheme();
  const { createGroup } = useGroupsStore();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress] = useState(new Animated.Value(0));
  const { showToast } = useToast();

  // Form state
  const [groupData, setGroupData] = useState({
    name: "",
    subject: "",
    description: "",
    isPrivate: false,
    icon: "group",
    password: "",
  });

  // Available group icons
  const groupIcons = [
    { name: "group", label: "General" },
    { name: "school", label: "Academic" },
    { name: "science", label: "Science" },
    { name: "calculate", label: "Math" },
    { name: "history-edu", label: "History" },
    { name: "psychology", label: "Psychology" },
    { name: "computer", label: "Tech" },
    { name: "biotech", label: "Biology" },
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
    setGroupData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!groupData.name.trim()) {
      alert("Please enter a group name");
      return;
    }

    setIsCreating(true);
    animateProgress();

    try {
      const user = await supabase.auth.getUser();
      if (!user?.data?.user) {
        alert("You must be signed in.");
        return;
      }

      const joinCode = generateJoinCode(
        groupData.isPrivate,
        groupData.password
      );

      await createGroup({
        name: groupData.name,
        subject: groupData.subject,
        description: groupData.description,
        isPrivate: groupData.isPrivate,
        groupicon: groupData.icon,
        password: groupData.isPrivate ? groupData.password : null,
        join_code: joinCode,
        created_by: user.data.user.id,
      });

      showToast(`${groupData.name} Created Locally`, "success", 400);
      router.back();
    } catch (err) {
      console.error("Error saving group locally:", err);
      alert("Could not create group.");
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
            Creating {groupData.name || "your course"}...
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
      className="flex-1"
      style={{ backgroundColor: isDark ? colors.dark : colors.light }}
    >
      {/* Header */}
      <View
        className="px-6 pt-20 pb-4"
        style={{
          backgroundColor: isDark ? colors.primaryDark : colors.primary,
        }}
      >
        <View className="flex-row justify-between items-center mb-2">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text className="text-xl font-bold" style={{ color: colors.white }}>
            Create Study Group
          </Text>
          <TouchableOpacity onPress={handleSubmit}>
            <Text className="font-medium" style={{ color: colors.white }}>
              Create
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
        {/* Group Preview */}
        <View
          className="mb-6 p-4 rounded-xl"
          style={{
            backgroundColor: isDark ? `${colors.primaryDark}80` : colors.white,
            borderWidth: 1,
            borderColor: isDark ? colors.primaryDark : colors.primaryLight,
          }}
        >
          <View className="flex-row items-center mb-3">
            <MaterialIcons
              name={groupData.icon || "group"}
              size={32}
              color={colors.primary}
              style={{ marginRight: 12 }}
            />
            <View>
              <Text
                className="text-lg font-bold"
                style={{ color: isDark ? colors.offwhite : colors.dark }}
              >
                {groupData.name || "New Group"}
              </Text>
              <Text
                style={{
                  color: isDark ? `${colors.offwhite}80` : `${colors.dark}80`,
                }}
              >
                {groupData.subject || "Subject not specified"}
                {groupData.isPrivate && " • Private Group"}
              </Text>
            </View>
          </View>
          {groupData.description ? (
            <Text style={{ color: isDark ? colors.offwhite : colors.dark }}>
              {groupData.description}
            </Text>
          ) : (
            <Text
              style={{
                color: isDark ? `${colors.offwhite}50` : `${colors.dark}50`,
                fontStyle: "italic",
              }}
            >
              No description provided
            </Text>
          )}
        </View>

        {/* Form Fields */}
        <View className="mb-6">
          <Text
            className="text-sm mb-1"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            Group Name
          </Text>
          <TextInput
            className="p-3 rounded-lg mb-4"
            style={{
              backgroundColor: isDark
                ? `${colors.primaryDark}80`
                : colors.white,
              color: isDark ? colors.offwhite : colors.dark,
            }}
            placeholder="e.g. Calculus Warriors"
            placeholderTextColor={
              isDark ? `${colors.offwhite}80` : `${colors.dark}80`
            }
            value={groupData.name}
            onChangeText={(text) => handleInputChange("name", text)}
          />

          <Text
            className="text-sm mb-1"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            Subject
          </Text>
          <TextInput
            className="p-3 rounded-lg mb-4"
            style={{
              backgroundColor: isDark
                ? `${colors.primaryDark}80`
                : colors.white,
              color: isDark ? colors.offwhite : colors.dark,
            }}
            placeholder="e.g. Advanced Calculus"
            placeholderTextColor={
              isDark ? `${colors.offwhite}80` : `${colors.dark}80`
            }
            value={groupData.subject}
            onChangeText={(text) => handleInputChange("subject", text)}
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
            placeholder="What's this group about?"
            placeholderTextColor={
              isDark ? `${colors.offwhite}80` : `${colors.dark}80`
            }
            multiline
            value={groupData.description}
            onChangeText={(text) => handleInputChange("description", text)}
          />

          {/* Privacy Toggle */}
          <View
            className="flex-row justify-between items-center p-3 rounded-lg mb-4"
            style={{
              backgroundColor: isDark
                ? `${colors.primaryDark}80`
                : colors.white,
            }}
          >
            <View className="flex-row items-center">
              <MaterialIcons
                name={groupData.isPrivate ? "lock-outline" : "public"}
                size={24}
                color={colors.primary}
                style={{ marginRight: 12 }}
              />

              <Text style={{ color: isDark ? colors.offwhite : colors.dark }}>
                {groupData.isPrivate
                  ? "Turn Off For Public Group"
                  : "Switch to Private Group"}
              </Text>
            </View>
            <Switch
              value={groupData.isPrivate}
              onValueChange={(value) => handleInputChange("isPrivate", value)}
              trackColor={{ false: "#767577", true: colors.primaryLight }}
              thumbColor={groupData.isPrivate ? colors.primary : "#f4f3f4"}
            />
          </View>

          {/* Password Input (shown only when private) */}
          {groupData.isPrivate && (
            <>
              <Text
                className="text-sm mb-1"
                style={{ color: isDark ? colors.offwhite : colors.dark }}
              >
                Group Password
              </Text>
              <TextInput
                className="p-3 rounded-lg mb-4"
                style={{
                  backgroundColor: isDark
                    ? `${colors.primaryDark}80`
                    : colors.white,
                  color: isDark ? colors.offwhite : colors.dark,
                }}
                placeholder="Set a join password"
                placeholderTextColor={
                  isDark ? `${colors.offwhite}80` : `${colors.dark}80`
                }
                secureTextEntry
                value={groupData.password}
                onChangeText={(text) => handleInputChange("password", text)}
              />
              <Text
                className="text-xs mb-4"
                style={{
                  color: isDark ? `${colors.offwhite}80` : `${colors.dark}80`,
                }}
              >
                Members will need this password to join the group
              </Text>
            </>
          )}
        </View>

        {/* Icon Selection */}
        <View className="mb-6">
          <Text
            className="text-sm mb-3"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            Select Group Icon
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            <View className="flex-row space-x-3">
              {groupIcons.map((icon) => (
                <TouchableOpacity
                  key={icon.name}
                  className={`w-14 h-14 rounded-full items-center justify-center ${
                    groupData.icon === icon.name ? "border-2" : ""
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
                      groupData.icon === icon.name
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

        {/* Create Button */}
        <TouchableOpacity
          className="p-4 rounded-lg items-center mt-4"
          style={{ backgroundColor: colors.primary }}
          onPress={handleSubmit}
        >
          <Text className="font-bold" style={{ color: colors.white }}>
            Create Group
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default GroupCreation;
