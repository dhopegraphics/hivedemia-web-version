import { colors } from "@/constants/Colors";
import { samplePrompts } from "@/data/prefined_mcqs_prompts";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import LottieView from "lottie-react-native";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import {
  Keyboard,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";

const AdvancedOptionsBottomSheet = ({
  bottomSheetRef,
  customPrompt,
  setCustomPrompt,
  applyPrompt,
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateRandomPrompt = () => {
    setIsGenerating(true);

    const randomIndex = Math.floor(Math.random() * samplePrompts.length);
    const fullPrompt = samplePrompts[randomIndex];
    let currentText = "";
    let charIndex = 0;

    setCustomPrompt(""); // Clear existing text

    const totalLength = fullPrompt.length;

    const typeNext = () => {
      if (charIndex >= totalLength) {
        setIsGenerating(false);
        return;
      }

      let step = 1;
      let delay = 20; // base typing delay

      // Simulate jump typing every ~10-20 characters
      if (Math.random() < 0.2 && charIndex < totalLength - 20) {
        step = Math.floor(Math.random() * 15) + 5; // jump 5–20 characters
        delay = 10; // jump faster
      }

      // Accelerate toward the end
      if (charIndex > totalLength * 0.7) {
        delay = 5;
        step = Math.min(5, totalLength - charIndex);
      }

      currentText += fullPrompt.slice(charIndex, charIndex + step);
      setCustomPrompt(currentText);
      charIndex += step;

      setTimeout(typeNext, delay);
    };

    typeNext();
  };

  const handleApplySettings = () => {
    bottomSheetRef.current?.close();
    applyPrompt(customPrompt);
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={1}
      snapPoints={["1%", "40%", "50%", "60%", "90%"]}
      backgroundStyle={{
        backgroundColor: isDark ? colors.primaryDark : colors.white,
      }}
      handleIndicatorStyle={{
        backgroundColor: isDark ? colors.offwhite : colors.dark,
      }}
    >
      <BottomSheetView className="flex-1 flex">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View className="p-6">
            <Text
              className="text-lg font-bold mb-4"
              style={{ color: isDark ? colors.offwhite : colors.dark }}
            >
              Advanced Options
            </Text>

            <Text
              className="mb-2"
              style={{ color: isDark ? colors.offwhite : colors.dark }}
            >
              Custom Prompt
            </Text>
            <TextInput
              className="rounded-lg p-4 mb-4"
              style={{
                backgroundColor: isDark
                  ? `${colors.dark}80`
                  : `${colors.light}`,
                color: isDark ? colors.offwhite : colors.dark,
                borderColor: colors.primary,
                borderWidth: 1,
              }}
              placeholder="Add specific instructions for the quiz..."
              placeholderTextColor={
                isDark ? `${colors.offwhite}50` : `${colors.dark}50`
              }
              multiline
              numberOfLines={14}
              value={customPrompt}
              onChangeText={setCustomPrompt}
            />

            {isGenerating ? (
              <View className="items-center  flex-row justify-center py-4 mb-4">
                { Platform.OS !== 'web' && (
                  
                <LottieView
                  source={require("@/assets/lottie/typing-dots.json")}
                  autoPlay
                  loop
                  style={{ width: 40, height: 40 }}
                />
                )}

                <Text
                  className="font-JakartaBold text-lg"
                  style={{ color: colors.primary }}
                >
                  Hive Ai Typing...
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                className="flex-row items-center justify-center py-3 rounded-lg mb-4"
                style={{ backgroundColor: colors.primaryLight }}
                onPress={handleGenerateRandomPrompt}
              >
                <Ionicons name="sparkles" size={20} color={colors.white} />
                <Text
                  className="ml-2 font-medium"
                  style={{ color: colors.white }}
                >
                  Generate Prompt with AI Helper
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className="py-3 rounded-lg items-center"
              style={{ backgroundColor: colors.primary }}
              onPress={handleApplySettings}
            >
              <Text className="font-medium" style={{ color: colors.white }}>
                Apply Settings
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default AdvancedOptionsBottomSheet;
