import { useExamStore } from "@/backend/store/useExamStore";
import { colors } from "@/constants/Colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const StartExam = () => {
  const { ExamId } = useLocalSearchParams();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const examStore = useExamStore();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [shortAnswerInput, setShortAnswerInput] = useState("");

  const handleShortAnswerSubmit = () => {
    const trimmed = shortAnswerInput.trim().toLowerCase();
    const correct =
      currentQuestion.correctAnswer.trim().toLowerCase() === trimmed;

    setSelectedAnswer(shortAnswerInput); // store what the user wrote
    setIsCorrect(correct);

    if (correct) {
      setScore((prev) => prev + 1);
    }

    setShowFeedback(true);
    setTimerActive(false);
    setShortAnswerInput("");
  };

  // Load exam data
  useEffect(() => {
    if (ExamId) {
      examStore.getExamWithDetails(ExamId);
    }
  }, [ExamId , examStore]);

  // Timer effect
  useEffect(() => {
    if (!timerActive || !examStore.currentExam?.includeTimer) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleNextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerActive , examStore.currentExam?.includeTimer , handleNextQuestion]);

  // Start timer when question changes
  useEffect(() => {
    if (examStore.currentExam?.includeTimer) {
      setTimeLeft(examStore.currentExam.timePerQuestion);
      setTimerActive(true);
    }
  }, [currentQuestionIndex , examStore.currentExam?.includeTimer , examStore.currentExam?.timePerQuestion]);

  const currentQuestion = examStore.examQuestions[currentQuestionIndex];

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
    setTimerActive(false);

    // Check if answer is correct
    const correct = currentQuestion.correctAnswer === answer;
    setIsCorrect(correct);

    if (correct) {
      setScore((prev) => prev + 1);
    }

    setShowFeedback(true);
  };


  const handleNextQuestion = useCallback(() => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    setTimerActive(false);

    if (currentQuestionIndex < examStore.examQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setCompleted(true);
    }
  }, [currentQuestionIndex, examStore.examQuestions.length]);

  if (!examStore.currentExam || examStore.isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading exam...</Text>
      </View>
    );
  }

  if (completed) {
    return (
      <View
        className="flex-1 pt-16 p-6"
        style={{ backgroundColor: isDark ? colors.dark : colors.light }}
      >
        <Text
          className="text-2xl font-bold mb-4"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          Exam Completed!
        </Text>
        <Text
          className="text-lg mb-6"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          Your score: {score}/{examStore.examQuestions.length}
        </Text>

        {score === examStore.examQuestions.length ? (
          <Text className="text-lg mb-6" style={{ color: colors.success }}>
            Perfect score! Excellent work!
          </Text>
        ) : score >= examStore.examQuestions.length * 0.7 ? (
          <Text className="text-lg mb-6" style={{ color: colors.success }}>
            Great job! You passed with flying colors!
          </Text>
        ) : (
          <Text className="text-lg mb-6" style={{ color: colors.warning }}>
            Keep practicing! Review the topics and try again.
          </Text>
        )}

        <TouchableOpacity
          className="py-3 rounded-lg items-center mt-6"
          style={{ backgroundColor: colors.primary }}
          onPress={() => router.back()}
        >
          <Text className="text-lg font-bold" style={{ color: colors.white }}>
            Back to Exams
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>No questions found in this exam</Text>
      </View>
    );
  }

  const rawOptions = currentQuestion.options;
  let options = [];
  const parsedOnce = JSON.parse(rawOptions);
  options = JSON.parse(parsedOnce);

  return (
    <View
      className="flex-1 p-6"
      style={{ backgroundColor: isDark ? colors.dark : colors.light }}
    >
      <View className="pt-16 pb-2 mb-6 flex-row justify-between items-center">
        <Text
          className="text-xl font-bold ml-2"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          Exam Mode
        </Text>
        <TouchableOpacity className="p-2">
          <MaterialCommunityIcons
            name="stop-circle"
            size={24}
            color={isDark ? colors.offwhite : colors.dark}
          />
        </TouchableOpacity>
      </View>

      {/* Exam Header */}
      <View className="flex-row justify-between items-center mb-6">
        <Text
          className="text-lg"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          Question {currentQuestionIndex + 1} of{" "}
          {examStore.examQuestions.length}
        </Text>

        {examStore.currentExam.includeTimer && (
          <View className="flex-row items-center">
            <MaterialCommunityIcons
              name="timer-outline"
              size={20}
              color={isDark ? colors.offwhite : colors.dark}
            />
            <Text
              className="ml-1"
              style={{ color: isDark ? colors.offwhite : colors.dark }}
            >
              {timeLeft}s
            </Text>
          </View>
        )}
      </View>

      <ScrollView className="flex-1 mb-6">
        {/* Question */}
        <Text
          className="text-xl font-bold mb-6"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          {currentQuestion.question}
        </Text>

        {/* Answer Options */}
        {currentQuestion.type === "mcq" && options.length > 0 && (
          <View className="space-y-3">
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                className={`p-4 rounded-lg ${
                  selectedAnswer === option
                    ? isCorrect
                      ? "bg-green-500"
                      : "bg-red-500"
                    : isDark
                    ? "bg-darkLight"
                    : "bg-grayLight"
                }`}
                onPress={() => !selectedAnswer && handleAnswerSelect(option)}
                disabled={!!selectedAnswer}
              >
                <Text
                  style={{
                    color:
                      selectedAnswer === option
                        ? colors.white
                        : isDark
                        ? colors.offwhite
                        : colors.dark,
                  }}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {currentQuestion.type === "shortAnswer" && !showFeedback && (
          <View className="space-y-4">
            <TextInput
              className={`p-4 rounded-lg ${
                isDark ? "bg-darkLight" : "bg-grayLight"
              }`}
              placeholder="Type your answer here..."
              placeholderTextColor={isDark ? "#ccc" : "#555"}
              value={shortAnswerInput}
              onChangeText={setShortAnswerInput}
              editable={!showFeedback}
              style={{
                color: isDark ? colors.offwhite : colors.dark,
              }}
            />

            <TouchableOpacity
              className="py-3 rounded-lg items-center"
              style={{ backgroundColor: colors.primary }}
              onPress={handleShortAnswerSubmit}
              disabled={shortAnswerInput.trim() === ""}
            >
              <Text style={{ color: colors.white, fontWeight: "bold" }}>
                Submit Answer
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {currentQuestion.type === "trueFalse" && (
          <View className="flex-row justify-between space-x-3">
            {["True", "False"].map((option) => (
              <TouchableOpacity
                key={option}
                className={`flex-1 p-4 rounded-lg items-center ${
                  selectedAnswer === option
                    ? isCorrect
                      ? "bg-green-500"
                      : "bg-red-500"
                    : isDark
                    ? "bg-darkLight"
                    : "bg-grayLight"
                }`}
                onPress={() => !selectedAnswer && handleAnswerSelect(option)}
                disabled={!!selectedAnswer}
              >
                <Text
                  style={{
                    color:
                      selectedAnswer === option
                        ? colors.white
                        : isDark
                        ? colors.offwhite
                        : colors.dark,
                  }}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Feedback */}
        {showFeedback && (
          <View
            className="mt-6 p-4 rounded-lg"
            style={{
              backgroundColor: isDark ? colors.darkLight : colors.grayLight,
            }}
          >
            <Text
              className="font-bold mb-2"
              style={{ color: isCorrect ? colors.success : colors.error }}
            >
              {isCorrect ? "Correct!" : "Incorrect"}
            </Text>
            <Text style={{ color: isDark ? colors.offwhite : colors.dark }}>
              {currentQuestion.explanation ||
                (isCorrect
                  ? "You got it right!"
                  : `The correct answer is: ${currentQuestion.correctAnswer}`)}
            </Text>

            <TouchableOpacity
              className="mt-4 py-2 rounded-lg items-center"
              style={{ backgroundColor: colors.primary }}
              onPress={handleNextQuestion}
            >
              <Text style={{ color: colors.white }}>
                {currentQuestionIndex < examStore.examQuestions.length - 1
                  ? "Next Question"
                  : "Finish Exam"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default StartExam;
