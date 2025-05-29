import { useExamStore } from "@/backend/store/useExamStore";
import { useUserStore } from "@/backend/store/useUserStore";
import QuizCreationLoader from "@/components/Quiz/QuizCreationLoader";
import { colors } from "@/constants/Colors";
import { useToast } from "@/context/ToastContext";
import {
  AntDesign,
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const CreateExam = () => {
  const { profile: user } = useUserStore();
  const examStore = useExamStore();
  // State variables
  const [examTitle, setExamTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState("60");
  const [questionCount, setQuestionCount] = useState("20");
  const [difficulty, setDifficulty] = useState("medium");
  const [includeTimer, setIncludeTimer] = useState(true);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [timePerQuestion, setTimePerQuestion] = useState("60");
  const [showLoader, setShowLoader] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    examStore.initializeDatabase();
  }, [examStore]);

  // Mock data
  const availableTopics = [
    { id: 1, name: "Derivatives" },
    { id: 2, name: "Integrals" },
    { id: 3, name: "Limits" },
    { id: 4, name: "Differential Equations" },
    { id: 5, name: "Series & Sequences" },
    { id: 6, name: "Vector Calculus" },
  ];

  // Dummy functions
  const toggleTopic = (id) => {
    const updatedTopics = [...selectedTopics];
    if (updatedTopics.includes(id)) {
      setSelectedTopics(updatedTopics.filter((topicId) => topicId !== id));
    } else {
      setSelectedTopics([...updatedTopics, id]);
    }
  };

  const handleCreateExam = async () => {
    // Validation
    if (!examTitle.trim()) {
      Alert.alert("Error", "Please enter an exam title");
      return;
    }
    if (!subject.trim()) {
      Alert.alert("Error", "Please enter a subject");
      return;
    }
    if (selectedTopics.length === 0) {
      Alert.alert("Error", "Please select at least one topic");
      return;
    }

    try {
      showToast(`Exams Creation Has Begin`, "info", 400);

      setShowLoader(true);
      // Get selected topic names
      const selectedTopicNames = availableTopics
        .filter((topic) => selectedTopics.includes(topic.id))
        .map((topic) => topic.name);

      // Generate questions first
      const questions = await examStore.generateExamQuestions({
        title: examTitle,
        subject,
        topics: selectedTopicNames,
        questionCount: parseInt(questionCount),
        difficulty,
      });

      // Create exam in database
      const examId = await examStore.createExam(
        {
          userId: user.user_id,
          title: examTitle,
          subject,
          duration: parseInt(duration),
          questionCount: parseInt(questionCount),
          difficulty,
          includeTimer,
          shuffleQuestions,
          timePerQuestion: parseInt(timePerQuestion),
        },
        availableTopics.filter((topic) => selectedTopics.includes(topic.id))
      );

      // Save questions
      await examStore.saveExamQuestions(examId, questions);

      // Navigate to the exam screen
      router.push(`/Hubs/Exams/${examId}`);
    } catch (error) {
      Alert.alert("Error", "Failed to create exam. Please try again.");
      console.error("Exam creation error:", error);
    } finally {
      setShowLoader(false);
      showToast(`Start Your ${examTitle} `, "success", 400);
    }
  };

  return (
    <>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        style={{ backgroundColor: isDark ? colors.dark : colors.light }}
      >
        {/* Header */}
        <View className="px-4 pt-20 pb-4 flex-row items-center">
          <TouchableOpacity className="p-2" onPress={() => router.back()}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDark ? colors.offwhite : colors.dark}
            />
          </TouchableOpacity>
          <Text
            className="text-xl font-bold ml-2"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            Create Custom Exam
          </Text>
        </View>

        {/* Main Content */}
        <View className="px-5">
          {/* Exam Info Section */}
          <View
            className="bg-white rounded-xl p-5 mb-6 shadow-sm"
            style={{
              backgroundColor: isDark ? `${colors.dark}80` : colors.white,
            }}
          >
            <Text
              className="text-lg font-bold mb-4"
              style={{ color: isDark ? colors.offwhite : colors.dark }}
            >
              Exam Information
            </Text>

            {/* Exam Title */}
            <View className="mb-4">
              <Text
                className="text-sm mb-1 font-medium"
                style={{ color: isDark ? `${colors.offwhite}80` : colors.gray }}
              >
                Exam Title
              </Text>
              <TextInput
                className="p-3 rounded-lg border"
                style={{
                  borderColor: isDark ? `${colors.gray}50` : colors.lightGray,
                  backgroundColor: isDark ? `${colors.dark}90` : colors.white,
                  color: isDark ? colors.offwhite : colors.dark,
                }}
                placeholder="Enter exam title"
                placeholderTextColor={
                  isDark ? `${colors.offwhite}50` : colors.gray
                }
                value={examTitle}
                onChangeText={setExamTitle}
              />
            </View>

            {/* Subject */}
            <View className="mb-4">
              <Text
                className="text-sm mb-1 font-medium"
                style={{ color: isDark ? `${colors.offwhite}80` : colors.gray }}
              >
                Subject
              </Text>
              <TextInput
                className="p-3 rounded-lg border"
                style={{
                  borderColor: isDark ? `${colors.gray}50` : colors.lightGray,
                  backgroundColor: isDark ? `${colors.dark}90` : colors.white,
                  color: isDark ? colors.offwhite : colors.dark,
                }}
                placeholder="Enter subject or course code"
                placeholderTextColor={
                  isDark ? `${colors.offwhite}50` : colors.gray
                }
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            {/* Duration and Questions (Grid) */}
            <View className="flex-row mb-4 justify-between">
              {/* Duration */}
              <View className="w-5/12">
                <Text
                  className="text-sm mb-1 font-medium"
                  style={{
                    color: isDark ? `${colors.offwhite}80` : colors.gray,
                  }}
                >
                  Duration (min)
                </Text>
                <View className="flex-row items-center">
                  <TouchableOpacity
                    className="h-10 w-10 rounded-l-lg justify-center items-center"
                    style={{
                      backgroundColor: isDark
                        ? `${colors.primaryDark}90`
                        : `${colors.primary}20`,
                    }}
                    onPress={() =>
                      setDuration(
                        Math.max(parseInt(duration) - 15, 15).toString()
                      )
                    }
                  >
                    <AntDesign name="minus" size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <View style={{ maxWidth: 50, minWidth: 20 }}>
                    <TextInput
                      className="h-10  text-center flex-1 border-t border-b"
                      style={{
                        borderColor: isDark
                          ? `${colors.gray}50`
                          : colors.lightGray,
                        backgroundColor: isDark
                          ? `${colors.dark}90`
                          : colors.white,
                        color: isDark ? colors.offwhite : colors.dark,
                      }}
                      keyboardType="numeric"
                      value={duration}
                      onChangeText={setDuration}
                    />
                  </View>

                  <TouchableOpacity
                    className="h-10 w-10 rounded-r-lg justify-center items-center"
                    style={{
                      backgroundColor: isDark
                        ? `${colors.primaryDark}90`
                        : `${colors.primary}20`,
                    }}
                    onPress={() =>
                      setDuration((parseInt(duration) + 15).toString())
                    }
                  >
                    <AntDesign name="plus" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Questions */}
              <View className="w-5/12">
                <Text
                  className="text-sm mb-1 font-medium"
                  style={{
                    color: isDark ? `${colors.offwhite}80` : colors.gray,
                  }}
                >
                  Questions
                </Text>
                <View className="flex-row items-center">
                  <TouchableOpacity
                    className="h-10 w-10 rounded-l-lg justify-center items-center"
                    style={{
                      backgroundColor: isDark
                        ? `${colors.primaryDark}90`
                        : `${colors.primary}20`,
                    }}
                    onPress={() =>
                      setQuestionCount(
                        Math.max(parseInt(questionCount) - 5, 5).toString()
                      )
                    }
                  >
                    <AntDesign name="minus" size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <View style={{ maxWidth: 50, minWidth: 20 }}>
                    <TextInput
                      className="h-10 text-center flex-1 border-t border-b"
                      style={{
                        borderColor: isDark
                          ? `${colors.gray}50`
                          : colors.lightGray,
                        backgroundColor: isDark
                          ? `${colors.dark}90`
                          : colors.white,
                        color: isDark ? colors.offwhite : colors.dark,
                      }}
                      keyboardType="numeric"
                      value={questionCount}
                      onChangeText={setQuestionCount}
                    />
                  </View>

                  <TouchableOpacity
                    className="h-10 w-10 rounded-r-lg justify-center items-center"
                    style={{
                      backgroundColor: isDark
                        ? `${colors.primaryDark}90`
                        : `${colors.primary}20`,
                    }}
                    onPress={() =>
                      setQuestionCount((parseInt(questionCount) + 5).toString())
                    }
                  >
                    <AntDesign name="plus" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View className="w-5/12 mb-6">
              <Text
                className="text-sm mb-1 font-medium"
                style={{ color: isDark ? `${colors.offwhite}80` : colors.gray }}
              >
                Question Timer (sec)
              </Text>
              <View className="flex-row items-center">
                <TouchableOpacity
                  className="h-10 w-10 rounded-l-lg justify-center items-center"
                  style={{
                    backgroundColor: isDark
                      ? `${colors.primaryDark}90`
                      : `${colors.primary}20`,
                  }}
                  onPress={() =>
                    setTimePerQuestion(
                      Math.max(parseInt(timePerQuestion) - 15, 15).toString()
                    )
                  }
                >
                  <AntDesign name="minus" size={16} color={colors.primary} />
                </TouchableOpacity>
                <View style={{ maxWidth: 50, minWidth: 20 }}>
                  <TextInput
                    className="h-10  text-center flex-1 border-t border-b"
                    style={{
                      borderColor: isDark
                        ? `${colors.gray}50`
                        : colors.lightGray,
                      backgroundColor: isDark
                        ? `${colors.dark}90`
                        : colors.white,
                      color: isDark ? colors.offwhite : colors.dark,
                    }}
                    keyboardType="numeric"
                    value={timePerQuestion}
                    onChangeText={setTimePerQuestion}
                  />
                </View>

                <TouchableOpacity
                  className="h-10 w-10 rounded-r-lg justify-center items-center"
                  style={{
                    backgroundColor: isDark
                      ? `${colors.primaryDark}90`
                      : `${colors.primary}20`,
                  }}
                  onPress={() =>
                    setTimePerQuestion(
                      (parseInt(timePerQuestion) + 15).toString()
                    )
                  }
                >
                  <AntDesign name="plus" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Difficulty Selector */}
            <View className="mb-2">
              <Text
                className="text-sm mb-2 font-medium"
                style={{ color: isDark ? `${colors.offwhite}80` : colors.gray }}
              >
                Difficulty Level
              </Text>
              <View className="flex-row justify-between">
                {["easy", "medium", "hard"].map((level) => (
                  <TouchableOpacity
                    key={level}
                    className="flex-1 mx-1 py-2 rounded-lg items-center justify-center"
                    style={{
                      backgroundColor:
                        difficulty === level
                          ? isDark
                            ? colors.primaryDark
                            : colors.primary
                          : isDark
                          ? `${colors.dark}90`
                          : `${colors.lightGray}50`,
                    }}
                    onPress={() => setDifficulty(level)}
                  >
                    <Text
                      className="font-medium capitalize"
                      style={{
                        color:
                          difficulty === level
                            ? colors.white
                            : isDark
                            ? colors.offwhite
                            : colors.dark,
                      }}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Topics Section */}
          <View
            className="bg-white rounded-xl p-5 mb-6 shadow-sm"
            style={{
              backgroundColor: isDark ? `${colors.dark}80` : colors.white,
            }}
          >
            <Text
              className="text-lg font-bold mb-4"
              style={{ color: isDark ? colors.offwhite : colors.dark }}
            >
              Select Topics
            </Text>

            <View className="flex-row flex-wrap">
              {availableTopics.map((topic) => (
                <TouchableOpacity
                  key={topic.id}
                  className="mb-3 mr-3 py-2 px-4 rounded-full flex-row items-center"
                  style={{
                    backgroundColor: selectedTopics.includes(topic.id)
                      ? isDark
                        ? `${colors.primary}90`
                        : `${colors.primary}20`
                      : isDark
                      ? `${colors.dark}90`
                      : `${colors.lightGray}50`,
                    borderWidth: 1,
                    borderColor: selectedTopics.includes(topic.id)
                      ? colors.primary
                      : isDark
                      ? `${colors.gray}50`
                      : colors.lightGray,
                  }}
                  onPress={() => toggleTopic(topic.id)}
                >
                  <Text
                    className="font-medium mr-2"
                    style={{
                      color: selectedTopics.includes(topic.id)
                        ? isDark
                          ? colors.white
                          : colors.primary
                        : isDark
                        ? colors.offwhite
                        : colors.dark,
                    }}
                  >
                    {topic.name}
                  </Text>
                  {selectedTopics.includes(topic.id) && (
                    <Feather
                      name="check"
                      size={16}
                      color={isDark ? colors.white : colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Settings Section */}
          <View
            className="bg-white rounded-xl p-5 mb-6 shadow-sm"
            style={{
              backgroundColor: isDark ? `${colors.dark}80` : colors.white,
            }}
          >
            <Text
              className="text-lg font-bold mb-4"
              style={{ color: isDark ? colors.offwhite : colors.dark }}
            >
              Exam Settings
            </Text>

            {/* Timer Toggle */}
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <MaterialCommunityIcons
                  name="timer-outline"
                  size={22}
                  color={isDark ? colors.offwhite : colors.dark}
                  style={{ marginRight: 10 }}
                />
                <Text style={{ color: isDark ? colors.offwhite : colors.dark }}>
                  Include Timer
                </Text>
              </View>
              <Switch
                trackColor={{
                  false: colors.lightGray,
                  true: `${colors.primary}80`,
                }}
                thumbColor={includeTimer ? colors.primary : "#f4f3f4"}
                ios_backgroundColor={colors.lightGray}
                onValueChange={() => setIncludeTimer(!includeTimer)}
                value={includeTimer}
              />
            </View>

            {/* Shuffle Questions Toggle */}
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <MaterialCommunityIcons
                  name="shuffle-variant"
                  size={22}
                  color={isDark ? colors.offwhite : colors.dark}
                  style={{ marginRight: 10 }}
                />
                <Text style={{ color: isDark ? colors.offwhite : colors.dark }}>
                  Shuffle Questions
                </Text>
              </View>
              <Switch
                trackColor={{
                  false: colors.lightGray,
                  true: `${colors.primary}80`,
                }}
                thumbColor={shuffleQuestions ? colors.primary : "#f4f3f4"}
                ios_backgroundColor={colors.lightGray}
                onValueChange={() => setShuffleQuestions(!shuffleQuestions)}
                value={shuffleQuestions}
              />
            </View>
          </View>

          {/* Create Exam Button */}
          <View className="mb-6">
            <TouchableOpacity
              className="py-4 rounded-xl justify-center items-center"
              style={{ backgroundColor: colors.primary }}
              onPress={handleCreateExam}
              disabled={examStore.isLoading}
            >
              <Text className="text-white font-bold text-lg">
                {examStore.isLoading ? "Creating Exam..." : "Create Exam"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Preview Option */}
          <TouchableOpacity
            className="py-3 rounded-xl justify-center items-center mb-10"
            style={{
              backgroundColor: "transparent",
              borderWidth: 1,
              borderColor: isDark ? colors.primaryDark : colors.primary,
            }}
            onPress={() => router.push("Hubs/Exams/ExamsList")}
          >
            <Text
              className="font-medium"
              style={{ color: isDark ? colors.primaryDark : colors.primary }}
            >
              Preview Questions
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {showLoader && <QuizCreationLoader title={`${examTitle}`} />}
    </>
  );
};

export default CreateExam;
