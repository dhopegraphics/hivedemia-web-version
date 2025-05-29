import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/constants/Colors";
import { useNotesStore } from "@/backend/store/notesStore";

const SavedNotesList = ({
  savedNotes,
  isDark,
  setNoteContent,
  setReferences,
  setRevisionQuestions,
  setAttachments,
  setSavedNotes,
  fileId,
  courseId,
  setCurrentNoteId,
}) => {
  const loadNote = (note) => {
    setNoteContent(note.content || "");
    setReferences(note.referenceList || []);
    setRevisionQuestions(note.revisionQuestions || []);
    setAttachments(note.attachments || []);
    setCurrentNoteId(note.id);
  };

  const deleteNote = async (noteId) => {
    await useNotesStore.getState().deleteNote(noteId);
    const updatedNotes = await useNotesStore
      .getState()
      .loadNotes(fileId, courseId);
    setSavedNotes(updatedNotes);
  };

  if (savedNotes.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className={isDark ? "text-offwhite" : "text-dark"}>
          No saved notes yet.
        </Text>
        <Text className={isDark ? "text-offwhite" : "text-dark"}>
          Create a new note to get started.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={savedNotes}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View
          className={`p-4 mb-3 rounded-lg ${
            isDark ? "bg-primaryDark" : "bg-white"
          }`}
        >
          <View className="flex-row justify-between items-center">
            <Text
              className={`font-medium ${
                isDark ? "text-offwhite" : "text-dark"
              }`}
            >
              {new Date(item.created_at).toLocaleString()}
            </Text>
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => loadNote(item)}
                className="p-2 mr-2"
              >
                <Feather
                  name="edit-2"
                  size={16}
                  color={isDark ? colors.offwhite : colors.dark}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => deleteNote(item.id)}
                className="p-2"
              >
                <Feather
                  name="trash-2"
                  size={16}
                  color={isDark ? colors.offwhite : colors.dark}
                />
              </TouchableOpacity>
            </View>
          </View>
          <Text
            numberOfLines={2}
            className={`${isDark ? "text-offwhite" : "text-dark"} opacity-80`}
          >
            {item.content?.substring(0, 120)}
            {item.content?.length > 120 ? "..." : ""}
          </Text>
          <View className="flex-row justify-between">
            {item.referenceList && item.referenceList.length > 0 && (
              <Text
                className={`mt-1 text-xs ${
                  isDark ? "text-offwhite" : "text-primaryDark"
                } opacity-70`}
              >
                {item.referenceList.length} reference(s)
              </Text>
            )}
            {item.revisionQuestions && item.revisionQuestions.length > 0 && (
              <Text
                className={`mt-1 text-xs ${
                  isDark ? "text-offwhite" : "text-primaryDark"
                } opacity-70`}
              >
                {item.revisionQuestions.length} Revision(s) To do
              </Text>
            )}

            {item.attachments && item.attachments.length > 0 && (
              <Text
                className={`mt-1 text-xs ${
                  isDark ? "text-offwhite" : "text-primaryDark"
                } opacity-70`}
              >
                {item.attachments.length} Attachment(s)
              </Text>
            )}
          </View>
        </View>
      )}
    />
  );
};

export default SavedNotesList;
