// components/AIAssistant.js
import { useAIAssistantStore } from "@/backend/store/aiAssistantStore";
import { sendMessageToGemini } from "@/hooks/geminiApi";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const AIAssistant = () => {
  const { isVisible, hideAssistant } = useAIAssistantStore();
  const { originalSolution, messages, addMessage } = useAIAssistantStore();

  const [inputText, setInputText] = useState("");
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Animation values
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const scale = useSharedValue(0.95);
  const inputOpacity = useSharedValue(1);

  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Colors
  const colors = {
    primary: isDark ? "#00DF82" : "#8B5CF6",
    background: isDark ? "rgba(30, 30, 40, 0.8)" : "rgba(255, 255, 255, 0.8)",
    text: isDark ? "#FFFFFF" : "#1E1E1E",
    secondaryText: isDark ? "#A1A1AA" : "#52525B",
    primaryText: isDark ? "#042222" : "#52525B",
    border: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
    accent: isDark ? "#A78BFA" : "#7C3AED",
  };

  // Animation styles
  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
    };
  });

  const inputStyle = useAnimatedStyle(() => {
    return {
      opacity: inputOpacity.value,
    };
  });

  // Handle visibility changes
  useEffect(() => {
    if (isVisible) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 120,
      });
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 120,
      });

      // Small haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Focus input after animation
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(30, { duration: 200 });
      scale.value = withTiming(0.95, { duration: 200 });
      Keyboard.dismiss();
    }
  }, [isVisible , opacity, translateY, scale]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputText.trim() === "") return;

    // Add user message
    addMessage({ text: inputText, isUser: true });

    // Compose context for Gemini
    let contextPrompt = "";
    if (originalSolution) {
      contextPrompt = `
You are Smart Hive AI. Here is the original solution to the user's problem:
Steps: ${originalSolution.steps?.join("\n")}
Final Answer: ${originalSolution.finalAnswer}
Explanation: ${originalSolution.explanation}

Now, answer the user's follow-up question below, using the above as context.
`;
    }

    // Build messages array for Gemini
    const geminiMessages = [
      { role: "system", content: contextPrompt },
      ...messages
        .filter((m) => m.isUser !== undefined)
        .map((m) => ({
          role: m.isUser ? "user" : "assistant",
          content: m.text,
        })),
      { role: "user", content: inputText },
    ];
    // Get AI response
    try {
      const aiRaw = await sendMessageToGemini(geminiMessages);
      addMessage({ text: aiRaw, isUser: false });
    } catch (err) {
      addMessage({
        text: `Sorry, I encountered an error. Please try again.${"\n\n"}Error: ${err.message}`,
        timestamp: Date.now(),
        isUser: false,
      });
    }
    setInputText("");
  };

  const handleClose = () => {
    hideAssistant();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        containerStyle,
        { display: isVisible ? "flex" : "none" },
      ]}
    >
      <BlurView
        intensity={30}
        tint={isDark ? "dark" : "light"}
        style={styles.blurContainer}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.avatarContainer}></View>
          <Image
            source={require("@/assets/images/black-logo-white-text.webp")}
            className="w-40 h-8 "
            resizeMode="cover"
          />

          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>

        {/* Chat messages */}
        <Animated.ScrollView
          style={styles.messagesContainer}
          ref={messagesEndRef}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.isUser
                  ? [styles.userMessage, { backgroundColor: colors.primary }]
                  : [styles.aiMessage, { backgroundColor: colors.background }],
                {
                  borderColor: colors.border,
                  shadowColor: isDark ? "#000000" : "#E5E7EB",
                },
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.isUser
                    ? styles.userMessageText
                    : { color: colors.text },
                ]}
              >
                {message.text}
              </Text>
              <Text
                style={[
                  styles.messageTime,
                  {
                    color: message.isUser
                      ? colors.primaryText
                      : colors.secondaryText,
                  },
                ]}
              >
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          ))}
        </Animated.ScrollView>

        {/* Input area */}
        <Animated.View style={[styles.inputContainer, inputStyle]}>
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: isDark
                  ? "rgba(40, 40, 50, 0.8)"
                  : "rgba(245, 245, 245, 0.8)",
                borderColor: colors.border,
              },
            ]}
            placeholder="Ask about the course..."
            placeholderTextColor={colors.secondaryText}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSendMessage}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            style={[styles.sendButton, { backgroundColor: colors.primary }]}
            disabled={inputText.trim() === ""}
          >
            <Ionicons name="send" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 20,
    zIndex: 1000,
    padding: 16,
    justifyContent: "center",
    alignSelf: "center",
    height: "80%",
  },
  blurContainer: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: "relative",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 35,
  },
  avatarGlow: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    opacity: 0.2,
  },
  avatarIcon: {
    zIndex: 2,
  },
  headerText: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userMessage: {
    alignSelf: "flex-end",
  },
  aiMessage: {
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: "#042222",
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    textAlign: "right",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 8,
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
});

export default AIAssistant;
