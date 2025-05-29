import { useGroupStats } from "@/backend/store/useGroupStats";
import { getCachedGroups } from "@/utils/groupCache";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

const GroupsTab = ({
  isDark,
  colors,
  createdGroups,
  publicGroups,
  joinedGroups,
}) => {
  const {
    members,
    usersStatus,
    activities,
    fetchMembersCount,
    fetchOnlineCount,
    fetchLastActivity,
    subscribeToGroupUpdates,
    unsubscribeFromGroup,
  } = useGroupStats();

  useEffect(() => {
    // Subscribe when component mounts
    joinedGroups.forEach((group) => {
      fetchMembersCount(group.id);
      fetchOnlineCount(group.id);
      fetchLastActivity(group.id);
      subscribeToGroupUpdates(group.id);
    });

    return () => {
      // Cleanup subscriptions
      joinedGroups.forEach((group) => unsubscribeFromGroup(group.id));
    };
  }, [joinedGroups , fetchMembersCount, fetchOnlineCount, fetchLastActivity, subscribeToGroupUpdates, unsubscribeFromGroup]);

  const getActivityText = (activity) => {
    if (!activity) return "No activity yet";
    if (activity.message_type === "text") return activity.content;
    if (activity.is_typing) return "typing...";
    return `${activity.message_type} sent`;
  };

  // Extract IDs of already joined groups
  const joinedGroupIds = joinedGroups.map((g) => g.id);

  // Filter public groups to exclude already joined ones
  const filteredPublicGroups = publicGroups.filter(
    (g) => !joinedGroupIds.includes(g.id)
  );

  // Extract IDs of groups created by user
  const createdGroupsIds = createdGroups.map((g) => g.id);

  // Filter joined groups to exclude those created by user
  const filteredJoinedGroups = joinedGroups.filter(
    (g) => !createdGroupsIds.includes(g.id)
  );

  const handleValidate = useCallback(async (item) => {
    try {
      const { joined, created } = await getCachedGroups();
      const isCached = joined.includes(item.id) || created.includes(item.id);
      if (isCached) {
        router.push({
          pathname: "/GroupChatRoom/ChatRoom",
          params: {
            GroupId: item.id,
            GroupName: `${item?.name}`,
            GroupIsPrivate: item.isPrivate,
          },
        });
      } else {
        router.push({
          pathname: "/GroupChatRoom/validateRouter",
          params: {
            GroupId: item.id,
            GroupName: `${item?.name}`,
            GroupIsPrivate: item.isPrivate,
          },
        });
      }
    } catch (e) {
      console.warn("Cache check failed:", e);
      // Fallback to validation router
      router.push({
        pathname: "/GroupChatRoom/validateRouter",
        params: {
          GroupId: item.id,
          GroupName: `${item?.name}`,
          GroupIsPrivate: item.isPrivate,
        },
      });
    }
  }, []);
  const renderGroupSection = (title, groups) => (
    <>
      <Text
        className="text-lg font-bold mb-4 mt-4"
        style={{ color: isDark ? colors.offwhite : colors.dark }}
      >
        {title}
      </Text>

      <FlatList
        scrollEnabled={false}
        data={groups}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="rounded-xl p-4 mb-4"
            style={{
              backgroundColor: isDark
                ? `${colors.primaryDark}80`
                : colors.white,
            }}
            onPress={() => handleValidate(item)}
          >
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-row items-center">
                <MaterialIcons
                  name="groups"
                  size={24}
                  color={colors.primary}
                  style={{ marginRight: 12 }}
                />
                <View>
                  <Text
                    className="font-bold"
                    style={{
                      color: isDark ? colors.offwhite : colors.dark,
                    }}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={{
                      color: isDark
                        ? `${colors.offwhite}80`
                        : `${colors.dark}80`,
                    }}
                  >
                    {item.subject}
                  </Text>
                </View>
              </View>
              <View className="bg-primary px-2 py-1 rounded-full">
                <Text
                  className="text-xs font-bold"
                  style={{ color: colors.white }}
                >
                  {usersStatus[item.id] || 0} active
                </Text>
              </View>
            </View>

            <View className="flex-row justify-between items-center">
              <Text
                style={{
                  color: isDark ? `${colors.offwhite}80` : `${colors.dark}80`,
                }}
              >
                {members[item.id] || 0} members •{" "}
                {getActivityText(activities[item.id])}
              </Text>
              <Feather
                name="chevron-right"
                size={20}
                color={isDark ? colors.offwhite : colors.dark}
              />
            </View>
          </TouchableOpacity>
        )}
      />
    </>
  );

  return (
    <View>
      <TouchableOpacity
        className="mb-6 p-4 rounded-xl flex-row items-center"
        style={{
          backgroundColor: isDark ? colors.primaryDark : colors.primary,
        }}
        onPress={() => router.push("/GroupChatRoom/create-group")}
      >
        <Ionicons name="people" size={24} color={colors.white} />
        <Text className="ml-2 font-bold" style={{ color: colors.white }}>
          Create New Study Group
        </Text>
      </TouchableOpacity>

      {createdGroups.length > 0 &&
        renderGroupSection("Created By You", createdGroups)}

      {filteredPublicGroups.length > 0 &&
        renderGroupSection("Popular Study Groups", filteredPublicGroups)}

      {filteredJoinedGroups.length > 0 &&
        renderGroupSection("Joined Groups", filteredJoinedGroups)}

      <View className="mb-20" />
    </View>
  );
};

export default GroupsTab;
