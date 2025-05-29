import { View, TextInput, TouchableOpacity, Text } from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { colors } from "@/constants/Colors";
import { useNotesStore } from "@/backend/store/notesStore";
import AttachmentsList from "@/components/NotesUploads/AttachmentsList";

const NoteEditor = ({
  noteContent,
  setNoteContent,
  attachments,
  isDark,
  currentNoteId,
}) => {
  const insertMarkdown = (symbol) => {
    const current = noteContent;
    setNoteContent(`${current}${symbol}${symbol}`);
  };

  const { attachFile } = useNotesStore();

  return (
    <View style={{ height: 400 }}>
      <TextInput
        value={noteContent}
        onChangeText={setNoteContent}
        placeholder="Start typing your notes here..."
        placeholderTextColor={isDark ? "#FFE4D080" : "#04222280"}
        editable
        multiline
        className={`flex-1 p-3 rounded-lg text-base ${
          isDark
            ? "dark:bg-primaryDark dark:text-offwhite text-offwhite"
            : "bg-white text-dark"
        }`}
        style={{
          textAlignVertical: "top",
          color: isDark ? colors.primary : colors.dark,
        }}
      />
      <View className="flex-row justify-between mt-3">
        <TouchableOpacity
          onPress={attachFile}
          className="p-2 flex-row items-center"
        >
          <Feather name="paperclip" size={18} color={colors.primary} />
          <Text className="ml-1 dark:text-primary-100">Attach</Text>
        </TouchableOpacity>
        <View className="flex-row">
          <TouchableOpacity
            className="p-2 mx-1"
            onPress={() => insertMarkdown("**")}
          >
            <MaterialIcons
              name="format-bold"
              size={18}
              color={isDark ? colors.offwhite : colors.dark}
            />
          </TouchableOpacity>
          <TouchableOpacity
            className="p-2 mx-1"
            onPress={() => insertMarkdown("_")}
          >
            <MaterialIcons
              name="format-italic"
              size={18}
              color={isDark ? colors.offwhite : colors.dark}
            />
          </TouchableOpacity>
        </View>
      </View>
      {attachments.length > 0 && (
        <AttachmentsList
          attachments={attachments}
          isDark={isDark}
          currentNoteId={currentNoteId}
        />
      )}
    </View>
  );
};

export default NoteEditor;
