import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Animated,
  Easing,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/backend/supabase";

const GroupChatHeader = ({
  groupId,
  pinnedMessages = [],
  loadingPinned = false,
  onScrollToMessage,
  colors,
  isDark,
}) => {
  const router = useRouter();
  const [groupName, setGroupName] = useState("Group");
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const slideAnim = useRef(new Animated.Value(100)).current; // start hidden (100px down)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const autoCloseTimeout = useRef(null);
  const containerHeightAnim = useRef(new Animated.Value(5)).current; // New

  // Fetch group name
  const fetchGroupName = async () => {
    try {
      const { data, error } = await supabase
        .from("groups")
        .select("name")
        .eq("id", groupId)
        .single();

      if (error || !data) throw new Error("Group not found");
      setGroupName(data.name);
    } catch (err) {
      console.warn("Failed to fetch group name:", err.message);
      setGroupName("Unnamed Group");
    }
  };

  // Count online users from user_status for members in the group
  const fetchOnlineMembers = async () => {
    try {
      const { data: members, error: membersError } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId);

      if (membersError) throw new Error("Failed to fetch members");

      const memberIds = members.map((m) => m.user_id);

      if (memberIds.length === 0) {
        setOnlineCount(0);
        return;
      }

      const { data: statuses, error: statusError } = await supabase
        .from("user_status")
        .select("user_id")
        .in("user_id", memberIds)
        .eq("is_online", true);

      if (statusError) throw new Error("Failed to fetch statuses");
      setOnlineCount(statuses.length);
    } catch (err) {
      console.warn("Error fetching online members:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupName();
    fetchOnlineMembers();

    // Refresh online member count every 30 seconds
    const interval = setInterval(fetchOnlineMembers, 30000);
    return () => clearInterval(interval);
  }, [groupId]);

  const toggleDrawer = () => {
    if (drawerOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(containerHeightAnim, {
          toValue: 10,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false, // height cannot use native driver
        }),
      ]).start(() => setDrawerOpen(false));
      if (autoCloseTimeout.current) {
        clearTimeout(autoCloseTimeout.current);
      }
    } else {
      setDrawerOpen(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(containerHeightAnim, {
          toValue: 80,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
      ]).start();

      autoCloseTimeout.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 100,
            duration: 600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(containerHeightAnim, {
            toValue: 10,
            duration: 600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
          }),
        ]).start(() => setDrawerOpen(false));
      }, 8000);
    }
  };

  const handlePinnedMessageTap = (messageId) => {
    // Close the drawer
    if (drawerOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(containerHeightAnim, {
          toValue: 10,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
      ]).start(() => setDrawerOpen(false));
      if (autoCloseTimeout.current) {
        clearTimeout(autoCloseTimeout.current);
      }
    }

    // Call the passed scroll function
    if (onScrollToMessage) {
      onScrollToMessage(messageId);
    }
  };

  const renderPinnedMessages = () => {
    if (loadingPinned) {
      return <ActivityIndicator size="small" color="#888" />;
    }
    if (!pinnedMessages.length) return null;

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {pinnedMessages.slice(0, 5).map((msg) => (
          <TouchableOpacity
            key={msg.id}
            style={{
              marginRight: 12,
              backgroundColor: "#f1f5f9",
              borderRadius: 8,
              padding: 8,
              flexDirection: "row",
              alignItems: "center",
              minWidth: 120,
            }}
            onPress={() => handlePinnedMessageTap(msg.id)}
          >
            {msg.profiles?.avatar_url ? (
              <Image
                source={{ uri: msg.profiles.avatar_url }}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  marginRight: 8,
                }}
              />
            ) : (
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: "#ddd",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 8,
                }}
              >
                <Text style={{ fontWeight: "bold", color: "#888" }}>
                  {msg.profiles?.username?.[0]?.toUpperCase() || "U"}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={{ fontWeight: "bold", color: "#222" }}
              >
                {msg.profiles?.username || "User"}
              </Text>
              <Text numberOfLines={1} style={{ color: "#666", fontSize: 12 }}>
                {msg.content ||
                  (msg.message_type === "image"
                    ? "📷 Image"
                    : msg.message_type)}
              </Text>
            </View>
            <Ionicons
              name="bookmark"
              size={16}
              color="#fbbf24"
              style={{ marginLeft: 6 }}
            />
          </TouchableOpacity>
        ))}
        {pinnedMessages.length > 5 && (
          <TouchableOpacity
            style={{
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 12,
            }}
            onPress={() => {
              // TODO: open modal to view all pinned messages
            }}
          >
            <Text style={{ color: "#3b82f6", fontWeight: "bold" }}>
              View all
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  };

  return (
    <View
      style={{ backgroundColor: isDark ? colors.dark : colors.white }}
      className="bg-white mt-14 pt-4 px-4 border-b border-gray-200"
    >
      <View className="flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? colors.white : colors.dark}
          />
        </TouchableOpacity>

        <View className="flex-1 px-3">
          {loading ? (
            <ActivityIndicator size="small" color="#888" />
          ) : (
            <>
              <Text className="text-lg font-bold dark:text-white text-center text-gray-800">
                {groupName}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-primary-100 text-center mt-1">
                👥 {onlineCount} online
              </Text>
            </>
          )}
        </View>

        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/GroupChatRoom/GroupSettings",
              params: {
                groupId,
                groupName,
                onlineCount: onlineCount.toString(), // Ensure it's a string for URL
              },
            })
          }
        >
          <MaterialIcons
            name="settings"
            size={24}
            color={isDark ? colors.white : colors.dark}
          />
        </TouchableOpacity>
      </View>
      {/* Animated drawer */}
      <TouchableOpacity
        onPress={toggleDrawer}
        style={{
          paddingHorizontal: 12,
          alignSelf: "center",
          flexDirection: "row",
          alignItems: "center",
          marginTop: 5,
        }}
      >
        <Ionicons
          name={drawerOpen ? "chevron-down-outline" : "chevron-up-outline"}
          size={20}
          color={isDark ? colors.white : colors.dark}
          style={{ marginRight: 6 }}
        />
        <Text
          style={{
            color: isDark ? colors.white : colors.dark,
            fontWeight: "600",
          }}
        >
          {drawerOpen ? "Hide Pinned" : "Show Pinned"}
        </Text>
      </TouchableOpacity>

      {/* Animated drawer */}
      <Animated.View
        style={{ overflow: "hidden", height: containerHeightAnim }}
      >
        <Animated.View
          style={{
            marginTop: 12,
            transform: [{ translateY: slideAnim }],
            overflow: "hidden",
          }}
        >
          <View style={{ overflow: "hidden" }}>{renderPinnedMessages()}</View>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

export default GroupChatHeader;
