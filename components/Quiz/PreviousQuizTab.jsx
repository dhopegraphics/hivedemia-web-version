import { View, Text, TouchableOpacity, FlatList, Alert } from "react-native";
import { useColorScheme } from "nativewind";
import { colors } from "@/constants/Colors";
import { Feather } from "@expo/vector-icons";

const PreviousQuizTab = ({ quizzes, onSelectQuiz, onDeleteQuiz }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleDelete = (quizId) => {
    Alert.alert("Delete Quiz", "Are you sure you want to delete this quiz?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", onPress: () => onDeleteQuiz(quizId) },
    ]);
  };

  return (
    <View className="flex-1 px-6 py-6">
      {quizzes.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text style={{ color: isDark ? colors.offwhite : colors.dark }}>
            No quizzes found. Generate one to get started!
          </Text>
        </View>
      ) : (
        <FlatList
          data={quizzes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              className="mb-4 p-4 rounded-lg"
              style={{
                backgroundColor: isDark ? colors.darkLight : colors.grayLight,
              }}
            >
              <TouchableOpacity onPress={() => onSelectQuiz(item.id)}>
                <View className="flex-row justify-between items-center">
                  <Text
                    className="text-lg font-bold flex-1"
                    style={{ color: isDark ? colors.offwhite : colors.dark }}
                    numberOfLines={1}
                  >
                    {item.prompt.substring(0, 50)}
                    {item.prompt.length > 50 ? "..." : ""}
                  </Text>
                  <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Feather
                      name="trash-2"
                      size={20}
                      color={isDark ? colors.offwhite : colors.dark}
                    />
                  </TouchableOpacity>
                </View>
                <Text
                  className="mt-2"
                  style={{ color: isDark ? colors.offwhite : colors.dark }}
                >
                  {new Date(item.createdAt).toLocaleDateString()} •{" "}
                  {item.questionCount} questions
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default PreviousQuizTab;
