import { useCommentsStore } from "@/backend/store/PublicNoteCommentStore";
import { useUserStore } from "@/backend/store/useUserStore";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { formatDistanceToNow } from "date-fns";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../constants/Colors";

const CommentSheet = React.forwardRef(({ sharedNoteId }, ref) => {
  CommentSheet.displayName = "CommentSheet";
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const snapPoints = useMemo(() => ["10%", "40%", "80%"], []);
  const [activeTab, setActiveTab] = useState("view");
  const [newComment, setNewComment] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get current user
  const currentUser = useUserStore((state) => state.profile);
  const fetchUser = useUserStore((state) => state.hydrateProfile);

  useEffect(() => {
    fetchUser(); // Fetch user once when component mounts
  }, [fetchUser]);

  // Get comments data from the store
  const {
    comments,
    isLoading,
    error,
    fetchComments,
    addComment,
    deleteComment,
    subscribeToComments,
    setCurrentNoteId,
  } = useCommentsStore();

  // Load comments function
  const loadComments = useCallback(async () => {
    if (sharedNoteId) {
      await fetchComments(sharedNoteId);
    }
  }, [sharedNoteId, fetchComments]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadComments();
    setIsRefreshing(false);
  };

  // Handle adding a new comment
  const handleAddComment = async () => {
    if (newComment.trim()) {
      await addComment(sharedNoteId, newComment, currentUser);
      setNewComment("");
      setActiveTab("view");
    }
  };

  // Handle comment deletion
  const handleDeleteComment = (commentId) => {
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteComment(commentId, sharedNoteId),
        },
      ]
    );
  };

  // Load comments when the sheet is opened for the first time
  useEffect(() => {
    if (sharedNoteId) {
      loadComments();
      setCurrentNoteId(sharedNoteId);

      // Subscribe to realtime updates
      const unsubscribe = subscribeToComments(sharedNoteId);
      return () => {
        unsubscribe();
        setCurrentNoteId(null);
      };
    }
  }, [sharedNoteId , loadComments, subscribeToComments, setCurrentNoteId]);

  const renderTabButton = (label, key, iconName) => (
    <TouchableOpacity
      onPress={() => setActiveTab(key)}
      className={`flex-1 py-4 border-b-2 items-center justify-center flex-row gap-2 ${
        isDark ? "bg-dark" : "bg-white"
      }`}
      style={{
        borderBottomColor: activeTab === key ? colors.primary : "transparent",
      }}
    >
      <Ionicons
        name={iconName}
        size={20}
        color={
          activeTab === key
            ? colors.primary
            : isDark
            ? colors.offwhite
            : colors.dark
        }
      />
      <Text
        className={`font-semibold text-base ${
          activeTab === key
            ? "text-primary-100"
            : isDark
            ? "text-offwhite"
            : "text-dark"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderCommentItem = ({ item }) => {
    const formattedDate = item.created_at
      ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true })
      : "";
    const isOwnComment = item.isOwnComment;
    const displayName =
      item.profile?.full_name || item.profile?.username || "Anonymous User";
    const avatarLetter = (displayName[0] || "A").toUpperCase();

    return (
      <View
        className={`p-4 rounded-xl mb-3 ${
          isDark ? "bg-primaryDark" : "bg-light"
        }`}
      >
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-row items-center gap-2">
            {/* Avatar circle with first letter */}
            <View
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white font-bold">{avatarLetter}</Text>
            </View>

            <View>
              <Text className="font-bold" style={{ color: colors.primary }}>
                {displayName}
                {isOwnComment && (
                  <Text
                    className="text-xs ml-1 font-normal italic"
                    style={{ color: colors.primaryLight }}
                  >
                    {" "}
                    (You)
                  </Text>
                )}
              </Text>
              <Text
                className={`text-xs ${
                  isDark ? "text-offwhite opacity-60" : "text-dark opacity-60"
                }`}
              >
                {formattedDate}
              </Text>
            </View>
          </View>

          {isOwnComment && (
            <TouchableOpacity
              onPress={() => handleDeleteComment(item.id)}
              className="p-2"
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>

        <Text
          className={`text-sm mt-1 ${isDark ? "text-offwhite" : "text-dark"}`}
        >
          {item.content}
        </Text>
      </View>
    );
  };

  // Empty state component
  const EmptyState = () => (
    <View className="flex-1 justify-center items-center gap-3">
      <Ionicons
        name="chatbubble-ellipses-outline"
        size={40}
        color={isDark ? colors.offwhite : colors.dark}
      />
      <Text
        className={`text-center px-5 ${isDark ? "text-offwhite" : "text-dark"}`}
      >
        No comments yet. Be the first to comment!
      </Text>
    </View>
  );

  // Loading state component
  const LoadingState = () => (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" color={colors.primary} />
      <Text className={`mt-2 ${isDark ? "text-offwhite" : "text-dark"}`}>
        Loading comments...
      </Text>
    </View>
  );

  // Error state component
  const ErrorState = () => (
    <View className="flex-1 justify-center items-center gap-3">
      <Ionicons name="alert-circle-outline" size={40} color={colors.warning} />
      <Text
        className={`text-center px-5 ${isDark ? "text-offwhite" : "text-dark"}`}
      >
        Something went wrong. Please try again.
      </Text>
      <TouchableOpacity
        onPress={loadComments}
        className="mt-2 py-2 px-4 rounded-lg"
        style={{ backgroundColor: colors.primary }}
      >
        <Text className="text-white font-medium">Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: isDark ? colors.dark : colors.white }}
      handleIndicatorStyle={{
        backgroundColor: isDark ? colors.offwhite : colors.dark,
      }}
    >
      <BottomSheetView className="flex-1">
        <View
          className={`flex-row border-b border-gray-200 ${
            isDark ? "bg-dark" : "bg-white"
          }`}
        >
          {renderTabButton("Comments", "view", "chatbubble-outline")}
          {renderTabButton("Add Comment", "add", "add-circle-outline")}
        </View>

        <View className="flex-1 px-4 pt-3">
          {activeTab === "view" ? (
            isLoading && !comments.length ? (
              <LoadingState />
            ) : error ? (
              <ErrorState />
            ) : comments.length === 0 ? (
              <EmptyState />
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderCommentItem}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
              />
            )
          ) : (
            <View className="flex-1 gap-6 py-4">
              <TextInput
                placeholder="Write your comment here..."
                placeholderTextColor={
                  isDark ? `${colors.offwhite}80` : `${colors.dark}80`
                }
                value={newComment}
                onChangeText={setNewComment}
                className={`border border-gray-300 rounded-xl p-4 text-sm h-40 ${
                  isDark ? "bg-primaryDark text-offwhite" : "bg-light text-dark"
                }`}
                multiline
                textAlignVertical="top"
                maxLength={500}
              />

              <View className="flex-row justify-between items-center">
                <Text
                  className={`text-xs ${
                    isDark ? "text-offwhite opacity-60" : "text-dark opacity-60"
                  }`}
                >
                  {newComment.length}/500 characters
                </Text>

                <TouchableOpacity
                  className={`flex-row items-center justify-center py-3 px-6 rounded-xl gap-2 ${
                    newComment.trim() ? "bg-primary" : "bg-primary opacity-60"
                  }`}
                  onPress={handleAddComment}
                  disabled={!newComment.trim() || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Text className="text-white font-bold">Post Comment</Text>
                      <Ionicons name="send" size={18} color={colors.white} />
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View className="mt-4">
                <Text
                  className={`text-xs mb-2 ${
                    isDark ? "text-offwhite opacity-70" : "text-dark opacity-70"
                  }`}
                >
                  Commenting as:
                </Text>
                <View
                  className="flex-row items-center gap-2 p-3 rounded-lg bg-opacity-10"
                  style={{
                    backgroundColor: isDark ? colors.primaryDark : colors.light,
                  }}
                >
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Text className="text-white font-bold">
                      {currentUser?.full_name?.[0] ||
                        currentUser?.username?.[0] ||
                        "A"}
                    </Text>
                  </View>
                  <Text
                    className={`font-medium ${
                      isDark ? "text-offwhite" : "text-dark"
                    }`}
                  >
                    {currentUser?.full_name ||
                      currentUser?.username ||
                      "Anonymous User"}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
});

export default CommentSheet;
