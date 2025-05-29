import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/Colors";
import { useNotesStore } from "@/backend/store/notesStore";

const QuickActionsTab = ({ isDark }) => {
  // Quick actions
  const quickActions = [
    {
      icon: "camera",
      label: "Scan Document",
      action: async () => {
        const { Camera } = await import("expo-camera");
        const permission = await Camera.requestCameraPermissionsAsync();
        if (permission.status !== "granted") {
          alert("Camera permission is required");
          return;
        }

        const { uri } = await Camera.takePictureAsync(); // (You'll want a full camera screen later)
        const randomName = `Scan_${Date.now()}.jpg`;

        const { currentNoteId, setAttachments, attachments } =
          useNotesStore.getState();

        const newAttachment = {
          uri,
          fileName: randomName,
          mimeType: "image/jpeg",
          size: null, // you can use FileSystem.getInfoAsync(uri) if needed
        };

        setAttachments([...attachments, newAttachment]);

        if (currentNoteId) {
          await useNotesStore
            .getState()
            .saveNoteAttachment(currentNoteId, newAttachment);
        }
      },
    },
    {
      icon: "mic",
      label: "Voice Note",
      action: async () => {
        const { Audio } = await import("expo-audio");
        const { currentNoteId, saveVoiceNote } = useNotesStore.getState();

        const permission = await Audio.requestPermissionsAsync();
        if (permission.status !== "granted") {
          alert("Microphone permission is required");
          return;
        }

        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync(
          Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
        );
        await recording.startAsync();

        alert("Recording... tap again to stop.");

        setTimeout(async () => {
          await recording.stopAndUnloadAsync();
          const uri = recording.getURI();
          const duration =
            (await recording.getStatusAsync()).durationMillis / 1000;

          if (currentNoteId && uri) {
            await saveVoiceNote(currentNoteId, uri, duration);
            alert("Voice note saved");
          }
        }, 5000); // 5 seconds demo (replace with actual UI toggle)
      },
    },
    {
      icon: "bookmark",
      label: "Upload Note By Link",
      action: async () => {
        const { currentNoteId, saveToBook } = useNotesStore.getState();
        if (currentNoteId) {
          await saveToBook(currentNoteId);
        } else {
          alert("Please save the note first before adding a link");
        }
      },
    },
    {
      icon: "share-social",
      label: "Share Notes",
      action: async () => {
        try {
          await useNotesStore.getState().shareCurrentNote();
        } catch (err) {
          console.error("Error sharing:", err);
        }
      },
    },
  ];

  return (
    <View className="flex-1">
      <Text
        style={{
          color: isDark ? colors.offwhite : colors.primaryDark,
        }}
        className={`text-sm mb-4 ${isDark ? "text-offwhite" : "text-dark"}`}
      >
        Quickly capture ideas or organize your notes
      </Text>
      <View className="flex-row flex-wrap justify-between">
        {quickActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            onPress={action.action}
            className={`w-[48%] p-4 mb-4 rounded-xl items-center ${
              isDark ? "bg-primaryDark" : "bg-white"
            }`}
          >
            <View
              className={`w-12 h-12 rounded-full items-center justify-center mb-2 ${
                isDark ? "bg-dark" : "bg-primaryLight"
              }`}
            >
              <Ionicons name={action.icon} size={24} color={colors.primary} />
            </View>
            <Text
              style={{
                color: isDark ? colors.offwhite : colors.primaryDark,
              }}
              className={`text-center ${
                isDark ? "text-offwhite" : "text-dark"
              }`}
            >
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default QuickActionsTab;
