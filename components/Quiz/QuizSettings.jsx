import { View, Text, TouchableOpacity } from "react-native";
import { useColorScheme } from "nativewind";
import Slider from "@react-native-community/slider";
import { colors } from "@/constants/Colors";

const QuizSettings = ({
  questionCount,
  setQuestionCount,
  questionTypes,
  toggleQuestionType,
  difficulty,
  setDifficulty,
  feedbackMode,
  setFeedbackMode,
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View className="mb-8">
      <Text
        className="text-lg font-bold mb-4"
        style={{ color: isDark ? colors.offwhite : colors.dark }}
      >
        Quiz Settings
      </Text>
      <View
        className="rounded-xl p-4"
        style={{
          backgroundColor: isDark
            ? `${colors.primaryDark}80`
            : `${colors.primary}10`,
        }}
      >
        {/* Question Count */}
        <View className="mb-6">
          <View className="flex-row justify-between mb-1">
            <Text style={{ color: isDark ? colors.offwhite : colors.dark }}>
              Number of Questions
            </Text>
            <Text style={{ color: colors.primary }}>{questionCount}</Text>
          </View>
          <Slider
            minimumValue={5}
            maximumValue={30}
            step={1}
            value={questionCount}
            onValueChange={setQuestionCount}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={
              isDark ? colors.primaryDark : `${colors.primary}50`
            }
            thumbTintColor={colors.primary}
          />
        </View>

        {/* Question Types */}
        <View className="mb-6">
          <Text
            className="mb-2"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            Question Types
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {Object.entries(questionTypes).map(([type, enabled]) => (
              <TouchableOpacity
                key={type}
                className={`px-4 py-2 rounded-full ${
                  enabled ? "bg-primary-100" : "bg-gray-200 dark:bg-gray-700"
                }`}
                onPress={() => toggleQuestionType(type)}
              >
                <Text
                  style={{
                    color: enabled
                      ? colors.white
                      : isDark
                      ? colors.offwhite
                      : colors.dark,
                  }}
                >
                  {type === "mcq"
                    ? "Multiple Choice"
                    : type === "trueFalse"
                    ? "True/False"
                    : "Short Answer"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Difficulty */}
        <View className="mb-6">
          <Text
            className="mb-2"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            Difficulty
          </Text>
          <View className="flex-row bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            {["easy", "medium", "hard"].map((level) => (
              <TouchableOpacity
                key={level}
                className={`flex-1 py-2 rounded-md items-center ${
                  difficulty === level ? "bg-primary-100" : ""
                }`}
                onPress={() => setDifficulty(level)}
              >
                <Text
                  style={{
                    color:
                      difficulty === level
                        ? colors.white
                        : isDark
                        ? colors.offwhite
                        : colors.dark,
                  }}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Feedback Mode */}
        <View>
          <Text
            className="mb-2"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            Feedback Mode
          </Text>
          <View className="flex-row bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            {["instant", "review"].map((mode) => (
              <TouchableOpacity
                key={mode}
                className={`flex-1 py-2 rounded-md items-center ${
                  feedbackMode === mode ? "bg-primary-100" : ""
                }`}
                onPress={() => setFeedbackMode(mode)}
              >
                <Text
                  style={{
                    color:
                      feedbackMode === mode
                        ? colors.white
                        : isDark
                        ? colors.offwhite
                        : colors.dark,
                  }}
                >
                  {mode === "instant" ? "Instant Feedback" : "Review After"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

export default QuizSettings;
