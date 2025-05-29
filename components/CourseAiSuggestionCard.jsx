import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

const CourseAiSuggestionCard = ({ userData, isDark, colors }) => {
  return (
    <View className="px-6 mt-8">
      <Text
        className="text-xl font-bold mb-4"
        style={{ color: isDark ? colors.offwhite : colors.dark }}
      >
        Today&apos;s Focus
      </Text>
      <View
        className="rounded-2xl p-5 shadow-sm"
        style={{ backgroundColor: isDark ? colors.dark : colors.white }}
      >
        <View className="flex-row justify-between items-start mb-3">
          <Text
            className="text-lg font-semibold"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            {userData.todayFocus}
          </Text>
          <View
            className="px-3 py-1 rounded-full"
            style={{
              backgroundColor: isDark
                ? `${colors.primary}20`
                : `${colors.primary}10`,
            }}
          >
            <Text
              className="text-xs"
              style={{ color: isDark ? colors.primary : colors.primaryDark }}
            >
              AI Suggested
            </Text>
          </View>
        </View>
        <Text
          className="mb-4"
          style={{
            color: isDark ? `${colors.offwhite}80` : `${colors.dark}80`,
          }}
        >
          From your AI Planner based on upcoming exam and weak areas
        </Text>
        <TouchableOpacity
          className="py-3 rounded-xl items-center"
          style={{ backgroundColor: colors.primary }}
          onPress={() => router.push(`/CourseHub/${userData.todayFocus}`)}
        >
          <Text className="font-medium" style={{ color: colors.white }}>
            Start Studying
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CourseAiSuggestionCard;
