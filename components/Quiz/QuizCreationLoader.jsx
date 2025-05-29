// components/QuizCreationLoader.tsx
import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useColorScheme } from "nativewind";
import { colors } from "@/constants/Colors";

const QuizCreationLoader = ({ title = "your quiz" }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const progress = useSharedValue(0);

  // Animate progress loop
  useEffect(() => {
    progress.value = withTiming(1, {
      duration: 4000,
      easing: Easing.linear,
    });
  }, []);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View className="absolute inset-0 items-center justify-center z-50">
      <BlurView
        intensity={50}
        tint={isDark ? "dark" : "light"}
        style={{ ...StyleSheet.absoluteFillObject }}
      />
      <View
        className={`p-6 rounded-2xl items-center ${
          isDark ? "bg-primaryDark" : "bg-white"
        }`}
        style={{ width: 280 }}
      >
        <View className="relative w-full h-3 bg-gray-200 rounded-full mb-4 overflow-hidden">
          <Animated.View
            className="absolute h-full bg-primary rounded-full"
            style={progressStyle}
          />
        </View>

        <View className="flex-row items-center">
          <Ionicons
            name="sparkles"
            size={24}
            color={colors.primary}
            style={{ marginRight: 8 }}
          />
          <Text
            className={`text-lg font-semibold ${
              isDark ? "text-offwhite" : "text-dark"
            }`}
          >
            Generating {title}...
          </Text>
        </View>

        <Text
          className={`mt-2 text-center ${
            isDark ? "text-offwhite/80" : "text-dark/80"
          }`}
        >
          Let the AI do its magic ✨
        </Text>
      </View>
    </View>
  );
};

export default QuizCreationLoader;
