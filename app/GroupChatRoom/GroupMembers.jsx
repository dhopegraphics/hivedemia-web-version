import { useGroupStore } from "@/backend/store/useGroupStore";
import { useUserStore } from "@/backend/store/useUserStore";
import { colors } from "@/constants/Colors";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const GroupMembers = () => {
  const router = useRouter();
  const { groupId } = useLocalSearchParams();
  const {
    group,
    loading: groupLoading,
    fetchGroupDetails,
    members,
    removeMember,
    promoteAdmin,
    transferOwnership,
  } = useGroupStore();
  const { profile: user } = useUserStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [expandedMember, setExpandedMember] = useState(null);

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
  }, [groupId , fetchGroupDetails]);

  // Filter members based on search query
  useEffect(() => {
    if (!members) {
      setFilteredMembers([]);
      return;
    }

    if (!searchQuery.trim()) {
      setFilteredMembers(members);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = members.filter((member) => {
      const username = member.profiles?.username?.toLowerCase() || "";
      const email = member.profiles?.email?.toLowerCase() || "";
      return username.includes(query) || email.includes(query);
    });

    setFilteredMembers(filtered);
  }, [members, searchQuery]);

  const handleToggleExpand = (memberId) => {
    if (expandedMember === memberId) {
      setExpandedMember(null);
    } else {
      setExpandedMember(memberId);
    }
  };

  const handleRemoveMember = (memberId) => {
    if (!isUserAdmin) {
      Alert.alert("Permission Denied", "Only admins can remove members");
      return;
    }

    // Don't allow removing yourself
    if (memberId === user.user_id) {
      Alert.alert(
        "Error",
        "You cannot remove yourself from the group. Use the leave group option instead."
      );
      return;
    }

    // Don't allow removing the owner
    if (group.created_by === memberId) {
      Alert.alert("Error", "You cannot remove the group owner");
      return;
    }

    Alert.alert(
      "Remove Member",
      "Are you sure you want to remove this member from the group?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await removeMember(groupId, memberId);
              // Refresh group details to update members list
              await fetchGroupDetails(groupId);
              Alert.alert("Success", "Member removed successfully");
            } catch (error) {
              console.error("Error removing member:", error);
              Alert.alert(
                "Error",
                "Failed to remove member. Please try again."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleAdmin = async (memberId, currentIsAdmin) => {
    if (!isOwner) {
      Alert.alert(
        "Permission Denied",
        "Only the group owner can change admin status"
      );
      return;
    }

    setLoading(true);
    try {
      // We need to change the column name from is_admin to match the schema
      await promoteAdmin(groupId, memberId, !currentIsAdmin);
      // Refresh group details to update members list
      await fetchGroupDetails(groupId);

      if (currentIsAdmin) {
        Alert.alert("Success", "Admin privileges revoked");
      } else {
        Alert.alert("Success", "Member promoted to admin");
      }
    } catch (error) {
      console.error("Error toggling admin status:", error);
      Alert.alert("Error", "Failed to update admin status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTransferOwnership = (newOwnerId) => {
    if (!isOwner) {
      Alert.alert(
        "Permission Denied",
        "Only the group owner can transfer ownership"
      );
      return;
    }

    Alert.alert(
      "Transfer Ownership",
      "Are you sure you want to transfer ownership of this group? You will no longer be the owner.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Transfer",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await transferOwnership(groupId, newOwnerId);
              // Refresh group details to update ownership
              await fetchGroupDetails(groupId);
              Alert.alert(
                "Success",
                "Group ownership transferred successfully"
              );
            } catch (error) {
              console.error("Error transferring ownership:", error);
              Alert.alert(
                "Error",
                "Failed to transfer ownership. Please try again."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderMemberItem = ({ item }) => {
    const isExpanded = expandedMember === item.id;
    const isAdmin = item.is_admin;
    const isGroupOwner = group && group.created_by === item.user_id;
    const isCurrentUser = user && user.user_id === item.user_id;

    return (
      <View className="mb-2">
        <TouchableOpacity
          onPress={() => handleToggleExpand(item.id)}
          className={`flex-row items-center bg-white p-4 rounded-lg ${
            isExpanded ? "rounded-b-none border-b border-gray-100" : ""
          }`}
        >
          {/* Profile picture */}
          {item.profiles?.avatar_url ? (
            <Image
              source={{ uri: item.profiles.avatar_url }}
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <View className="w-12 h-12 rounded-full bg-gray-300 justify-center items-center">
              <Text className="text-xl font-bold text-gray-500">
                {item.profiles?.username?.[0]?.toUpperCase() || "U"}
              </Text>
            </View>
          )}

          {/* User info */}
          <View className="flex-1 ml-3">
            <View className="flex-row items-center">
              <Text className="font-bold text-gray-800">
                {item.profiles?.username || "Unknown User"}
              </Text>
              {isCurrentUser && (
                <Text className="text-xs bg-gray-200 px-2 py-0.5 rounded-full ml-2">
                  You
                </Text>
              )}
              {isGroupOwner && (
                <Text className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full ml-2">
                  Owner
                </Text>
              )}
              {isAdmin && !isGroupOwner && (
                <Text className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full ml-2">
                  Admin
                </Text>
              )}
            </View>
            <Text className="text-gray-600 text-sm">
              {item.profiles?.email || ""}
            </Text>
          </View>

          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#9ca3af"
          />
        </TouchableOpacity>

        {/* Expanded actions */}
        {isExpanded && (
          <View className="bg-gray-50 px-4 py-3 rounded-b-lg">
            {isUserAdmin && !isGroupOwner && !isCurrentUser && (
              <TouchableOpacity
                onPress={() => handleRemoveMember(item.user_id)}
                className="flex-row items-center py-2"
                disabled={loading}
              >
                <Ionicons name="person-remove" size={18} color="#ef4444" />
                <Text className="text-red-500 ml-2">Remove from Group</Text>
              </TouchableOpacity>
            )}

            {isOwner && !isGroupOwner && !isCurrentUser && (
              <TouchableOpacity
                onPress={() => handleToggleAdmin(item.user_id, isAdmin)}
                className="flex-row items-center py-2"
                disabled={loading}
              >
                <MaterialIcons
                  name={isAdmin ? "admin-panel-settings" : "verified-user"}
                  size={18}
                  color="#3b82f6"
                />
                <Text className="text-blue-500 ml-2">
                  {isAdmin ? "Remove Admin Role" : "Make Admin"}
                </Text>
              </TouchableOpacity>
            )}

            {isOwner && !isGroupOwner && !isCurrentUser && (
              <TouchableOpacity
                onPress={() => handleTransferOwnership(item.user_id)}
                className="flex-row items-center py-2"
                disabled={loading}
              >
                <MaterialIcons name="swap-horiz" size={18} color="#f59e0b" />
                <Text className="text-amber-500 ml-2">Transfer Ownership</Text>
              </TouchableOpacity>
            )}

            {(isCurrentUser || (!isUserAdmin && !isGroupOwner)) && (
              <Text className="text-gray-500 text-sm py-2">
                Joined: {new Date(item.joined_at).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  if (groupLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">Loading members...</Text>
      </View>
    );
  }

  return (
    <View
      style={{ backgroundColor: isDark ? colors.dark : colors.light }}
      className="flex-1 pt-16 bg-gray-50"
    >
      {/* Header */}
      <View
        style={{ backgroundColor: isDark ? colors.dark : colors.light }}
        className="px-4  py-6 flex-row items-center border-b  dark:border-primary-200 border-gray-200"
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? colors.white : colors.dark}
          />
        </TouchableOpacity>
        <Text className="text-xl font-bold dark:text-white text-gray-800">
          Group Members
        </Text>
        {loading && (
          <ActivityIndicator
            size="small"
            color="#3b82f6"
            style={{ marginLeft: 10 }}
          />
        )}
      </View>

      {/* Search bar */}
      <View
        style={{ backgroundColor: isDark ? colors.dark : colors.light }}
        className="px-4 py-3 bg-white border-b dark:border-primary-200 border-gray-200"
      >
        <View
          style={{ backgroundColor: isDark ? colors.offwhite : colors.white }}
          className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2"
        >
          <Ionicons
            name="search"
            size={20}
            color={isDark ? colors.dark : colors.dark}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search members"
            className="flex-1 ml-2 text-gray-800"
            clearButtonMode="while-editing"
            placeholderTextColor={isDark ? colors.black : colors.dark}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Members count */}
      <View className="px-4 py-3 flex-row justify-between items-center">
        <Text className=" dark:text-primary-100 text-gray-600 font-medium">
          {filteredMembers.length}{" "}
          {filteredMembers.length === 1 ? "Member" : "Members"}
        </Text>
        {searchQuery.length > 0 && (
          <Text className="text-sm text-gray-500">
            {filteredMembers.length} results
          </Text>
        )}
      </View>

      {/* Members list */}
      <FlatList
        data={filteredMembers}
        renderItem={renderMemberItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View className="py-8 justify-center items-center">
            <Ionicons name="people" size={48} color="#d1d5db" />
            <Text className="text-gray-500 mt-3 text-center">
              {searchQuery.length > 0
                ? "No members match your search"
                : "No members found in this group"}
            </Text>
          </View>
        )}
                  initialNumToRender={10}
          maxToRenderPerBatch={10}
      />
    </View>
  );
};

export default GroupMembers;
