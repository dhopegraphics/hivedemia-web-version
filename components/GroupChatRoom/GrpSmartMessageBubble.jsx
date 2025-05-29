import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useMessageStore } from "@/backend/store/messageStore";
import { supabase } from "@/backend/supabase";
import { formatDistanceToNow } from "date-fns";
import * as Clipboard from "expo-clipboard"; // For copy
import * as Linking from "expo-linking";
import { router } from "expo-router";

const MessageBubble = ({
  message,
  isOwn,
  chatId,
  userId,
  showOptions,
  setShowOptions,
  onReply,
  fetchPinned,
}) => {
  const [sender, setSender] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [replyMessage, setReplyMessage] = useState(null);
  const [forwardedMessage, setForwardedMessage] = useState(null);

  useEffect(() => {
    if (message.isHighlighted) {
      // After 2 seconds, remove the highlight
      const timer = setTimeout(() => {
        message.isHighlighted = false;
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [message.isHighlighted]);

  // Pin or Unpin a message
  const handlePinUnpin = async () => {
    try {
      if (message.pinned) {
        // Unpin
        const { error } = await supabase
          .from("pinned_messages")
          .delete()
          .eq("message_id", message.id)
          .eq("chat_id", chatId);
        if (error) throw error;
        Alert.alert("Message unpinned");
      } else {
        // Pin
        const { error } = await supabase.from("pinned_messages").insert([
          {
            chat_id: chatId,
            chat_type: message.chat_type,
            message_id: message.id,
            pinned_by: userId,
          },
        ]);
        if (error) throw error;
        Alert.alert("Message pinned");
      }
      setShowOptions(false);
      fetchPinned(); // call the prop function to refresh pinned state!
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  // Edit a message (calls a callback, or you can implement inline editing)
  const handleEdit = () => {
    setShowOptions(false);
    // You can call a prop callback, or set a state in parent to show an input for editing
    // Example: onEdit && onEdit(message)
    Alert.alert("Edit", "Implement edit logic here (show input in parent)");
  };

  // Delete a message (soft delete)
  // In your MessageBubble component or your message store:
  const handleDelete = async () => {
    // Optimistically update UI
    useMessageStore.setState((state) => {
      const existingMessages = state.messages[chatId] || [];
      return {
        messages: {
          ...state.messages,
          [chatId]: existingMessages.map((msg) =>
            msg.id === message.id ? { ...msg, is_deleted: true } : msg
          ),
        },
      };
    });

    // Fire the API call in the background
    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_deleted: true })
        .eq("id", message.id);
      if (error) throw error;
      setShowOptions(false);
    } catch (err) {
      Alert.alert("Error", err.message);
      // Optionally: revert the optimistic update if error
    }
  };

  // Reply to a message (calls a callback to parent)
  const handleReply = () => {
    setShowOptions(false);
    onReply && onReply(message);
  };

  // Copy message content
  const handleCopy = async () => {
    if (message.content) {
      await Clipboard.setStringAsync(message.content);
      Alert.alert("Copied", "Message copied to clipboard");
      setShowOptions(false);
    }
  };

  const handleForward = async () => {
    if (message.content || message.file_url) {
      router.push({
        pathname: "/GroupChatRoom/ForwardMessageScreen",
        params: {
          chatId: chatId,
          id: message.id,
          content: message.content,
          file_url: message.file_url,
          message_type: message.message_type,
        },
      });
      setShowOptions(false);
    }
  };

  useEffect(() => {
    // Fetch sender information
    const fetchSender = async () => {
      if (message.sender_id) {
        // Fetch the profile directly from supabase
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", message.sender_id)
          .single();

        if (!error && data) {
          setSender(data);
        }
      }
    };

    // Fetch reply message if exists
    const fetchReplyMessage = async () => {
      if (message.reply_to) {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("id", message.reply_to)
          .single();

        if (!error && data) {
          setReplyMessage(data);
        }
      }
    };

    const fetchForwardedFrom = async () => {
      if (message.forwarded_from) {
        const { data, error } = await supabase
          .from("messages")
          .select("*, profiles(*)")
          .eq("id", message.forwarded_from)
          .single();

        if (!error && data) {
          setForwardedMessage(data);
        }
      }
    };

    fetchSender();
    if (message.reply_to) {
      fetchReplyMessage();
    }
    if (message.forwarded_from) {
      fetchForwardedFrom();
    }

    return () => {
      // Cleanup sound on unmount
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [message.sender_id, message.reply_to, message.forwarded_from]);

  const handlePlayAudio = async () => {
    try {
      if (sound) {
        // If sound is already loaded
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
     

     
      }
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  const handleDownloadFile = async () => {
    try {
      if (message.file_url) {
        await Linking.openURL(message.file_url);
      }
    } catch (error) {
      console.error("Error opening file:", error);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return "";
    }
  };

  const renderReplyPreview = () => {
    if (!replyMessage) return null;

    return (
      <View
        className={`mb-1 p-2 rounded-md bg-gray-100 border-l-2 ${
          isOwn ? "border-blue-400" : "border-gray-400"
        }`}
      >
        <Text className="text-xs text-gray-500">
          {replyMessage.sender_id === message.sender_id
            ? "Replied to self"
            : "Replied to message"}
        </Text>
        <Text className="text-xs" numberOfLines={1}>
          {replyMessage.content}
        </Text>
      </View>
    );
  };

  const renderForwardedInfo = () => {
    if (!message.forwarded_from) return null;

    return (
      <View className="mb-1 flex-row items-center">
        <Ionicons name="arrow-redo-outline" size={14} color="#6b7280" />
        <Text className="text-xs text-gray-500 ml-1">Forwarded message</Text>
      </View>
    );
  };

  const renderMessageContent = () => {
    // Handle deleted messages
    if (message.is_deleted) {
      return (
        <View className="flex-row items-center">
          <Ionicons name="trash-outline" size={16} color="#999" />
          <Text className="text-gray-500 italic ml-1">
            This message was deleted
          </Text>
        </View>
      );
    }

    // Handle different message types
    switch (message.message_type) {
      case "image":
        return (
          <Pressable onPress={() => Linking.openURL(message.file_url)}>
            <Image
              source={{ uri: message.file_url }}
              className="rounded-lg w-64 h-48"
              resizeMode="cover"
            />
            {message.content && (
              <Text
                className={`mt-1 ${isOwn ? "text-white" : "text-gray-800"}`}
              >
                {message.content}
              </Text>
            )}
          </Pressable>
        );

      case "video":
        return (
          <Pressable
            onPress={() => Linking.openURL(message.file_url)}
            className="rounded-lg overflow-hidden"
          >
            <View className="bg-black h-48 w-64 items-center justify-center rounded-lg">
              <Ionicons name="play-circle" size={48} color="white" />
              <Text className="text-white mt-2">Video</Text>
            </View>
            {message.content && (
              <Text
                className={`mt-1 ${isOwn ? "text-white" : "text-gray-800"}`}
              >
                {message.content}
              </Text>
            )}
          </Pressable>
        );

      case "audio":
        return (
          <View
            style={{ maxHeight: 50, width: "100%" }}
            className="bg-gray-200 rounded-full px-4 py-2 flex-row items-center"
          >
            <Pressable onPress={handlePlayAudio}>
              <Ionicons
                name={isPlaying ? "pause-circle" : "play-circle"}
                size={32}
                color={isOwn ? "#3b82f6" : "#4b5563"}
              />
            </Pressable>
            <View className="ml-2 flex-1">
              <View className="h-1 bg-gray-300 rounded-full">
                <View className="h-1 bg-blue-500 rounded-full w-1/3" />
              </View>
              <Text className="text-xs text-gray-500 mt-1">Audio message</Text>
            </View>
          </View>
        );

      case "file":
        return (
          <Pressable
            onPress={handleDownloadFile}
            className="flex-row items-center bg-gray-100 p-3 rounded-lg"
          >
            <Ionicons name="document-outline" size={24} color="#4b5563" />
            <View className="ml-2 flex-1">
              <Text
                className={`font-medium ${
                  isOwn ? "text-white" : "text-gray-800"
                }`}
              >
                {message.content || "File"}
              </Text>
              <Text className="text-xs text-gray-500">Tap to open</Text>
            </View>
            <Ionicons name="download-outline" size={20} color="#4b5563" />
          </Pressable>
        );

      case "system":
        return (
          <View className="bg-gray-100 px-4 py-2 rounded-full self-center">
            <Text className="text-gray-500 italic text-center">
              {message.content}
            </Text>
          </View>
        );

      default:
        // Regular text message
        return (
          <Text className={`${isOwn ? "text-white" : "text-gray-800"}`}>
            {message.content}
            {message.is_edited && (
              <Text className="text-xs italic ml-1"> (edited)</Text>
            )}
          </Text>
        );
    }
  };

  // Optimistic UI indicator for pending messages
  const isPending = message.id && message.id.toString().startsWith("local-");
  const hasFailed = message.send_failed;

  return (
    <View className={`mb-3 max-w-4/5 ${isOwn ? "self-end" : "self-start"}`}>
      {/* Message container */}
      <Pressable
        onLongPress={() => setShowOptions(!showOptions)}
        onPress={() => setShowOptions(false)}
      >
        <View>
          {/* Sender name for group messages when not own message */}
          {!isOwn && sender && (
            <Text className="text-xs text-gray-500 mb-1 ml-1">
              {sender.username || sender.full_name || "User"}
            </Text>
          )}

          {/* Reply preview if exists */}
          {message.reply_to && renderReplyPreview()}
          {message.forwarded_from && renderForwardedInfo()}

          {/* Main message bubble */}
          <View
            className={`rounded-lg px-3 py-2 ${
              isOwn
                ? "bg-blue-500"
                : message.message_type === "system"
                ? "bg-transparent"
                : "bg-white border border-gray-200"
            } ${message.message_type === "system" ? "self-center" : ""} 
            ${
              message.isHighlighted
                ? "border-2 border-yellow-400 bg-yellow-50"
                : ""
            }`}
            style={{ maxWidth: "100%", minWidth: "50%" }}
          >
            {renderMessageContent()}

            {/* Time and status indicators */}
            <View
              className={`flex-row items-center justify-end mt-1 ${
                isOwn ? "" : "justify-start"
              }`}
            >
              <Text
                className={`text-xs ${
                  isOwn ? "text-blue-100" : "text-gray-500"
                }`}
              >
                {formatTime(message.created_at)}
              </Text>

              {/* Message status indicators for own messages */}
              {isOwn && (
                <View className="ml-1 flex-row items-center">
                  {isPending && !hasFailed && (
                    <ActivityIndicator size="small" color="#E5E7EB" />
                  )}
                  {hasFailed && (
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                  )}
                  {!isPending && !hasFailed && (
                    <Ionicons name="checkmark-done" size={14} color="#E5E7EB" />
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </Pressable>

      {/* Message options (visible on long press) */}
      {showOptions && (
        <View
          className={`mt-1 rounded-md bg-white shadow-md p-2 ${
            isOwn ? "self-end" : "self-start"
          }`}
          style={{ zIndex: 1000 }}
        >
          {/* Always allow Reply */}
          <TouchableOpacity
            className="py-2 px-3 flex-row items-center"
            onPress={handleReply}
          >
            <Ionicons name="arrow-undo-outline" size={16} color="#4b5563" />
            <Text className="ml-2 text-gray-800">Reply</Text>
          </TouchableOpacity>

          {/* Only show other options if NOT deleted */}
          {!message.is_deleted && (
            <>
              {isOwn && (
                <>
                  <TouchableOpacity
                    className="py-2 px-3 flex-row items-center"
                    onPress={handleEdit}
                  >
                    <Ionicons name="pencil-outline" size={16} color="#4b5563" />
                    <Text className="ml-2 text-gray-800">Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="py-2 px-3 flex-row items-center"
                    onPress={handleDelete}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    <Text className="ml-2 text-red-500">Delete</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                className="py-2 px-3 flex-row items-center"
                onPress={handleCopy}
              >
                <Ionicons name="copy-outline" size={16} color="#4b5563" />
                <Text className="ml-2 text-gray-800">Copy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="py-2 px-3 flex-row items-center"
                onPress={handleForward}
              >
                <Ionicons name="arrow-redo-outline" size={16} color="#4b5563" />
                <Text className="ml-2 text-gray-800">Forward</Text>
              </TouchableOpacity>

              {message.message_type !== "system" && (
                <TouchableOpacity
                  className="py-2 px-3 flex-row items-center"
                  onPress={handlePinUnpin}
                >
                  <Ionicons name="bookmark-outline" size={16} color="#4b5563" />
                  <Text className="ml-2 text-gray-800">
                    {message.pinned ? "Unpin" : "Pin"}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
};

export default MessageBubble;
