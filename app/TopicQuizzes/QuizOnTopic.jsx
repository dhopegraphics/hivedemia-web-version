import ArrowBackHeaderComponent from "@/components/ArrowBackHeaderComponent";
import { colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function TopicQuizzes() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("recent");

  const [quizzes, setQuizzes] = useState([]);

  // Filter quizzes based on search and sort
  const filteredQuizzes = quizzes
    .filter((quiz) =>
      quiz.topic.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (selectedFilter === "recent") {
        return new Date(b.lastGenerated) - new Date(a.lastGenerated);
      } else if (selectedFilter === "difficulty") {
        const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
        return difficultyOrder[b.difficulty] - difficultyOrder[a.difficulty];
      } else {
        return a.topic.localeCompare(b.topic);
      }
    });

  // Start quiz immediately
  const startQuiz = (quizId) => {
    setLoading(true);
    // Simulate API call to fetch questions
    setTimeout(() => {
      router.push(`/QuizHome/${quizId}`);
      setLoading(false);
    }, 500);
  };

  // Regenerate quiz
  const regenerateQuiz = (quizId) => {
    Alert.alert(
      "Regenerate Quiz",
      "This will create new questions for this topic",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            // API call to regenerate
            setLoading(true);
            setTimeout(() => {
              Alert.alert("Success", "New quiz generated!");
              setLoading(false);
            }, 1500);
          },
        },
      ]
    );
  };

  // Subject color mapping
  const subjectColors = {
    history: "#F59E0B",
    biology: "#10B981",
    physics: "#3B82F6",
    literature: "#8B5CF6",
    math: "#EC4899",
  };

  // Difficulty styling
  const difficultyStyles = {
    easy: { bg: "#ECFDF5", text: "#10B981", label: "Easy" },
    medium: { bg: "#FEF3C7", text: "#D97706", label: "Medium" },
    hard: { bg: "#FEE2E2", text: "#DC2626", label: "Hard" },
  };

  // Empty state
  if (quizzes.length === 0) {
    return (
      <View
        style={{ backgroundColor: isDark ? colors.dark : colors.white }}
        className="flex-1   justify-center p-6 "
      >
        <ArrowBackHeaderComponent isDark={isDark} colors={colors} />
        <View className="flex-1 items-center  justify-center p-6 ">
          <Image
            source={require("@/assets/images/hungryCaveMan.png")}
            className="w-48 h-48 mb-6"
          />
          <Text className="text-xl font-bold text-center dark:text-white mb-2">
            No quizzes yet!
          </Text>
          <Text className="text-gray-500 dark:text-gray text-center mb-6">
            Select your Topic to generate your first AI-powered quiz
          </Text>
          <TouchableOpacity
            className="bg-[#00DF82] px-6 py-3 rounded-full"
            
          >
            <Text className="text-white font-medium">Select Topic </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      style={{ backgroundColor: isDark ? colors.dark : colors.white }}
      className="flex-1  p-4"
    >
      <ArrowBackHeaderComponent isDark={isDark} colors={colors} />
      {/* Header */}
      <View className="mb-6 mt-6">
        <Text className="text-2xl font-bold dark:text-white">
          Topic Quizzes
        </Text>
        <Text className="text-gray-500 dark:text-gray-400">
          Quizzes generated from your documents
        </Text>
      </View>

      {/* Search and Filter */}
      <View className="mb-4">
        <View className="mb-2">
          <TextInput
            className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg mb-3 dark:text-white"
            placeholder="Search topics..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={isDark ? colors.offwhite : colors.gray}
          />
        </View>

        <View className="flex-row gap-2 space-x-2">
          {["recent", "difficulty", "name"].map((filter) => (
            <TouchableOpacity
              key={filter}
              className={`px-4 py-2 rounded-full ${
                selectedFilter === filter
                  ? "bg-[#00DF82]"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                className={
                  selectedFilter === filter ? "text-white" : "dark:text-white"
                }
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quiz List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#00DF82" />
          <Text className="mt-2 dark:text-white">Preparing your quiz...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredQuizzes}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          contentContainerStyle={{ paddingBottom: 20 }}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="w-[48%] mb-4 rounded-xl overflow-hidden"
              onPress={() => startQuiz(item.id)}
              onLongPress={() => regenerateQuiz(item.id)}
            >
              <View
                className="p-4 h-[165px] max-h-[180px]"
                style={{
                  backgroundColor: isDark ? "#1F2937" : "#F9FAFB",
                  borderLeftWidth: 4,
                  borderLeftColor: subjectColors[item.subject] || "#00DF82",
                }}
              >
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="text-base font-bold dark:text-white flex-1 mr-2">
                    {item.topic}
                  </Text>
                  <Text className="text-2xl">{item.icon}</Text>
                </View>

                <View className="flex-row items-center mb-1">
                  <Ionicons
                    name="help-circle-outline"
                    size={16}
                    color={isDark ? "#9CA3AF" : "#6B7280"}
                  />
                  <Text className="ml-1 text-sm dark:text-gray-300">
                    {item.questionCount} Qs
                  </Text>
                </View>

                <View className="flex-row items-center mb-2">
                  <View
                    className="px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: difficultyStyles[item.difficulty].bg,
                    }}
                  >
                    <Text
                      className="text-xs"
                      style={{ color: difficultyStyles[item.difficulty].text }}
                    >
                      {difficultyStyles[item.difficulty].label}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(item.lastGenerated)}
                  </Text>
                  <View className="flex-row items-center">
                    <Text className="text-xs mr-1 dark:text-gray-400">
                      🤖 AI
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

// Helper function to format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
