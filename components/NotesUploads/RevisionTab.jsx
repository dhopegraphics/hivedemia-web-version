import { useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { colors } from "@/constants/Colors";
import { useNotesStore } from "@/backend/store/notesStore";

const RevisionTab = ({
  revisionQuestions,
  newQuestion,
  setNewQuestion,
  isDark,
}) => {
  const questionInputRef = useRef();
  const { addRevisionQuestion } = useNotesStore();

  const handleAddQuestion = () => {
    if (newQuestion) {
      addRevisionQuestion(newQuestion);
      setNewQuestion(""); // Clear input after adding
    }
  };

  return (
    <View className="flex-1">
      <View className="flex-row mb-3">
        <TextInput
          ref={questionInputRef}
          value={newQuestion}
          onChangeText={setNewQuestion}
          placeholder="Add revision question or topic"
          placeholderTextColor={isDark ? "#FFE4D080" : "#04222280"}
          className={`flex-1 p-3 rounded-l-lg ${
            isDark ? "bg-primaryDark dark:text-offwhite" : "bg-white text-dark"
          }`}
          onSubmitEditing={handleAddQuestion}
        />
        <TouchableOpacity
          className={`px-4 rounded-r-lg items-center justify-center ${
            newQuestion ? "bg-primary-100" : "bg-offwhite"
          }`}
          onPress={handleAddQuestion}
          disabled={!newQuestion}
        >
          <Ionicons name="add" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={revisionQuestions}
        scrollEnabled={false}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            className={`p-3 mb-2 rounded-lg flex-row items-start ${
              isDark ? "bg-primaryDark" : "bg-white"
            }`}
          >
            <View
              className={`w-6 h-6 rounded-full items-center justify-center mr-2 ${
                isDark ? "bg-dark" : "bg-primaryLight"
              }`}
            >
              <FontAwesome
                name="question"
                size={12}
                color={isDark ? colors.primary : colors.primaryDark}
              />
            </View>
            <Text
              className={`flex-1 ${isDark ? "text-offwhite" : "text-dark"}`}
            >
              {item.text}
            </Text>
            <View className="flex-row ml-2">
              <TouchableOpacity className="p-1">
                <Ionicons
                  name="checkmark-done"
                  size={16}
                  color={colors.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                className="p-1 ml-1"
                onPress={() =>
                  useNotesStore.getState().deleteRevisionQuestion(item.id)
                }
              >
                <Ionicons
                  name="trash-outline"
                  size={16}
                  color={isDark ? colors.offwhite : colors.dark}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

export default RevisionTab;
