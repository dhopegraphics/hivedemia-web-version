import { useQuizStore } from "@/backend/store/useQuizStore";
import { colors } from "@/constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const ActiveQuizScreen = () => {
  const { quizId } = useLocalSearchParams();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";


  const { currentQuiz, questions, getQuizWithQuestions } = useQuizStore();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [completed, setCompleted] = useState(false);
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
    setShortAnswerInput("");
  };

  useEffect(() => {
    if (quizId) {
      getQuizWithQuestions(quizId);
    }
  }, [quizId]);

  useEffect(() => {
    const loadProgress = async () => {
      const progress = await AsyncStorage.getItem("quizProgress");
      if (progress) {
        const { quizId: savedQuizId, questionIndex } = JSON.parse(progress);
        if (quizId === savedQuizId) {
          setCurrentQuestionIndex(questionIndex);
        }
      }
    };
    loadProgress();
  }, [quizId]);

  const currentQuestion = questions[currentQuestionIndex];
  const questionTypes = currentQuiz
    ? JSON.parse(currentQuiz.questionTypes)
    : {};

  // Save progress
  const saveQuizProgress = async (quizId, questionIndex) => {
    await AsyncStorage.setItem(
      "quizProgress",
      JSON.stringify({ quizId, questionIndex })
    );
  };

  // Call this when moving to next question or on unmount
  useEffect(() => {
    if (!completed && currentQuiz && currentQuestionIndex >= 0) {
      saveQuizProgress(currentQuiz.id, currentQuestionIndex);
    }
  }, [currentQuestionIndex, completed , currentQuiz]);

  // Optionally, clear progress when quiz is finished
  useEffect(() => {
    if (completed) {
      AsyncStorage.removeItem("quizProgress");
    }
  }, [completed]);

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);

    // Check if answer is correct
    const correct = currentQuestion.correctAnswer === answer;
    setIsCorrect(correct);

    if (correct) {
      setScore((prev) => prev + 1);
    }

    // Show feedback based on mode
    if (currentQuiz.feedbackMode === "instant") {
      setShowFeedback(true);
    } else {
      // For "review after" mode, just move to next question
      handleNextQuestion();
    }
  };

  const handleNextQuestion = () => {
    setShowFeedback(false);
    setSelectedAnswer(null);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  if (!currentQuiz || !currentQuestion) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading quiz...</Text>
      </View>
    );
  }

  if (completed) {
    return (
      <View
        className="flex-1 items-center justify-center p-6"
        style={{ backgroundColor: isDark ? colors.dark : colors.light }}
      >
        <Text
          className="text-2xl font-bold mb-4"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          Quiz Completed!
        </Text>
        <Text
          className="text-lg mb-6"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          Your score: {score}/{questions.length}
        </Text>

        {score === questions.length ? (
          <Text className="text-lg mb-6" style={{ color: colors.success }}>
            Perfect score! Excellent work!
          </Text>
        ) : score >= questions.length * 0.7 ? (
          <Text className="text-lg mb-6" style={{ color: colors.success }}>
            Great job! You're doing well!
          </Text>
        ) : (
          <Text className="text-lg mb-6" style={{ color: colors.warning }}>
            Keep practicing! You'll improve!
          </Text>
        )}

        <TouchableOpacity
          className="py-3 px-6 rounded-lg items-center mt-6"
          style={{ backgroundColor: colors.primary }}
          onPress={() => router.back()}
        >
          <Text className="text-lg font-bold" style={{ color: colors.white }}>
            Back to Quiz Home
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      className="flex-1 pt-20 p-6"
      style={{ backgroundColor: isDark ? colors.dark : colors.light }}
    >
      <View className="mb-6">
        <Text
          className="text-lg"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          Question {currentQuestionIndex + 1} of {questions.length}
        </Text>
      </View>

      <ScrollView className="flex-1 mb-6">
        <Text
          className="text-xl font-bold mb-6"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          {currentQuestion.question}
        </Text>

        {currentQuestion.type === "mcq" && (
          <View className="space-y-3">
            {JSON.parse(currentQuestion.options).map((option, index) => (
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
                {currentQuestionIndex < questions.length - 1
                  ? "Next Question"
                  : "Finish Quiz"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ActiveQuizScreen;
