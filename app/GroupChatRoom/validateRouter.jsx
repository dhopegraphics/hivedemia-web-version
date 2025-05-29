import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { useColorScheme } from "nativewind";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/backend/supabase";
import { colors } from "@/constants/Colors";
import useGroupsStore from "@/backend/store/groupsStore";
import { groupsDb } from "@/data/localDb";

const ValidateRouter = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { GroupId, GroupName, GroupIsPrivate } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const { addMemberLocallyAndSync, fetchMembersFromLocalDb } =
    useGroupsStore.getState();

  const LOCAL_KEYS = {
    JOINED_GROUPS: "joined_groups",
    CREATED_GROUPS: "created_groups",
  };

  const updateGroupCache = async (groupId, key) => {
    try {
      const existing = await AsyncStorage.getItem(key);
      const groups = existing ? JSON.parse(existing) : [];
      if (!groups.includes(groupId)) {
        groups.push(groupId);
        await AsyncStorage.setItem(key, JSON.stringify(groups));
      }
    } catch (e) {
      console.warn("Error updating cache:", e);
    }
  };

  const checkAndHandleMembership = async () => {
    const groupId = GroupId;
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) return;
    const userId = authData.user.id;

    try {
      const [joinedRaw, createdRaw] = await Promise.all([
        AsyncStorage.getItem(LOCAL_KEYS.JOINED_GROUPS),
        AsyncStorage.getItem(LOCAL_KEYS.CREATED_GROUPS),
      ]);
      const joinedGroups = joinedRaw ? JSON.parse(joinedRaw) : [];
      const createdGroups = createdRaw ? JSON.parse(createdRaw) : [];

      if (joinedGroups.includes(groupId) || createdGroups.includes(groupId)) {
        return router.push({
          pathname: "/GroupChatRoom/ChatRoom",
          params: { GroupId },
        });
      }

      const { data: groupData } = await supabase
        .from("groups")
        .select("created_by")
        .eq("id", groupId)
        .single();

      const userIsCreator = groupData?.created_by === userId;

      // Local membership check
      const memberExists = await groupsDb.getFirstAsync(
        "SELECT id FROM group_members WHERE group_id = ? AND user_id = ?",
        [groupId, userId]
      );

      const userIsMember = !!memberExists;

      if (userIsCreator && !userIsMember) {
        await addMemberLocallyAndSync({
          group_id: groupId,
          user_id: userId,
          role: "admin",
        });
        await updateGroupCache(groupId, LOCAL_KEYS.CREATED_GROUPS);
        return router.push({
          pathname: "/GroupChatRoom/ChatRoom",
          params: { GroupId },
        });
      }

      if (userIsMember) {
        await updateGroupCache(groupId, LOCAL_KEYS.JOINED_GROUPS);
        return router.push({
          pathname: "/GroupChatRoom/ChatRoom",
          params: { GroupId },
        });
      }

      setLoading(false);
    } catch (e) {
      console.error("Validation error:", e);
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user.id;

    await addMemberLocallyAndSync({ group_id: GroupId, user_id: userId });

    await updateGroupCache(GroupId, LOCAL_KEYS.JOINED_GROUPS);
    router.push({ pathname: "/GroupChatRoom/ChatRoom", params: { GroupId } });
  };

  useEffect(() => {
    checkAndHandleMembership();
  }, []);

  if (loading) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: isDark ? colors.dark : colors.light }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          className="mt-4"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          Validating your access…
        </Text>
      </View>
    );
  }

  return (
    <View
      className="flex-1 justify-center items-center p-6"
      style={{ backgroundColor: isDark ? colors.dark : colors.light }}
    >
      <Ionicons name="lock-closed" size={64} color={colors.primary} />
      <Text
        className="mt-6 text-xl font-bold text-center"
        style={{ color: isDark ? colors.offwhite : colors.dark }}
      >
        Join {GroupName?.trim()}
      </Text>
      <Text
        className="text-center mt-2 mb-6"
        style={{ color: isDark ? `${colors.offwhite}AA` : `${colors.dark}AA` }}
      >
        {GroupIsPrivate === "true"
          ? "This is a private group. You'll need to join to access it."
          : "Join this study group to access discussions and materials."}
      </Text>
      <TouchableOpacity
        onPress={handleJoin}
        className="rounded-xl px-6 py-3"
        style={{ backgroundColor: colors.primary }}
      >
        <Text className="font-bold text-white">Join Group</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ValidateRouter;
