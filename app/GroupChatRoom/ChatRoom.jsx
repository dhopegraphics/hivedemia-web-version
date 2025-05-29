import { useMessageStore } from "@/backend/store/messageStore";
import { useUserStore } from "@/backend/store/useUserStore";
import { supabase } from "@/backend/supabase";
import ChatHeader from "@/components/GroupChatRoom/GrpHiveChatHeader";
import ChatInput from "@/components/GroupChatRoom/GrpSmartHiveAiChatInput";
import MessageBubble from "@/components/GroupChatRoom/GrpSmartMessageBubble";
import { colors } from "@/constants/Colors";
import { updateUserOnlineStatus } from "@/utils/userPresence";
import { useLocalSearchParams } from "expo-router";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from "react-native";

const GroupChatRoom = () => {
  const flatListRef = useRef(null);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { GroupId } = useLocalSearchParams();
  const [typingUsers, setTypingUsers] = useState([]);
  const { profile: user } = useUserStore();
  const { messages, fetchMessages, sendMessage, initChat } = useMessageStore();
  const chatMessages = useMemo(() => messages[GroupId] || [], [messages, GroupId]);
  const [optionsMessageId, setOptionsMessageId] = useState(null);
  const [replyTarget, setReplyTarget] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [loadingPinned, setLoadingPinned] = useState(true);
  const [pinnedIds, setPinnedIds] = useState([]);
  // In your ChatRoom component
  useEffect(() => {
    const failedMessages = chatMessages.filter((msg) => msg.send_failed);
    if (failedMessages.length > 0) {
      // Show a subtle notification or retry option
    }
  }, [chatMessages]);

  // 2. Fetch pinned message IDs for this chat
  const fetchPinned = useCallback(async () => {
    const { data, error } = await supabase
      .from("pinned_messages")
      .select("message_id")
      .eq("chat_id", GroupId);

    if (!error && data) {
      setPinnedIds(data.map((row) => row.message_id));
    }
  }, [GroupId]);

  // 3. Fetch on mount and when GroupId changes
  useEffect(() => {
    if (GroupId) fetchPinned();
  }, [GroupId , fetchPinned]);

  useEffect(() => {
    let isMounted = true;

    // Initialize pinned messages
    const fetchPinned = async () => {
      setLoadingPinned(true);
      const { data, error } = await supabase
        .from("pinned_messages")
        .select(
          "id, message_id, pinned_at, messages!inner(*, profiles(username, avatar_url))"
        )
        .eq("chat_id", GroupId)
        .order("pinned_at", { ascending: false });

      if (error) {
        if (isMounted) {
          setPinnedMessages([]);
          setLoadingPinned(false);
        }
        return;
      }
      if (isMounted) {
        setPinnedMessages(
          (data || []).map((pin) => ({
            ...pin.messages,
            pinned_at: pin.pinned_at,
            pinned_id: pin.id,
            pinned_by: pin.pinned_by,
          }))
        );
        setLoadingPinned(false);
      }
    };

    fetchPinned();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`pinned-messages-${GroupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pinned_messages",
          filter: `chat_id=eq.${GroupId}`,
        },
        async (payload) => {
          if (!isMounted) return;

          const { eventType, new: newPin, old: oldPin } = payload;

          setPinnedMessages((current) => {
            switch (eventType) {
              case "INSERT":
                // For INSERT, we need to fetch full message data because payload only has pinned_messages row
                fetchPinned(); // fetch full data to update UI
                return current;

              case "UPDATE":
                // For UPDATE, refetch full data to stay consistent
                fetchPinned();
                return current;

              case "DELETE":
                // Remove unpinned message locally
                if (oldPin) {
                  return current.filter((msg) => msg.id !== oldPin.message_id);
                }
                return current;

              default:
                return current;
            }
          });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [GroupId]);

  useEffect(() => {
    if (!GroupId) return;

    // Listen for message deletions (is_deleted=true)
    const channel = supabase
      .channel(`group-chat-deletes-${GroupId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${GroupId}`,
        },
        (payload) => {
          const updatedMsg = payload.new;
          // Only handle soft deletes
          if (updatedMsg.is_deleted) {
            useMessageStore.setState((state) => {
              const existingMessages = state.messages[GroupId] || [];
              return {
                messages: {
                  ...state.messages,
                  [GroupId]: existingMessages.map((msg) =>
                    msg.id === updatedMsg.id
                      ? { ...msg, is_deleted: true }
                      : msg
                  ),
                },
              };
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [GroupId]);

  // Load user and chat messages
  useEffect(() => {
    if (!user) {
      useUserStore.getState().hydrateProfile();
    }

    initChat(GroupId);
    fetchMessages(GroupId, true);
    updateUserOnlineStatus(true);

    // Updated subscription logic in ChatRoom.jsx

    // Replace the existing subscription code (around line 197-225) with this:
    const channel = supabase
      .channel(`group-chat-${GroupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${GroupId}`,
        },
        (payload) => {
          const newMsg = payload.new;

          // Check if the message already exists in our local state
          useMessageStore.setState((state) => {
            const existingMessages = state.messages[GroupId] || [];
            const messageExists = existingMessages.some(
              (msg) =>
                msg.id === newMsg.id ||
                (msg.id.startsWith("local-") &&
                  msg.content === newMsg.content &&
                  msg.sender_id === newMsg.sender_id &&
                  Math.abs(
                    new Date(msg.created_at) - new Date(newMsg.created_at)
                  ) < 10000)
            );

            if (!messageExists) {
              return {
                messages: {
                  ...state.messages,
                  [GroupId]: [newMsg, ...existingMessages],
                },
              };
            }
            return state;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      updateUserOnlineStatus(false);
    };
  }, [GroupId , user, initChat, fetchMessages]);

  // Send message handler
  const handleSend = useCallback(
    async (text, _replyToId = null, media = null) => {
      if ((!text || !text.trim()) && !media) return;

      let currentUser = user;
      if (!currentUser) {
        await useUserStore.getState().hydrateProfile();
        currentUser = useUserStore.getState().profile;
      }
      if (!currentUser?.user_id) {
        console.warn("User profile not loaded or missing user_id");
        return;
      }

      sendMessage({
        chatId: GroupId,
        senderId: currentUser.user_id,
        text: text || "",
        reply_to: replyTarget?.id || null, // use replyTarget here
        message_type: media?.type || "text",
        file_url: media?.url || null,
      });

      setReplyTarget(null); // Clear reply after sending
    },
    [GroupId, user, sendMessage, replyTarget]
  );

  // Load older messages
  const loadMore = useCallback(() => {
    if (chatMessages.length > 0) {
      const oldest = chatMessages[chatMessages.length - 1].created_at;
      fetchMessages(GroupId, true, oldest);
    }
  }, [chatMessages, GroupId, fetchMessages]);

  const scrollToMessage = useCallback(
    (messageId) => {
      if (!messageId || !flatListRef.current) return;

      // Find the index of the message in the chatMessages array
      const messageIndex = chatMessages.findIndex(
        (msg) => msg.id === messageId
      );

      if (messageIndex !== -1) {
        // Since the FlatList is inverted, we use scrollToIndex
        flatListRef.current.scrollToIndex({
          index: messageIndex,
          animated: true,
          viewOffset: 50, // Add some offset to ensure visibility
        });

        // Optional: Highlight the message temporarily
        const timer = setTimeout(() => {
          useMessageStore.setState((state) => {
            const existingMessages = state.messages[GroupId] || [];
            const updatedMessages = existingMessages.map((msg) => {
              if (msg.id === messageId) {
                return { ...msg, isHighlighted: true };
              }
              return msg;
            });

            return {
              messages: {
                ...state.messages,
                [GroupId]: updatedMessages,
              },
            };
          });

          // Remove the highlight after 2 seconds
          setTimeout(() => {
            useMessageStore.setState((state) => {
              const existingMessages = state.messages[GroupId] || [];
              const updatedMessages = existingMessages.map((msg) => {
                if (msg.id === messageId) {
                  return { ...msg, isHighlighted: false };
                }
                return msg;
              });

              return {
                messages: {
                  ...state.messages,
                  [GroupId]: updatedMessages,
                },
              };
            });
          }, 2000);
        }, 100);

        return () => clearTimeout(timer);
      } else {
        loadMore();
      }
    },
    [chatMessages, GroupId , loadMore]
  );

  const handleScrollToIndexFailed = (info) => {
    const wait = new Promise((resolve) => setTimeout(resolve, 500));
    wait.then(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: info.index,
          animated: true,
          viewOffset: 50,
        });
      }
    });
  };

  useEffect(() => {
    if (!GroupId || !user?.user_id) return;

    const channel = supabase
      .channel("typing_status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "typing_indicators",
          filter: `chat_id=eq.${GroupId}`,
        },
        async (payload) => {
          const typingUserId = payload.new.user_id;
          const isTyping = payload.new.is_typing;

          if (typingUserId === user.user_id) return;

          // Fetch user profile for username and avatar
          const { data: userProfile, error } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("user_id", typingUserId)
            .single();

          if (error) {
            console.warn("Error fetching user profile:", error);
            return;
          }

          setTypingUsers((prev) => {
            const alreadyTyping = prev.some(
              (user) => user.user_id === typingUserId
            );
            if (isTyping && !alreadyTyping) {
              return [
                ...prev,
                {
                  user_id: typingUserId,
                  username: userProfile?.username,
                  avatar_url: userProfile?.avatar_url,
                },
              ];
            } else if (!isTyping && alreadyTyping) {
              return prev.filter((user) => user.user_id !== typingUserId);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [GroupId, user?.user_id]);

  return (
    <View
      style={{ backgroundColor: isDark ? colors.dark : colors.white }}
      className="flex-1 bg-gray-50"
    >
      <ChatHeader
        groupId={GroupId}
        pinnedMessages={pinnedMessages}
        loadingPinned={loadingPinned}
        onScrollToMessage={scrollToMessage}
        isDark={isDark}
        colors={colors}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={20}
      >
        <FlatList
          ref={flatListRef}
          data={chatMessages}
          keyExtractor={(item) =>
            item.id ? item.id.toString() : `local-${Date.now()}`
          }
          renderItem={({ item }) => (
            <MessageBubble
              message={{ ...item, pinned: pinnedIds.includes(item.id) }}
              isOwn={item.sender_id === user?.user_id}
              chatId={GroupId}
              userId={user?.user_id}
              showOptions={optionsMessageId === item.id}
              setShowOptions={(show) =>
                setOptionsMessageId(show ? item.id : null)
              }
              onReply={() => setReplyTarget(item)}
              fetchPinned={fetchPinned}
            />
          )}
          contentContainerStyle={{
            paddingBottom: 16,
            paddingTop: 8,
            paddingHorizontal: 16,
          }}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          inverted
        />

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <View className="px-4 pb-2 flex-row items-center">
            {/* Stack avatars */}
            <View className="flex-row -space-x-2 mr-2">
              {typingUsers.slice(0, 3).map((user, index) => (
                <View key={user.user_id} className="relative">
                  {user.avatar_url ? (
                    <Image
                      source={{ uri: user.avatar_url }}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 15,
                        borderWidth: 1,
                        borderColor: "white",
                      }}
                    />
                  ) : (
                    <View
                      className="flex items-center justify-center bg-gray-300 rounded-full"
                      style={{
                        width: 30,
                        height: 30,
                        backgroundColor: "#ccc",
                      }}
                    >
                      <Text className="text-white font-semibold text-sm">
                        {user.username?.[0].toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
            <Text className="italic  text-gray-500 text-sm">
              {typingUsers.length === 1
                ? `${typingUsers[0].username} is typing...`
                : `${typingUsers.length} people are typing...`}
            </Text>
          </View>
        )}

        <ChatInput
          onSend={handleSend}
          chatId={GroupId}
          replyTarget={replyTarget}
          onCancelReply={() => setReplyTarget(null)}
          message={chatMessages}
          isDark={isDark}
          colors={colors}
        />
      </KeyboardAvoidingView>
    </View>
  );
};

export default GroupChatRoom;
