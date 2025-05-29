import { useUserStore } from "@/backend/store/useUserStore";
import { PublicFileOperations } from "@/utils/PublicFileOperations";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const PublicNotesTab = ({ isDark, colors, refreshFiles, loading, files }) => {
  const [refreshing, setRefreshing] = useState(false);
  const { profile , getUserProfile } = useUserStore();
  const user_id = profile?.user_id;
  const { handleFileDelete } = PublicFileOperations({ setFiles: () => {} });
    const [usernames, setUsernames] = useState({});

  // Helper to get username by userId
  const fetchUsername = async (userId) => {
    if (!userId) return "Unknown";
    if (usernames[userId]) return usernames[userId];
    try {
      const userProfile = await getUserProfile(userId);
      const username = userProfile?.username || userProfile?.full_name  || "Unknown";
      setUsernames((prev) => ({ ...prev, [userId]: username }));
      return username;
    }
    catch (error) {
      console.error("Error fetching username:", error);
      return "Unknown";
    }
    
  };
 
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshFiles();
    setRefreshing(false);
  };

const handleDelete = async (file) => {
  console.log("Attempting to delete file:", file.file_path);
  const isUploader = file?.uploaded_by === user_id;

  if (!isUploader) {
    Alert.alert(
      "Permission Denied",
      "You can only delete files you have uploaded."
    );
    return;
  }

  Alert.alert(
    "Delete Note",
    "Are you sure you want to delete this note? This action cannot be undone.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await handleFileDelete(file.id, file.file_path); // Use file.file_path
            Alert.alert("Success", "File deleted successfully.");
            await refreshFiles();
          } catch (err) {
            console.error("Error deleting file:", err);
            Alert.alert("Error", "Failed to delete the file. Please try again.");
          }
        },
      },
    ]
  );
};


  if (loading && files.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text style={{ color: isDark ? colors.white : colors.dark }}>
          Loading notes...
        </Text>
      </View>
    );
  }

  if (files.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        
        <Text style={{ color: isDark ? colors.white : colors.dark }}>
          No public notes found
        </Text>
          <View className=" justify-center items-center mb-4">
        <Text
          className="text-lg font-bold"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          Crowdsourced Notes
        </Text>
        <TouchableOpacity
          className="px-3 py-1 rounded-full flex-row items-center"
          style={{ backgroundColor: colors.primary }}
          onPress={() => router.push("/Hubs/Notes/NoteUpload")}
        >
          <Ionicons name="add" size={16} color={colors.white} />
          <Text className="ml-1 font-medium" style={{ color: colors.white }}>
            Contribute
          </Text>
        </TouchableOpacity>
      </View>
      </View>
    );
  }

  const HandleFilePass = (item) => {
 
    router.push({
      pathname: `/FileDecisionRouter/${item.id}`,
      params: {
        fileTitle: ` ${item?.title}`,
        fileType: item.file_type,
        fileIsPrivate: item.file_is_private,
        fileUrl: item.url,
        isCommentable: item.allow_comments,
        isAnonymous: item.is_anonymous,
        realAuthor: item.uploaded_by,
        isRealAuthor: item.is_real_author,
      },
    });
  };

    // RenderItem with username state
  const RenderNoteItem = ({ item }) => {
    const [username, setUsername] = useState("Unknown");

    useEffect(() => {
      let mounted = true;
      if (!item.is_anonymous && item.uploaded_by) {
        fetchUsername(item.uploaded_by).then((name) => {
          if (mounted) setUsername(name);
        });
      }
      return () => { mounted = false; };
    }, [item.uploaded_by, item.is_anonymous]);

    const isUploader = item?.uploaded_by === profile?.user_id;
    return (
      <TouchableOpacity
        className="rounded-xl p-4 mb-4"
        style={{
          backgroundColor: isDark
            ? `${colors.primaryDark}80`
            : colors.white,
        }}
        onPress={() => HandleFilePass(item)}
      >
        <Text
          className="font-bold mb-1"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          {item.title}
        </Text>
        <Text
          className="mb-2"
          style={{
            color: isDark ? `${colors.offwhite}80` : `${colors.dark}80`,
          }}
        >
          {item.subject} • {item.page_count || "N/A"} pages
        </Text>
        {isUploader && (
          <TouchableOpacity
            className="absolute top-2 right-5"
            onPress={() => handleDelete(item)}
          >
            <Feather
              name="trash-2"
              size={20}
              color={isDark ? colors.primary : colors.dark}
            />
          </TouchableOpacity>
        )}
        <View className="flex-row justify-between items-center">
          <Text
            style={{
              color: isDark ? `${colors.offwhite}80` : `${colors.dark}80`,
            }}
          >
            By {item.is_anonymous ? "Anonymous" : username}
          </Text>
          <Feather
            name="chevron-right"
            size={20}
            color={isDark ? colors.offwhite : colors.dark}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <View className="flex-row justify-between items-center mb-4">
        <Text
          className="text-lg font-bold"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          Crowdsourced Notes
        </Text>
        <TouchableOpacity
          className="px-3 py-1 rounded-full flex-row items-center"
          style={{ backgroundColor: colors.primary }}
          onPress={() => router.push("/Hubs/Notes/NoteUpload")}
        >
          <Ionicons name="add" size={16} color={colors.white} />
          <Text className="ml-1 font-medium" style={{ color: colors.white }}>
            Contribute
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recent Notes */}
      <FlatList
        scrollEnabled={false}
        data={files}
        keyExtractor={(item) => item.id.toString()}
         renderItem={({ item }) => <RenderNoteItem item={item} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
};

export default PublicNotesTab;
