import { useUserStore } from "@/backend/store/useUserStore";
import { supabase } from "@/backend/supabase";
import {
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { decode as base64Decode } from "base64-arraybuffer";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const ChatInput = ({
  onSend,
  replyTo,
  onCancelReply,
  chatId,
  replyTarget,
  isDark,
  colors,
  message,
}) => {
  const [inputText, setInputText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingInstance, setRecordingInstance] = useState(null);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);
  const scrollViewRef = useRef(null);
  const { profile: user } = useUserStore();

  const upsertTypingStatus = async (chatId, chatType, isTyping) => {
    if (!user?.user_id) return;
    const { data, error } = await supabase
      .from("typing_indicators")
      .upsert(
        {
          user_id: user.user_id,
          chat_id: chatId,
          chat_type: chatType,
          is_typing: isTyping,
          updated_at: new Date(),
        },
        {
          onConflict: "user_id,chat_id",
        }
      )
      .select(); // 👈 this ensures you get the affected row(s)

    if (error) {
      console.error("Failed to upsert typing indicator:", error);
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      upsertTypingStatus(chatId, "group", true);
    }

    if (typingTimeout) clearTimeout(typingTimeout);

    const timeout = setTimeout(() => {
      setIsTyping(false);
      upsertTypingStatus(chatId, "group", false);
    }, 2000);

    setTypingTimeout(timeout);
  };

  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [typingTimeout]);

  // Toggle attachment options
  const toggleAttachmentOptions = () => {
    setShowAttachmentOptions(!showAttachmentOptions);

    Animated.timing(animatedHeight, {
      toValue: showAttachmentOptions ? 0 : 120,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Handle sending a message
  const handleSendPress = async () => {
    if (isUploading) return;

    if (selectedMedia) {
      await handleSendMediaMessage();
      return;
    }

    if (!inputText.trim()) return;

    onSend(inputText, replyTo?.id);
    setInputText("");

    if (replyTo) {
      onCancelReply();
    }

    // Clear any typing indicators
    setIsTyping(false);
    if (typingTimeout) clearTimeout(typingTimeout);
  };

  // Handle image picking
  const handleImagePick = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("You need to allow access to your photos to share images");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
     mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedMedia({
        uri: result.assets[0].uri,
        type: result.assets[0].type === "video" ? "video" : "image",
        name: result.assets[0].uri.split("/").pop(),
      });
      setShowAttachmentOptions(false);
      animatedHeight.setValue(0);
    }
  };

  // Replace your current handleDocumentPick function with this improved version
  const handleDocumentPick = async () => {
    try {
      console.log("Opening document picker...");

      // Use the newer API format for document picker
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*", // Allow all file types
        copyToCacheDirectory: true, // Important: Copy file to app cache for reliable access
      });

      // Check if document was selected successfully
      if (
        result.canceled === false &&
        result.assets &&
        result.assets.length > 0
      ) {
        const selectedAsset = result.assets[0];

        // Validate that we have the necessary file information
        if (!selectedAsset.uri) {
          console.error("Missing file URI in selected document");
          alert("There was a problem accessing this file. Please try again.");
          return;
        }
        // Set the selected media with all available information
        setSelectedMedia({
          uri: selectedAsset.uri,
          type: "file",
          name: selectedAsset.name || `document_${Date.now()}`,
          size: selectedAsset.size || 0,
          mimeType: selectedAsset.mimeType,
        });

        // Close attachment options
        setShowAttachmentOptions(false);
        animatedHeight.setValue(0);

        console.log("Document selected successfully");
      } else {
        console.log("Document selection cancelled or failed");
      }
    } catch (error) {
      console.error("Error picking document:", error);
      alert("Failed to select document. Please try again.");
    }
  };

  // Handle audio recording
  const startRecording = async () => {
   
  };

  // Stop recording
  const stopRecording = async () => {
    if (!recordingInstance) return;

    try {
      clearInterval(recordingInstance._durationInterval);
      await recordingInstance.stopAndUnloadAsync();

      const uri = recordingInstance.getURI();

      setSelectedMedia({
        uri,
        type: "audio",
        name: `audio_${Date.now()}.m4a`,
      });
    } catch (error) {
      console.error("Failed to stop recording", error);
    }

    setIsRecording(false);
    setRecordingDuration(0);
    setRecordingInstance(null);
  };

  const decode = (base64String) => {
    // Remove data URI prefix if present
    const cleaned = base64String.replace(/^data:.*;base64,/, "");
    return base64Decode(cleaned);
  };

  // Upload file to storage
  // Enhanced file upload function for GrpSmartHiveAiChatInput.jsx

  // Replace your current uploadFileToStorage function with this improved version
  const uploadFileToStorage = async (uri, filePath) => {
    try {
      console.log(`Starting upload for file: ${uri} to path: ${filePath}`);
      setIsUploading(true);
      setUploadProgress(0);

      // Check if the file exists and is accessible
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        console.error("File does not exist at path:", uri);
        throw new Error("Could not access the selected file");
      }

      console.log("File exists, size:", fileInfo.size);

      // For smaller files, we can use base64 encoding
      if (fileInfo.size < 20 * 1024 * 1024) {
        // Less than 20MB
        console.log("Using base64 encoding for upload");
        const fileData = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const { error } = await supabase.storage
          .from("chat-media")
          .upload(filePath, decode(fileData), {
            contentType: getContentType(uri),
            upsert: true,
            progressCallback: (progress) => {
              console.log(`Upload progress: ${progress.percent || 0}%`);
              setUploadProgress(progress.percent || 0);
            },
          });

        if (error) {
          console.error("Supabase upload error:", error);
          throw error;
        }
      }
      // For larger files, we need to use blob/fetch API which works better on iOS and Android
      else {
        console.log("Using fetch API for large file upload");

        // Create form data
        const formData = new FormData();
        formData.append("file", {
          uri: uri,
          name: filePath.split("/").pop(),
          type: getContentType(uri),
        });

        // Get upload URL (you'll need to create a server endpoint for this)
        const uploadUrl = await supabase.storage
          .from("chat-media")
          .createSignedUrl(filePath, 3600);

        // Upload with progress tracking
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            console.log(`Upload progress: ${percentComplete}%`);
            setUploadProgress(percentComplete);
          }
        };

        // Wait for completion
        await new Promise((resolve, reject) => {
          xhr.onload = resolve;
          xhr.onerror = reject;
          xhr.send(formData);
        });
      }

      console.log("Upload successful, getting public URL");
      const { data } = supabase.storage
        .from("chat-media")
        .getPublicUrl(filePath);

      console.log("Public URL:", data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.error("Error in file upload:", error);
      alert("Failed to upload file. Please try again.");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Update the getContentType helper function with more MIME types
  const getContentType = (uri) => {
    const extension = uri.split(".").pop().toLowerCase();

    const mimeTypes = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      mp4: "video/mp4",
      mov: "video/quicktime",
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      txt: "text/plain",
      rtf: "application/rtf",
      zip: "application/zip",
      m4a: "audio/m4a",
      mp3: "audio/mp3",
      wav: "audio/wav",
    };

    return mimeTypes[extension] || "application/octet-stream";
  };

  // Enhanced handleSendMediaMessage function
  const handleSendMediaMessage = async () => {
    if (!selectedMedia) {
      console.warn("No media selected to send");
      return;
    }

    try {
      console.log("Starting media message send process", selectedMedia);

      // Generate a unique filename
      const timestamp = Date.now();
      const userId = user?.user_id || "anonymous";
      const fileExtension =
        selectedMedia.name.split(".").pop().toLowerCase() || "file";
      const filePath = `${userId}/${timestamp}_${Math.random()
        .toString(36)
        .substring(7)}.${fileExtension}`;

      console.log("Generated file path:", filePath);

      // Show notification or loading indicator
      // ...

      // Upload and get URL
      console.log("Uploading media to storage...");
      const fileUrl = await uploadFileToStorage(selectedMedia.uri, filePath);

      if (!fileUrl) {
        console.error("Failed to get fileUrl after upload");
        alert("Failed to upload file. Please try again.");
        return;
      }

      console.log("File uploaded successfully, URL:", fileUrl);

      // Send message with file attachment
      console.log("Sending message with attachment");
      onSend(inputText.trim() ? inputText : null, replyTo?.id, {
        type: selectedMedia.type,
        url: fileUrl,
        name: selectedMedia.name,
      });

      // Reset states
      setInputText("");
      setSelectedMedia(null);

      if (replyTo) {
        onCancelReply();
      }

      console.log("Media message sent successfully");
    } catch (error) {
      console.error("Error in handleSendMediaMessage:", error);
      alert("Failed to send your message. Please try again.");
    }
  };

  // Cancel media upload
  const handleCancelMedia = () => {
    setSelectedMedia(null);
  };
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <View
      style={{ backgroundColor: isDark ? colors.dark : colors.white }}
      className="bg-white border-t dark:border-primary-100xkp[o] border-gray-200"
    >
      {/* Reply preview if applicable */}
      {replyTo && (
        <View className="flex-row items-center p-2 bg-gray-50 border-l-4 border-blue-400">
          <View className="flex-1">
            <Text className="text-xs text-gray-500">
              Reply to {replyTo.sender_name || "message"}
            </Text>
            <Text className="text-sm" numberOfLines={1}>
              {replyTo.content}
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelReply} className="p-2">
            <Ionicons name="close" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      )}

      {/* Selected media preview */}
      {selectedMedia && (
        <View className="p-3 bg-gray-50 border-b border-gray-200">
          <View className="flex-row items-center">
            <View className="flex-1 flex-row items-center">
              {selectedMedia.type === "image" && (
                <Image
                  source={{ uri: selectedMedia.uri }}
                  className="w-12 h-12 rounded-md"
                  resizeMode="cover"
                />
              )}

              {selectedMedia.type === "video" && (
                <View className="w-12 h-12 rounded-md bg-black items-center justify-center">
                  <Ionicons name="play" size={24} color="white" />
                </View>
              )}

              {selectedMedia.type === "audio" && (
                <View className="w-12 h-12 rounded-md bg-blue-100 items-center justify-center">
                  <Ionicons name="mic" size={24} color="#3b82f6" />
                </View>
              )}

              {selectedMedia.type === "file" && (
                <View className="w-12 h-12 rounded-md bg-gray-100 items-center justify-center">
                  <Ionicons name="document" size={24} color="#6b7280" />
                </View>
              )}

              <View className="ml-3 flex-1">
                <Text className="font-medium" numberOfLines={1}>
                  {selectedMedia.name}
                </Text>
                {selectedMedia.size && (
                  <Text className="text-xs text-gray-500">
                    {(selectedMedia.size / 1024).toFixed(1)} KB
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity onPress={handleCancelMedia} className="p-2">
              <Ionicons name="close-circle" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>

          {isUploading && (
            <View className="mt-2">
              <View className="h-1 bg-gray-200 rounded-full w-full">
                <View
                  className="h-1 bg-blue-500 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </View>
              <Text className="text-xs text-gray-500 mt-1 text-right">
                {uploadProgress.toFixed(0)}%
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Attachment options */}
      <Animated.View
        style={{ height: animatedHeight }}
        className="bg-gray-50 overflow-hidden"
      >
        <ScrollView
          horizontal
          ref={scrollViewRef}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 15, paddingHorizontal: 10 }}
        >
          <TouchableOpacity
            onPress={handleImagePick}
            className="items-center mx-3"
          >
            <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mb-1">
              <Ionicons name="image" size={24} color="#3b82f6" />
            </View>
            <Text className="text-xs text-gray-600">Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDocumentPick}
            className="items-center mx-3"
          >
            <View className="w-12 h-12 rounded-full bg-purple-100 items-center justify-center mb-1">
              <Ionicons name="document-text" size={24} color="#8b5cf6" />
            </View>
            <Text className="text-xs text-gray-600">Document</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => {}} className="items-center mx-3">
            <View className="w-12 h-12 rounded-full bg-red-100 items-center justify-center mb-1">
              <Ionicons name="videocam" size={24} color="#ef4444" />
            </View>
            <Text className="text-xs text-gray-600">Video</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>

      {replyTarget && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#f1f5f9",
            padding: 8,
            borderRadius: 8,
            marginBottom: 4,
          }}
        >
          <Text style={{ fontWeight: "bold", marginRight: 8 }}>
            Replying to:
          </Text>
          <Text numberOfLines={1} style={{ flex: 1 }}>
            {replyTarget.content}
          </Text>
          <TouchableOpacity onPress={onCancelReply}>
            <Ionicons name="close" size={18} color="#888" />
          </TouchableOpacity>
        </View>
      )}

      {/* Main input area */}
      <View className="flex-row items-center px-3 py-2">
        <TouchableOpacity
          onPress={toggleAttachmentOptions}
          className="mx-1 p-2"
        >
          <FontAwesome
            name="paperclip"
            size={22}
            color={showAttachmentOptions ? "#3b82f6" : "#6b7280"}
          />
        </TouchableOpacity>

        <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-3 py-1 mx-1">
          <TouchableOpacity
            onPress={() => setEmojiPickerVisible(!emojiPickerVisible)}
            className="mr-2 p-1"
          >
            <MaterialCommunityIcons
              name="emoticon-outline"
              size={22}
              color="#6b7280"
            />
          </TouchableOpacity>

          <TextInput
            ref={inputRef}
            className={`flex-1 py-1 px-1 ${isRecording ? "opacity-50" : ""}`}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={(text) => {
              setInputText(text);
              handleTyping();
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            multiline
            maxHeight={100}
            editable={!isRecording}
          />
        </View>

        <View className="mx-1">
          {inputText.trim() || selectedMedia ? (
            <TouchableOpacity
              onPress={handleSendPress}
              className="bg-blue-500 rounded-full p-2 ml-1"
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="send" size={20} color="white" />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPressIn={startRecording}
              onPressOut={stopRecording}
              className={`rounded-full p-2 ml-1 ${
                isRecording ? "bg-red-500" : "bg-gray-200"
              }`}
            >
              <Ionicons
                name={isRecording ? "stop" : "mic"}
                size={20}
                color={isRecording ? "white" : "#6b7280"}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Recording indicator */}
      {isRecording && (
        <View className="absolute top-40 left-0 right-0 bg-red-500 p-2 flex-row items-center justify-center">
          <View className="w-3 h-3 rounded-full bg-white mr-2 animate-pulse" />
          <Text className="text-white font-medium">
            Recording {formatDuration(recordingDuration)}
          </Text>
        </View>
      )}
    </View>
  );
};

export default ChatInput;
