import { colors } from "@/constants/Colors";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const NotificationsScreen = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Mock data - replace with actual API calls
  const fetchNotifications = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockData = [
        {
          id: "1",
          type: "assignment",
          title: "New Assignment Posted",
          message: "Calculus II - Problem Set 3 is now available",
          time: "2 hours ago",
          read: false,
          icon: "assignment",
          course: "MATH 202",
          action: {
            type: "navigate",
            screen: "AssignmentDetail",
            params: { id: "123" },
          },
        },
        {
          id: "2",
          type: "announcement",
          title: "Class Cancellation",
          message: "Psychology 101 lecture canceled tomorrow",
          time: "5 hours ago",
          read: true,
          icon: "announcement",
          course: "PSYCH 101",
          action: { type: "navigate", screen: "Announcements" },
        },
        {
          id: "3",
          type: "grade",
          title: "Grade Updated",
          message: "Your grade for History Midterm has been posted",
          time: "1 day ago",
          read: false,
          icon: "grade",
          course: "HIST 150",
          action: { type: "navigate", screen: "Grades" },
        },
        {
          id: "4",
          type: "discussion",
          title: "New Discussion Reply",
          message: "Alex replied to your post in Calculus study group",
          time: "2 days ago",
          read: true,
          icon: "forum",
          course: "MATH 202",
          action: {
            type: "navigate",
            screen: "GroupDiscussion",
            params: { threadId: "456" },
          },
        },
      ];

      setNotifications(mockData);
      setUnreadCount(mockData.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      Alert.alert("Error", "Failed to load notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle notification press
  const handleNotificationPress = (notification) => {
    // Mark as read
    if (!notification.read) {
      const updated = notifications.map((n) =>
        n.id === notification.id ? { ...n, read: true } : n
      );
      setNotifications(updated);
      setUnreadCount(updated.filter((n) => !n.read).length);
    }

    // Handle action
    if (notification.action.type === "navigate") {
      router.push({
        pathname: `/${notification.action.screen}`,
        params: notification.action.params || {},
      });
    }
  };

  // Refresh control
  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  // Initial load
  useEffect(() => {
    fetchNotifications();

    // Set up notification listener
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        // Handle new notifications received while app is foregrounded
        setNotifications((prev) => [
          {
            id: Date.now().toString(),
            type: "general",
            title: notification.request.content.title,
            message: notification.request.content.body,
            time: "Just now",
            read: false,
            icon: "notifications",
          },
          ...prev,
        ]);
        setUnreadCount((prev) => prev + 1);
      }
    );

    return () => subscription.remove();
  }, []);

  // Notification icon component
  const NotificationIcon = ({ type }) => {
    const iconProps = { size: 24, color: colors.primary };

    switch (type) {
      case "assignment":
        return <MaterialIcons name="assignment" {...iconProps} />;
      case "announcement":
        return <MaterialIcons name="announcement" {...iconProps} />;
      case "grade":
        return <MaterialIcons name="grade" {...iconProps} />;
      case "discussion":
        return <MaterialIcons name="forum" {...iconProps} />;
      default:
        return <Ionicons name="notifications" {...iconProps} />;
    }
  };

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: isDark ? colors.dark : colors.light }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: isDark ? colors.dark : colors.light }}
    >
      {/* Header */}
      <View
        className={`px-6 pt-20 pb-4 flex-row justify-between items-center ${
          isDark ? "bg-primaryDark" : "bg-primary"
        }`}
      >
        <View className="flex-row items-center">
          <Text className="text-2xl font-bold" style={{ color: colors.white }}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <View className="ml-3 bg-white px-2 py-1 rounded-full">
              <Text
                className="text-xs font-bold"
                style={{ color: colors.primary }}
              >
                {unreadCount} new
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() =>
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
          }
        >
          <Text className="font-medium" style={{ color: colors.white }}>
            Mark all read
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notification List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-10">
            <MaterialCommunityIcons
              name="bell-off-outline"
              size={40}
              color={isDark ? colors.offwhite : colors.dark}
            />
            <Text
              className={`mt-3 text-lg ${
                isDark ? "text-offwhite" : "text-dark"
              }`}
            >
              No notifications yet
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleNotificationPress(item)}
            className={`px-6 py-4 border-b ${
              isDark ? "border-gray-700" : "border-gray-200"
            }`}
            style={{
              backgroundColor: !item.read
                ? isDark
                  ? `${colors.primaryDark}30`
                  : `${colors.primary}10`
                : "transparent",
            }}
          >
            <View className="flex-row">
              <View className="mr-4">
                <NotificationIcon type={item.type} />
              </View>
              <View className="flex-1">
                <View className="flex-row justify-between items-start">
                  <Text
                    className={`font-semibold ${
                      isDark ? "text-offwhite" : "text-dark"
                    }`}
                  >
                    {item.title}
                  </Text>
                  <Text
                    className={`text-xs ${
                      isDark ? "text-offwhite/80" : "text-dark/80"
                    }`}
                  >
                    {item.time}
                  </Text>
                </View>
                <Text
                  className={`mt-1 ${
                    isDark ? "text-offwhite/90" : "text-dark/90"
                  }`}
                >
                  {item.message}
                </Text>
                {item.course && (
                  <View className="mt-2 flex-row items-center">
                    <View
                      className={`px-2 py-1 rounded-full ${
                        isDark ? "bg-dark" : "bg-primaryLight"
                      }`}
                    >
                      <Text
                        className="text-xs"
                        style={{ color: colors.primary }}
                      >
                        {item.course}
                      </Text>
                    </View>
                    {!item.read && (
                      <View className="ml-2 w-2 h-2 rounded-full bg-primary" />
                    )}
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Bottom Actions */}
      <View
        className={`px-6 py-3 pb-12 flex-row justify-between ${
          isDark ? "bg-dark" : "bg-light"
        }`}
      >
        <TouchableOpacity className="flex-row items-center">
          <Ionicons
            name="filter"
            size={20}
            color={isDark ? colors.offwhite : colors.dark}
          />
          <Text className={`ml-2 ${isDark ? "text-offwhite" : "text-dark"}`}>
            Filter
          </Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center">
          <Ionicons
            name="settings"
            size={20}
            color={isDark ? colors.offwhite : colors.dark}
          />
          <Text className={`ml-2 ${isDark ? "text-offwhite" : "text-dark"}`}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default NotificationsScreen;
