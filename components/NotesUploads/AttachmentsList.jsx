import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/Colors";
import { useNotesStore } from "@/backend/store/notesStore";

const AttachmentsList = ({ attachments, isDark, currentNoteId }) => {
  return (
    <View className="mt-3">
      <Text className="text-sm mb-2 dark:text-primary-100 text-dark">
        Attachments
      </Text>

      {attachments.map((file, index) => {
        // Fallback to file name from URI
        const name =
          file.fileName || file.uri?.split("/").pop() || "Untitled file";

        return (
          <View
            key={index}
            className={`p-3 mb-2 flex-row justify-between items-center rounded-lg ${
              isDark ? "bg-primaryDark" : "bg-gray-100"
            }`}
          >
            {/* File preview tap */}
            <TouchableOpacity className="flex-1 mr-2">
              <Text
                numberOfLines={1}
                className={`text-xs ${isDark ? "text-offwhite" : "text-dark"}`}
              >
                {name}
              </Text>
            </TouchableOpacity>

            {/* Delete icon */}
            <TouchableOpacity
              className="p-1 ml-1"
              onPress={() =>
                useNotesStore
                  .getState()
                  .deleteAttachFile(file.uri, currentNoteId)
              }
            >
              <Ionicons
                name="trash-outline"
                size={16}
                color={isDark ? colors.offwhite : colors.dark}
              />
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
};

export default AttachmentsList;
