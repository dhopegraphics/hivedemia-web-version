import { useExamStore } from "@/backend/store/useExamStore";
import { useUserStore } from "@/backend/store/useUserStore";
import { colors } from "@/constants/Colors";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";

const ExamsList = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { profile: user } = useUserStore();
  const examStore = useExamStore();

  // Load exams on mount
  useEffect(() => {
    if (user?.user_id) {
      examStore.getExamsByUser(user.user_id);
    }
  }, [user?.user_id , examStore]);

  const handleDelete = (examId) => {
    Alert.alert("Delete Exam", "Are you sure you want to delete this exam?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", onPress: () => examStore.deleteExam(examId) },
    ]);
  };

  return (
    <View
      className="flex-1 pt-20 px-6 py-6"
      style={{ backgroundColor: isDark ? colors.dark : colors.light }}
    >
      <View className="flex-row ">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text
          className={`text-xl ml-16 font-bold mb-6 ${
            isDark ? "text-white" : "text-black"
          }`}
        >
          Generated Questions
        </Text>
      </View>

      {examStore.exams.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text style={{ color: isDark ? colors.offwhite : colors.dark }}>
            No exams found. Create one to get started!
          </Text>
        </View>
      ) : (
        <FlatList
          data={examStore.exams}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              className="mb-4 p-4 rounded-lg"
              style={{
                backgroundColor: isDark ? colors.darkLight : colors.grayLight,
              }}
            >
              <TouchableOpacity
                onPress={() => router.push(`/Hubs/Exams/${item.id}`)}
              >
                <View className="flex-row justify-between items-center">
                  <Text
                    className="text-lg font-bold flex-1"
                    style={{ color: isDark ? colors.offwhite : colors.dark }}
                    numberOfLines={1}
                  >
                    {item.title}
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
                  {item.subject} • {item.questionCount} questions •{" "}
                  {item.duration} mins
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default ExamsList;
