import { useAIAssistantStore } from "@/backend/store/aiAssistantStore";
import { useSnapToSolveStore } from "@/backend/store/useSnapToSolveStore";
import ArrowBackHeaderComponent from "@/components/ArrowBackHeaderComponent";
import AIAssistant from "@/components/SmartHive/AIAssistant";
import { colors } from "@/constants/Colors";
import { encodeImage, sendMessageToGemini } from "@/hooks/geminiApi";
import { Ionicons } from "@expo/vector-icons";
import { Camera, CameraView } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Stack } from "expo-router";
import LottieView from "lottie-react-native";
import { useColorScheme } from "nativewind";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";


export default function SnapAndSolve() {
  const { showAssistant } = useAIAssistantStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const cameraRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const qrLock = useRef(false);
  const [image, setImage] = useState(null);
  const [questionType, setQuestionType] = useState("math");
  const [subject, setSubject] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [solution, setSolution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const snapStore = useSnapToSolveStore();
  // Init DB on mount
  useEffect(() => {
    snapStore.initSnapToSolveTables();
    // Optionally load previous solutions
    // snapStore.getAllSolutions();
  }, [snapStore]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        qrLock.current = false;
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, []);

  // Camera permission
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  // Take Picture
  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setImage(photo.uri);
      setCameraActive(false);
    }
  };

  // Upload Image
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // --- AI Solve Function ---
  const solveQuestion = async () => {
    if (!image) return;
    setLoading(true);
    setSolution(null);

    try {
      // Prepare image for Gemini
      const encodedImg = await encodeImage(image);

      // Compose prompt for Gemini
      const prompt = `
You are Smart Hive AI. Analyze the attached image and the following context to solve the question step-by-step.

Question Type: ${questionType}
Subject: ${subject || "Not specified"}
Extra Context: ${userPrompt || "None"}

Return your answer as a JSON object with this structure:
{
  "steps": [ "step 1...", "step 2...", ... ],
  "finalAnswer": "final answer here",
  "explanation": "short explanation here"
}
Do not include any text outside the JSON object.
`;

      // Build Gemini message
      const geminiMessages = [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: encodedImg } },
          ],
        },
      ];

      // Get AI response
      const aiRaw = await sendMessageToGemini(geminiMessages);

      // Try to extract JSON from response
      let parsed;
      try {
        // Find first {...} block in response
        const match = aiRaw.match(/\{[\s\S]*\}/);
        parsed = match ? JSON.parse(match[0]) : null;
      } catch (e) {
        parsed = null;
      }

      if (
        parsed &&
        Array.isArray(parsed.steps) &&
        parsed.finalAnswer &&
        parsed.explanation
      ) {
        setSolution(parsed);
        // Save to local DB
        await snapStore.saveSolution({
          image,
          questionType,
          subject,
          userPrompt,
          steps: parsed.steps,
          finalAnswer: parsed.finalAnswer,
          explanation: parsed.explanation,
        });
      } else {
        setSolution({
          steps: ["Sorry, I couldn't parse the AI's response."],
          finalAnswer: "",
          explanation: aiRaw,
        });
      }
    } catch (err) {
      setSolution({
        steps: ["Sorry, something went wrong."],
        finalAnswer: "",
        explanation: err?.message || "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAskFollowUp = () => {
    // Compose context string for the assistant
    const context = `I can help you with your ${questionType}${
      subject ? ` (${subject})` : ""
    } problem. What would you like to know?`;

    // Pass the original solution as extra context for follow-ups
    showAssistant({
      context,
      originalSolution: solution, // Pass the full solution object
      questionType,
      subject,
      image,
    });
  };

  const handleTrySimilar = () => {
    setSolution(null);
    setUserPrompt("");
  };

  const handleBookmark = async () => {
    if (solution) {
      await snapStore.saveSolution({
        image,
        questionType,
        subject,
        userPrompt,
        steps: solution.steps,
        finalAnswer: solution.finalAnswer,
        explanation: solution.explanation,
      });
      Alert.alert("Bookmarked", "Solution saved locally!");
    }
  };

  // Reset
  const reset = () => {
    setImage(null);
    setSolution(null);
    setUserPrompt("");
  };

  // Camera View
  if (cameraActive) {
    return (
      <SafeAreaView style={styles.fullscreen}>
        <Stack.Screen options={{ headerShown: false }} />
        {Platform.OS === "android" && <StatusBar hidden />}

        <CameraView ref={cameraRef} style={styles.fullscreen} facing="back" />

        <View style={styles.cameraOverlay}>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <Ionicons name="camera" size={32} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setCameraActive(false)}
          >
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (cameraActive) {
  if (hasPermission === false) 
    return (
      <SafeAreaView style={styles.fullscreen}>
        <View style={styles.fullscreen} className="justify-center items-center">
          <Ionicons name="alert-circle" size={48} color="red" />
          <Text className="text-lg font-bold mt-4 mb-2">Camera Permission Denied</Text>
          <Text className="text-center mb-4">
            Please enable camera access in your device settings to use Snap & Solve.
          </Text>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={() => setCameraActive(false)}
          >
            <Text style={{ color: "white" }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Main UI
  return (
    <SafeAreaView
      style={{ backgroundColor: isDark ? colors.dark : colors.white }}
      className="flex-1 bg-white pt-8 dark:bg-gray-900"
    >
      <ArrowBackHeaderComponent
        isDark={isDark}
        colors={colors}
        headerName="Snap & Solve"
      />
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-gray-500 dark:text-gray">
            Upload or snap a question for step-by-step AI solutions
          </Text>
        </View>

        {/* Step 1: Upload/Snap */}
        {!image && (
          <View className="mb-6">
            <Text className="text-lg font-semibold dark:text-white mb-2">
              1. Select Question Type
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {["math", "theory", "coding", "physics", "Let Ai Decide"].map(
                (type) => (
                  <TouchableOpacity
                    key={type}
                    className={`px-4 py-2 rounded-full ${
                      questionType === type
                        ? "bg-[#00DF82]"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                    onPress={() => setQuestionType(type)}
                  >
                    <Text
                      className={
                        questionType === type ? "text-white" : "dark:text-white"
                      }
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            <TextInput
              className="bg-gray-100 dark:bg-primary-200 p-3 rounded-lg mb-4 dark:text-white"
              placeholder="Optional: Specify subject (e.g., Linear Algebra)"
              value={subject}
              onChangeText={setSubject}
              placeholderTextColor={isDark ? colors.offwhite : colors.gray}
            />

            <View className="flex-row justify-between">
              <TouchableOpacity
                className="flex-1 bg-[#00DF82] p-4 rounded-xl items-center mr-2"
                onPress={() => setCameraActive(true)}
              >
                <Ionicons name="camera" size={24} color="white" />
                <Text className="text-white mt-1">Snap Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-[#3B82F6] p-4 rounded-xl items-center ml-2"
                onPress={pickImage}
              >
                <Ionicons name="image" size={24} color="white" />
                <Text className="text-white mt-1">Upload Image</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 2: Preview & Submit */}
        {image && !solution && (
          <View className="mb-6">
            <Text className="text-lg font-semibold dark:text-white mb-2">
              2. Confirm & Solve
            </Text>
            <Image
              source={{ uri: image }}
              className="w-full h-48 rounded-lg mb-4"
            />
            <TextInput
              className="bg-gray-100 dark:bg-primary-200 p-3 rounded-lg mb-4 dark:text-white"
              placeholder="Add extra context (optional)"
              value={userPrompt}
              onChangeText={setUserPrompt}
              placeholderTextColor={isDark ? colors.offwhite : colors.gray}
            />
            <View className="flex-row justify-between">
              <TouchableOpacity
                className="bg-gray-200 dark:bg-gray-700 px-4 py-3 rounded-xl"
                onPress={reset}
              >
                <Text className="dark:text-white">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-[#00DF82] px-4 py-3 rounded-xl flex-row items-center"
                onPress={solveQuestion}
                disabled={loading}
              >
                {loading ? (
                  <View className="items-center flex-row justify-center">
                    <LottieView
                      source={require("@/assets/lottie/typing-dots.json")}
                      autoPlay
                      loop
                      style={{ width: 40, height: 40 }}
                    />
                    <Text
                      className="font-JakartaBold text-base"
                      style={{ color: colors.dark }}
                    >
                      Smart Hive Ai Solving...
                    </Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color="white" />
                    <Text className="text-white ml-2">Solve with Hive Ai</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 3: Solution Display */}
        {solution && (
          <ScrollView className="mb-6">
            <Text className="text-lg font-semibold dark:text-white mb-2">
              Smart Hive Snap-Solve Solution
            </Text>

            <View className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mb-4">
              {solution.steps.map((step, index) => (
                <Text key={index} className="dark:text-white mb-2">
                  {step}
                </Text>
              ))}
            </View>

            <View className="bg-green-100 dark:bg-green-900/50 rounded-xl p-4 mb-4">
              <Text className="font-bold dark:text-white">Final Answer:</Text>
              <Text className="dark:text-white">{solution.finalAnswer}</Text>
            </View>

            <View className="bg-blue-100 dark:bg-blue-900/50 rounded-xl p-4 mb-4">
              <Text className="font-bold dark:text-white">Explanation:</Text>
              <Text className="dark:text-white">{solution.explanation}</Text>
            </View>

            <View className="flex-row flex-wrap gap-2 mb-4">
              <TouchableOpacity
                className="bg-[#3B82F6] px-3 py-2 rounded-full"
                onPress={handleAskFollowUp}
              >
                <Text className="text-white">Ask Follow-up</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-[#10B981] px-3 py-2 rounded-full"
                onPress={handleTrySimilar}
              >
                <Text className="text-white">Try Similar Problem</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-[#F59E0B] px-3 py-2 rounded-full"
                onPress={handleBookmark}
              >
                <Text className="text-white">Bookmark</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className="bg-[#00DF82] p-3 rounded-xl items-center"
              onPress={reset}
            >
              <Text className="text-white font-medium">Solve Another</Text>
            </TouchableOpacity>
            <View className="h-20 mb-40" />
          </ScrollView>
        )}
      </View>
      <AIAssistant />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
  },
  cameraOverlay: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  captureButton: {
    backgroundColor: "#00DF82",
    borderRadius: 50,
    padding: 20,
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 10,
  },
});
