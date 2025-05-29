import { useQuizStore } from "@/backend/store/useQuizStore";
import { useUserStore } from "@/backend/store/useUserStore";
import GenerateQuizTab from "@/components/Quiz/GenerateQuizTab";
import PreviousQuizTab from "@/components/Quiz/PreviousQuizTab";
import QuizCreationLoader from "@/components/Quiz/QuizCreationLoader";
import TabsPublicHeader from "@/components/TabsPublicHeader";
import { colors } from "@/constants/Colors";
import { useToast } from "@/context/ToastContext";
import { sendMessageToCohere } from "@/hooks/cohereApi";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";

function extractJsonFromResponse(text: string): string {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (!match) return "";
  let jsonStr = match[1].trim();
  jsonStr = jsonStr.replace(/\\(?![\\/"bfnrtu])/g, "\\\\");
  return jsonStr;
}

const QuizRoomScreen = () => {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { profile: user } = useUserStore();
  const { showToast } = useToast();
  const [showLoader, setShowLoader] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");
  const userId = user?.user_id;
  const quizStore = useQuizStore();
  const initializeDatabase = quizStore.initializeDatabase;
const getQuizzesByUser = quizStore.getQuizzesByUser;

 // ...existing code...
useEffect(() => {
    if (userId) {
      initializeDatabase();
      getQuizzesByUser(userId);
    }
}, [userId , initializeDatabase, getQuizzesByUser]); 


  if (!userId) {
    Alert.alert("Error", "You must be logged in to generate a quiz.");
    return null;
  }

  const handleGenerateQuiz = async (quizData: {
    selectedFiles: any[];
    selectedLecturerFiles: any[];
    questionCount: number;
    questionTypes: { mcq: boolean; trueFalse: boolean; shortAnswer: boolean };
    difficulty: string;
    feedbackMode: string;
    lecturerStyleEnabled: boolean;
    customPrompt: string;
  }) => {
    const {
      selectedFiles,
      selectedLecturerFiles,
      questionCount,
      questionTypes,
      difficulty,
      feedbackMode,
      customPrompt,
    } = quizData;

    // Validation
    if (
      !selectedFiles.length &&
      !selectedLecturerFiles.length &&
      !customPrompt.trim()
    ) {
      Alert.alert(
        "Error",
        "Please select files or enter a custom topic to generate a quiz"
      );
      return;
    }

    try {
      showToast(`Quiz Creation Has Begin`, "info", 400);

      setShowLoader(true);
      // Construct the prompt for AI
      let prompt = `Generate a quiz with these specifications:
- Number of questions: ${questionCount}
- Question types: ${Object.entries(questionTypes)
        .filter(([_, value]) => value)
        .map(([key]) => key)
        .join(", ")}
- Difficulty: ${difficulty}
- Feedback mode: ${feedbackMode}

`;

      if (selectedFiles.length) {
        prompt += `Based on these documents: ${selectedFiles
          .map((f) => f.name)
          .join(", ")}\n`;
      } else if (selectedLecturerFiles.length) {
        prompt += `In the style of these lecture materials: ${selectedLecturerFiles
          .map((f) => f.name)
          .join(", ")}\n`;
      } else {
        prompt += `On this topic: ${customPrompt}\n`;
      }

      prompt += `Avoid LaTeX or markdown math formatting. Use plain text where possible (e.g., "x squared" instead of "x^2").`;

      prompt += `and Format the response as JSON with this structure:
      
{
  "questions": [
    {
      "type": "question_type",
      "question": "question_text",
      "options": ["option1", "option2", ...], // for MCQ
      "correctAnswer": "correct_answer",
      "explanation": "explanation_text"
    },
    ...
  ]
}`;

      // Send to AI
      const aiResponse = await sendMessageToCohere([
        { role: "user", content: prompt },
      ]);

      // Parse AI response
      let quizQuestions = [];
      try {
        const jsonString = extractJsonFromResponse(aiResponse);
        if (!jsonString) throw new Error("Invalid quiz format from AI");
        const parsed = JSON.parse(jsonString);
        quizQuestions = parsed.questions || [];
      } catch (e) {
        console.error("Failed to parse AI response", e, aiResponse);
        throw new Error("Invalid quiz format from AI");
      }

      // Create quiz in database
      const quizId = await quizStore.createQuiz({
        userId,
        prompt,
        feedbackMode,
        questionCount,
        difficulty,
        questionTypes: JSON.stringify(questionTypes),
      });

      // Save questions
      await quizStore.saveQuizQuestions(quizId, quizQuestions);

      // Navigate to active quiz screen
      router.push({
        pathname: "/QuizHome/Active" as any,
        params: { quizId },
      });
    } catch (error) {
      Alert.alert("Error", "Failed to generate quiz. Please try again.");
      console.error("Quiz generation error:", error);
    } finally {
      setShowLoader(false); // 👈 Hide loader
      showToast(`Here Goes Your Quiz`, "success", 400);
    }
  };

  const quizTitle = quizStore.currentQuiz?.prompt.substring(0, 20);

  return (
    <>
      <View
        className="flex-1"
        style={{ backgroundColor: isDark ? colors.dark : colors.light }}
      >
        <TabsPublicHeader
          HeaderName={"Quiz Home"}
          isDark={isDark}
          colors={colors}
          onSearch={undefined}
        />

        {/* Tabs */}
        <View className="px-6 pt-4">
          <View
            style={{
              backgroundColor: isDark ? colors.darkLight : colors.darkLight,
            }}
            className="flex-row rounded-lg p-1"
          >
            {["generate", "previous"].map((tab) => (
              <TouchableOpacity
                key={tab}
                className={`flex-1 py-2 rounded-md items-center ${
                  activeTab === tab ? "bg-white/30" : ""
                }`}
                onPress={() => setActiveTab(tab)}
              >
                <Text className="font-medium" style={{ color: colors.white }}>
                  {tab === "generate" ? "Generate Quiz" : "My Quizzes"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {activeTab === "generate" ? (
          <GenerateQuizTab
            onGenerate={handleGenerateQuiz}
            isLoading={quizStore.isLoading}
          />
        ) : (
          <PreviousQuizTab
            quizzes={quizStore.quizzes}
            onSelectQuiz={(quizId: string) => {
              quizStore.getQuizWithQuestions(quizId);
              router.push({
                pathname: "/QuizHome/Active" as any,
                params: { quizId },
              });
            }}
            onDeleteQuiz={quizStore.deleteQuiz}
          />
        )}
      </View>
      {showLoader && <QuizCreationLoader title={`${quizTitle}`} />}
    </>
  );
};

export default QuizRoomScreen;
