import { colors } from "@/constants/Colors";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useRef, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import AdvancedOptionsBottomSheet from "./AdvancedOptionsBottomSheet";
import LecturerStyleAdaptation from "./LecturerStyleAdaptation";
import QuizSettings from "./QuizSettings";
import SourceMaterial from "./SourceMaterial";

const GenerateQuizTab = ({ onGenerate, isLoading }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const bottomSheetRef = useRef(null);

  // State for all quiz settings
  const [quizSettings, setQuizSettings] = useState({
    selectedFiles: [],
    selectedLecturerFiles: [],
    questionCount: 10,
    questionTypes: {
      mcq: true,
      trueFalse: false,
      shortAnswer: false,
    },
    difficulty: "medium",
    feedbackMode: "instant",
    lecturerStyleEnabled: false,
    customPrompt: "",
  });

  const toggleQuestionType = (type) => {
    setQuizSettings((prev) => ({
      ...prev,
      questionTypes: {
        ...prev.questionTypes,
        [type]: !prev.questionTypes[type],
      },
    }));
  };

  const openBottomSheet = () => {
    bottomSheetRef.current?.expand();
  };

  const applyPrompt = (promptMessage) => {
    setQuizSettings((prev) => ({
      ...prev,
      customPrompt: promptMessage,
    }));
  };

  const handleGenerate = () => {
    onGenerate(quizSettings);
  };

  return (
    <>
      <ScrollView
        className="flex-1 px-6 py-6"
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* Source Material Section */}
        <SourceMaterial
          selectedFiles={quizSettings.selectedFiles}
          setSelectedFiles={(files) =>
            setQuizSettings((prev) => ({ ...prev, selectedFiles: files }))
          }
        />

        {/* Quiz Settings */}
        <QuizSettings
          questionCount={quizSettings.questionCount}
          setQuestionCount={(count) =>
            setQuizSettings((prev) => ({ ...prev, questionCount: count }))
          }
          questionTypes={quizSettings.questionTypes}
          toggleQuestionType={toggleQuestionType}
          difficulty={quizSettings.difficulty}
          setDifficulty={(difficulty) =>
            setQuizSettings((prev) => ({ ...prev, difficulty }))
          }
          feedbackMode={quizSettings.feedbackMode}
          setFeedbackMode={(mode) =>
            setQuizSettings((prev) => ({ ...prev, feedbackMode: mode }))
          }
        />

        {/* Lecturer Style */}
        <LecturerStyleAdaptation
          lecturerStyleEnabled={quizSettings.lecturerStyleEnabled}
          setLecturerStyleEnabled={(enabled) =>
            setQuizSettings((prev) => ({
              ...prev,
              lecturerStyleEnabled: enabled,
            }))
          }
          selectedLecturerFiles={quizSettings.selectedLecturerFiles}
          setSelectedLecturerFiles={(files) =>
            setQuizSettings((prev) => ({
              ...prev,
              selectedLecturerFiles: files,
            }))
          }
        />

        {/* Advanced Options */}
        <TouchableOpacity
          className="w-full px-2 py-4 mb-4"
          onPress={openBottomSheet}
        >
          <View className="flex-row items-center justify-between">
            <Text
              className="text-lg font-bold"
              style={{ color: isDark ? colors.offwhite : colors.dark }}
            >
              Advanced Options
            </Text>
            <Feather
              name="chevron-down"
              size={20}
              color={isDark ? colors.offwhite : colors.dark}
            />
          </View>
        </TouchableOpacity>

        {/* Generate Button */}
        <TouchableOpacity
          className="py-4 rounded-xl items-center justify-center mb-8"
          style={{ backgroundColor: colors.primary }}
          onPress={handleGenerate}
          disabled={isLoading}
        >
          <Text className="text-lg font-bold" style={{ color: colors.white }}>
            {isLoading ? "Generating..." : "Generate Quiz"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Sheet */}
      <AdvancedOptionsBottomSheet
        bottomSheetRef={bottomSheetRef}
        customPrompt={quizSettings.customPrompt}
        setCustomPrompt={(prompt) =>
          setQuizSettings((prev) => ({ ...prev, customPrompt: prompt }))
        }
        applyPrompt={applyPrompt}
      />

      <View className="mb-20"></View>
    </>
  );
};

export default GenerateQuizTab;
