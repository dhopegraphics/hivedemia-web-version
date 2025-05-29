import { useMessageStore } from "@/backend/store/messageStore";
import { useGroupStore } from "@/backend/store/useGroupStore";
import { useUserStore } from "@/backend/store/useUserStore";
import { supabase } from "@/backend/supabase";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const ForwardMessageScreen = () => {
  const {
    chatId,
    id: messageId,
    content: messageContent,
    file_url,
    message_type,
  } = useLocalSearchParams();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filteredChats, setFilteredChats] = useState([]);
  const { fetchJoinedGroups, groups } = useGroupStore();
  const { sendMessage } = useMessageStore();
  const [selectedTab, setSelectedTab] = useState("direct"); // 'direct' or 'groups'
  const currentUser = useUserStore((state) => state.profile);
  const fetchUser = useUserStore((state) => state.hydrateProfile);

  useEffect(() => {
    fetchUser(); // Fetch user once when component mounts
  }, [fetchUser]);

  useEffect(() => {
    // Load direct chats and groups

    fetchDirectChats();
    fetchJoinedGroups(currentUser.user_id);
  }, [currentUser.user_id , fetchDirectChats , fetchJoinedGroups]);

  useEffect(() => {
    // Filter chats based on search text
    if (searchText) {
      const filtered = chats.filter((chat) =>
        chat.name?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredChats(filtered);
    } else {
      setFilteredChats(chats);
    }
  }, [searchText, chats]);



  const fetchDirectChats = useCallback(async () => {
    try {
      setLoading(true);
      // Use direct_chats table instead of chats table
      const { data, error } = await supabase
        .from("direct_chats")
        .select("*, profiles!direct_chats_user2_id_fkey(*)")
        .eq("user1_id", currentUser.user_id);

      if (error) throw error;

      // Also fetch chats where the user is user2
      const { data: user2Chats, error: user2Error } = await supabase
        .from("direct_chats")
        .select("*, profiles!direct_chats_user1_id_fkey(*)")
        .eq("user2_id", currentUser.user_id);

      if (user2Error) throw user2Error;

      // Process chats where user is user1
      const processedChats1 = data.map((chat) => {
        return {
          id: chatId,
          name: chat.profiles?.username || chat.profiles?.full_name || "User",
          avatar: chat.profiles?.avatar_url,
          type: "direct",
          otherUserId: chat.user2_id,
        };
      });

      // Process chats where user is user2
      const processedChats2 = user2Chats.map((chat) => {
        return {
          id: chatId,
          name: chat.profiles?.username || chat.profiles?.full_name || "User",
          avatar: chat.profiles?.avatar_url,
          type: "direct",
          otherUserId: chat.user1_id,
        };
      });

      // Combine both sets of chats
      setChats([...processedChats1, ...processedChats2]);
    } catch (error) {
      console.error("Error fetching direct chats:", error);
      Alert.alert("Error", "Failed to load chats");
    } finally {
      setLoading(false);
    }
  }, [chatId, currentUser.user_id]);

  const handleForward = async (chat) => {
    try {
      // Create a new message with reference to the original
      await sendMessage({
        chatId: chat.id,
        senderId: currentUser.user_id,
        text: messageContent || "",
        message_type: message_type || "text",
        file_url: file_url || null,
        forwarded_from: messageId,
        chat_type: chat.type,
      });

      Alert.alert("Success", "Message forwarded successfully");
      router.back();
    } catch (error) {
      console.error("Error forwarding message:", error);
      Alert.alert("Error", "Failed to forward message");
    }
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      className="flex-row items-center p-4 border-b border-gray-200"
      onPress={() => handleForward(item)}
    >
      {/* Avatar */}
      <View className="h-12 w-12 rounded-full bg-gray-300 justify-center items-center overflow-hidden">
        {item.avatar ? (
          <Image
            source={{ uri: item.avatar }}
            className="h-12 w-12"
            resizeMode="cover"
          />
        ) : (
          <Ionicons
            name={item.type === "direct" ? "person" : "people"}
            size={24}
            color="#666"
          />
        )}
      </View>

      {/* Chat name */}
      <View className="ml-3 flex-1">
        <Text className="font-medium text-gray-800">{item.name}</Text>
        <Text className="text-gray-500 text-sm">
          {item.type === "direct" ? "Direct message" : "Group"}
        </Text>
      </View>

      {/* Forward icon */}
      <Ionicons name="arrow-forward" size={20} color="#3b82f6" />
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      );
    }

    const dataToShow =
      selectedTab === "direct"
        ? filteredChats.filter((chat) => chat.type === "direct")
        : groups.joinedGroups.map((group) => ({
            id: group.id,
            name: group.name,
            avatar: group.avatar_url,
            type: "group",
            memberCount: group.member_count || 0,
          }));

    if (dataToShow.length === 0) {
      return (
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-gray-500 text-center">
            {selectedTab === "direct"
              ? "No direct chats found"
              : "You haven't joined any groups yet"}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={dataToShow}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        className="flex-1"
                  initialNumToRender={10}
          maxToRenderPerBatch={10}
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="p-4 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold ml-4">Forward Message</Text>
      </View>

      {/* Preview of message being forwarded */}
      <View className="p-4 bg-gray-50 border-b border-gray-200">
        <Text className="text-gray-500 mb-2">Forwarding:</Text>
        <View className="bg-white p-3 rounded-lg border border-gray-200">
          {message_type === "text" ? (
            <Text numberOfLines={2}>{messageContent}</Text>
          ) : (
            <View className="flex-row items-center">
              <Ionicons
                name={
                  message_type === "image"
                    ? "image"
                    : message_type === "video"
                    ? "videocam"
                    : message_type === "audio"
                    ? "musical-note"
                    : "document"
                }
                size={20}
                color="#666"
              />
              <Text className="ml-2">
                {message_type.charAt(0).toUpperCase() + message_type.slice(1)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Search bar */}
      <View className="p-4 bg-white">
        <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-2">
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            className="flex-1 ml-2"
            placeholder="Search..."
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-gray-200">
        <TouchableOpacity
          className={`flex-1 py-3 ${
            selectedTab === "direct" ? "border-b-2 border-blue-500" : ""
          }`}
          onPress={() => setSelectedTab("direct")}
        >
          <Text
            className={`text-center font-medium ${
              selectedTab === "direct" ? "text-blue-500" : "text-gray-500"
            }`}
          >
            Direct Messages
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 ${
            selectedTab === "groups" ? "border-b-2 border-blue-500" : ""
          }`}
          onPress={() => setSelectedTab("groups")}
        >
          <Text
            className={`text-center font-medium ${
              selectedTab === "groups" ? "text-blue-500" : "text-gray-500"
            }`}
          >
            Groups
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chat list */}
      {renderContent()}
    </SafeAreaView>
  );
};

export default ForwardMessageScreen;
