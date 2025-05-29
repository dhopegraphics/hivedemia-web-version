import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/backend/supabase";
import { useGroupStore } from "@/backend/store/useGroupStore";
import { useUserStore } from "@/backend/store/useUserStore";
import { colors } from "../../constants/Colors";
import { useColorScheme } from "nativewind";

const GroupSettings = () => {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { groupId, groupName: initialGroupName } = useLocalSearchParams();
  const {
    group,
    loading: groupLoading,
    fetchGroupDetails,
    updateGroup,
    members,
  } = useGroupStore();
  const { profile: user } = useUserStore();

  const [name, setName] = useState(initialGroupName || "");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Check if user is admin or owner
  useEffect(() => {
    const checkUserPermissions = () => {
      if (!user || !group) return;

      // Check if user is owner
      const isOwner = group.created_by === user.user_id;
      setIsOwner(isOwner);

      // Check if user is admin
      const userMembership = members.find((m) => m.user_id === user.user_id);
      setIsUserAdmin(isOwner || (userMembership && userMembership.is_admin));
    };

    checkUserPermissions();
  }, [user, group, members]);

  // Fetch group details
  useEffect(() => {
    if (groupId) {
      fetchGroupDetails(groupId);
    }
  }, [groupId]);

  // Populate form with group data
  useEffect(() => {
    if (group) {
      setName(group.name || "");
      setDescription(group.description || "");
      setSubject(group.subject || "");
      setIsPrivate(group.isPrivate || false);
      setJoinCode(group.join_code || "");
      setPassword(group.password || "");
      setAvatarUrl(group.avatar_url || null);
    }
  }, [group]);

  const uploadImage = async (uri) => {
    if (!isUserAdmin || !uri) return;
    setUploadingImage(true);

    try {
      const fileExt = uri.split(".").pop();
      const fileName = `group-${groupId}-${Date.now()}.${fileExt}`;
      const filePath = `group-avatars/${fileName}`;

      console.log("Uploading image to:", filePath);

      const response = await supabase.storage.from("chat-media").upload(
        filePath,
        {
          uri,
          name: fileName,
          type: `image/${fileExt}`,
        },
        {
          upsert: true,
        }
      );

      if (response.error) throw response.error;

      const { data: publicUrlData } = supabase.storage
        .from("chat-media")
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl)
        throw new Error("Failed to get public URL");

      await updateGroup(groupId, { avatar_url: publicUrlData.publicUrl });
      setAvatarUrl(publicUrlData.publicUrl);

      Alert.alert("Success", "Group avatar updated successfully");
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error("Image upload error:", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePickImage = async () => {
    if (!isUserAdmin) {
      Alert.alert(
        "Permission Denied",
        "Only group admins can change the group avatar."
      );
      return;
    }

    try {
      // Request permissions first
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "We need camera roll permissions to change the group avatar."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType, // Only images, not videos
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, // Reduced quality for smaller file size
        maxWidth: 300, // Limit image dimensions
        maxHeight: 300,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];
        console.log("Selected image:", selectedImage);

        // Check file size (limit to 1MB)
        const fileSize = selectedImage.fileSize || 0;
        if (fileSize > 1024 * 1024) {
          Alert.alert(
            "Image Too Large",
            "Please select an image smaller than 1MB."
          );
          return;
        }

        uploadImage(selectedImage.uri);
      }
    } catch (error) {
      console.log("Error picking image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  const handleGenerateJoinCode = () => {
    if (!isUserAdmin) {
      Alert.alert(
        "Permission Denied",
        "Only group admins can generate join codes."
      );
      return;
    }

    // Generate a random 8-character join code
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    setJoinCode(result);
  };

  const handleSaveChanges = async () => {
    if (!isUserAdmin) {
      Alert.alert(
        "Permission Denied",
        "Only group admins can update group settings."
      );
      return;
    }

    if (!name.trim()) {
      Alert.alert("Error", "Group name cannot be empty");
      return;
    }

    if (subject && subject.length > 119) {
      Alert.alert("Error", "Subject must be less than 120 characters");
      return;
    }

    if (password && password.length > 99) {
      Alert.alert("Error", "Password must be less than 100 characters");
      return;
    }

    setLoading(true);
    try {
      const updates = {
        name: name.trim(),
        description: description.trim(),
        subject: subject.trim(),
        isPrivate,
        join_code: joinCode.trim(),
        password: password.trim() || null,
      };

      await updateGroup(groupId, updates);
      Alert.alert("Success", "Group settings updated successfully");
    } catch (error) {
      console.error("Error updating group:", error);
      Alert.alert(
        "Error",
        "Failed to update group settings. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewMembers = () => {
    router.push({
      pathname: "/GroupChatRoom/GroupMembers",
      params: { groupId },
    });
  };

  const handleLeaveGroup = () => {
    Alert.alert("Leave Group", "Are you sure you want to leave this group?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("group_members")
              .delete()
              .match({ group_id: groupId, user_id: user.user_id });

            if (error) throw error;

            router.back();
            router.back(); // Go back to group list
            Alert.alert("Success", "You have left the group");
          } catch (error) {
            console.error("Error leaving group:", error);
            Alert.alert("Error", "Failed to leave group. Please try again.");
          }
        },
      },
    ]);
  };

  const handleDeleteGroup = () => {
    if (!isOwner) {
      Alert.alert(
        "Permission Denied",
        "Only the group owner can delete the group."
      );
      return;
    }

    Alert.alert(
      "Delete Group",
      "Are you sure you want to delete this group? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("groups")
                .delete()
                .eq("id", groupId);

              if (error) throw error;

              router.back();
              router.back(); // Go back to group list
              Alert.alert("Success", "Group deleted successfully");
            } catch (error) {
              console.error("Error deleting group:", error);
              Alert.alert("Error", "Failed to delete group. Please try again.");
            }
          },
        },
      ]
    );
  };

  if (groupLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">Loading group settings...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-gray-50"
    >
      <ScrollView
        className="flex-1 pt-20"
        contentContainerStyle={{ paddingBottom: 100 }}
        style={{ backgroundColor: isDark ? colors.dark : colors.light }}
      >
        {/* Header */}
        <View
          style={{ backgroundColor: isDark ? colors.dark : colors.light }}
          className=" px-4 py-6 flex-row items-center border-b dark:border-primary-100 border-gray-200"
        >
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDark ? colors.white : colors.dark}
            />
          </TouchableOpacity>
          <Text className="text-xl font-bold dark:text-white text-gray-800">
            Group Settings
          </Text>
        </View>

        {/* Group Avatar */}
        <View className="items-center mt-6">
          <TouchableOpacity
            onPress={handlePickImage}
            className="relative"
            disabled={!isUserAdmin || uploadingImage}
          >
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                className="w-24 h-24 rounded-full"
              />
            ) : (
              <View className="w-24 h-24 rounded-full bg-gray-300 justify-center items-center">
                <Text className="text-3xl font-bold text-gray-500">
                  {name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            {uploadingImage ? (
              <View className="absolute inset-0 rounded-full bg-black bg-opacity-50 justify-center items-center">
                <ActivityIndicator color="white" />
              </View>
            ) : (
              isUserAdmin && (
                <View className="absolute bottom-0 right-0 bg-primary-200 rounded-full p-2">
                  <Feather name="camera" size={16} color="white" />
                </View>
              )
            )}
          </TouchableOpacity>

          {!isUserAdmin && (
            <Text className="text-xs text-gray-500 mt-2">
              Only admins can change the group avatar
            </Text>
          )}
        </View>

        {/* Group Settings Form */}
        <View className="px-4 pt-6">
          <Text className="text-lg font-bold dark:text-primary-100 text-gray-800 mb-4">
            General Settings
          </Text>

          {/* Group Name */}
          <View className="mb-4">
            <Text className="text-sm font-medium dark:text-primary-100 text-gray-700 mb-1">
              Group Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={{
                backgroundColor: isDark ? colors.offwhite : colors.light,
              }}
              className="border  dark:border-white rounded-lg px-4 py-3  text-gray-800"
              placeholder="Enter group name"
              editable={isUserAdmin}
            />
            {!isUserAdmin && (
              <Text className="text-xs text-gray-500 mt-1">
                Only admins can change the group name
              </Text>
            )}
          </View>
          {/* Description */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Description
            </Text>
            <TextInput
              style={{
                backgroundColor: isDark ? colors.offwhite : colors.light,
              }}
              value={description}
              onChangeText={setDescription}
              className="border border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-800 min-h-[80px]"
              placeholder="Enter group description"
              multiline
              textAlignVertical="top"
              editable={isUserAdmin}
            />
          </View>

          {/* Subject */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Subject
            </Text>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              style={{
                backgroundColor: isDark ? colors.offwhite : colors.light,
              }}
              className="border dark:border-white rounded-lg px-4 py-3  text-gray-800"
              placeholder="Enter group subject"
              editable={isUserAdmin}
              maxLength={119}
            />
            <Text className="text-xs text-gray-500 mt-1 text-right">
              {subject?.length || 0}/119
            </Text>
          </View>

          {/* Private Group */}
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-sm font-medium dark:text-white text-gray-700">
                Private Group
              </Text>
              <Text className="text-xs text-gray-500">
                Private groups are not visible in public listings
              </Text>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              disabled={!isUserAdmin}
              trackColor={{ false: "#d1d5db", true: "#00DF82" }}
              thumbColor={isPrivate ? "#ffffff" : "#ffffff"}
            />
          </View>

          {/* Join Code */}
          <View className="mb-4">
            <Text
              style={{ color: isDark ? colors.primary : colors.light }}
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Join Code
            </Text>
            <View className="flex-row">
              <TextInput
                value={joinCode}
                onChangeText={setJoinCode}
                className="flex-1 border border-gray-300 rounded-l-lg px-4 py-3 bg-white text-gray-800"
                placeholder="Join code"
                editable={isUserAdmin}
              />
              <TouchableOpacity
                onPress={handleGenerateJoinCode}
                disabled={!isUserAdmin}
                className={`px-4 justify-center items-center rounded-r-lg ${
                  isUserAdmin ? "bg-primary-100" : "bg-gray-300"
                }`}
              >
                <Text className=" dark:text-black text-white font-medium">
                  Generate
                </Text>
              </TouchableOpacity>
            </View>
            <Text className="text-xs dark:text-primary-100  text-gray-500 mt-1">
              Share this code with others to join the group
            </Text>
          </View>

          {/* Password */}
          <View className="mb-4">
            <Text className="text-sm dark:text-primary-100 font-medium text-gray-700 mb-1">
              Password (Optional)
            </Text>
            <TextInput
              style={{
                backgroundColor: isDark ? colors.offwhite : colors.light,
              }}
              value={password}
              onChangeText={setPassword}
              className="border border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-800"
              placeholder="Enter group password"
              secureTextEntry
              editable={isUserAdmin}
              maxLength={99}
            />
            <Text className="text-xs dark:text-white text-gray-500 mt-1">
              {password ? "Password protection enabled" : "No password set"}
            </Text>
          </View>

          {/* Save Button */}
          {isUserAdmin && (
            <TouchableOpacity
              onPress={handleSaveChanges}
              disabled={loading}
              className={`rounded-lg py-3 px-4 mb-6 ${
                loading ? "bg-gray-400" : "dark:bg-primary-100"
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white font-bold text-center">
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Member Management */}
        <View className="px-4 pt-4">
          <Text className="text-lg font-bold dark:text-white text-gray-800 mb-4">
            Member Management
          </Text>

          <TouchableOpacity
            onPress={handleViewMembers}
            style={{ backgroundColor: isDark ? colors.offwhite : colors.light }}
            className="flex-row items-center justify-between bg-white rounded-lg px-4 py-4 mb-3 border border-gray-200"
          >
            <View className="flex-row items-center">
              <Ionicons name="people" size={20} color="#4b5563" />
              <Text className="text-gray-800 ml-3">View Members</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View className="px-4 pt-6">
          <Text className="text-lg font-bold dark:text-primary-100 text-gray-800 mb-4">
            Actions
          </Text>

          <TouchableOpacity
            onPress={handleLeaveGroup}
            style={{ backgroundColor: isDark ? colors.offwhite : colors.light }}
            className="flex-row items-center justify-between bg-white rounded-lg px-4 py-4 mb-3 border border-gray-200"
          >
            <View className="flex-row items-center">
              <Ionicons name="exit-outline" size={20} color="#ef4444" />
              <Text className="text-red-500 ml-3">Leave Group</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          {isOwner && (
            <TouchableOpacity
              onPress={handleDeleteGroup}
              style={{
                backgroundColor: isDark ? colors.offwhite : colors.light,
              }}
              className="flex-row items-center justify-between rounded-lg px-4 py-4 mb-3 border border-gray-200"
            >
              <View className="flex-row items-center">
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                <Text className="text-red-500 ml-3">Delete Group</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default GroupSettings;
