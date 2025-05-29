import { useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/Colors";
import { useNotesStore } from "@/backend/store/notesStore";

const ReferencesTab = ({
  references,
  newReference,
  setNewReference,
  isDark,
}) => {
  const referenceInputRef = useRef();
  const { addReference } = useNotesStore();

  const handleAddReference = () => {
    if (newReference) {
      addReference(newReference);
      setNewReference(""); // Clear input after adding
    }
  };

  return (
    <View className="flex-1">
      <View className="flex-row mb-3">
        <TextInput
          ref={referenceInputRef}
          value={newReference}
          onChangeText={setNewReference}
          placeholder="Add reference link or description"
          placeholderTextColor={isDark ? "#FFE4D080" : "#04222280"}
          className={`flex-1 p-3 rounded-l-lg ${
            isDark ? "bg-primaryDark dark:text-offwhite" : "bg-white text-dark"
          }`}
          onSubmitEditing={handleAddReference}
        />
        <TouchableOpacity
          className={`px-4 rounded-r-lg items-center justify-center ${
            newReference ? "bg-primary-100" : "bg-offwhite"
          }`}
          onPress={handleAddReference}
          disabled={!newReference}
        >
          <Ionicons name="add" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <FlatList
        scrollEnabled={false}
        data={references}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            className={`p-3 mb-2 rounded-lg flex-row items-center ${
              isDark ? "bg-primaryDark" : "bg-white"
            }`}
          >
            <Ionicons name="link" size={16} color={colors.primary} />
            <Text
              className={`ml-2 flex-1 ${
                isDark ? "text-offwhite" : "text-dark"
              }`}
              numberOfLines={1}
            >
              {item.text}
            </Text>
            <TouchableOpacity
              onPress={() => useNotesStore.getState().deleteReference(item.id)}
            >
              <Ionicons
                name="trash-outline"
                size={16}
                color={isDark ? colors.offwhite : colors.dark}
              />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

export default ReferencesTab;
