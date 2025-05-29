import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

const ContinueSectionCard = ({ colors, isDark }) => {
  const isFocused = useIsFocused();
  const [resumeQuiz, setResumeQuiz] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const loadSession = async () => {
      const keys = await AsyncStorage.getAllKeys();
      const studyKeys = keys.filter((k) => k.startsWith("studySession-"));
      let latestSession = null;
      let latestTimestamp = 0;
      for (const key of studyKeys) {
        const sessionStr = await AsyncStorage.getItem(key);
        if (sessionStr) {
          const sessionObj = JSON.parse(sessionStr);
          if (sessionObj.timestamp > latestTimestamp) {
            latestTimestamp = sessionObj.timestamp;
            latestSession = sessionObj;
          }
        }
      }
      setSession(latestSession);
    };
    loadSession();
  }, [isFocused]);

  useEffect(() => {
    AsyncStorage.getItem("quizProgress").then((progress) => {
      if (progress) setResumeQuiz(JSON.parse(progress));
      else setResumeQuiz(null); // Clear if not found
    });
  }, [isFocused]); // Re-run when screen is focused

  return (
    <View className="px-6 mt-6">
      <View
        className="rounded-2xl p-5 shadow-sm"
        style={{ backgroundColor: isDark ? colors.dark : colors.white }}
      >
        <Text
          className="text-lg font-semibold mb-3"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          Continue Learning
        </Text>
        {resumeQuiz && (
          <TouchableOpacity
            onPress={() =>
              router.push(`/QuizHome/Active?quizId=${resumeQuiz.quizId}`)
            }
            className="flex-row items-center justify-between mb-4"
          >
            <View className="flex-row items-center">
              <View
                className="p-3 rounded-full mr-3"
                style={{
                  backgroundColor: isDark
                    ? `${colors.primary}20`
                    : `${colors.primary}10`,
                }}
              >
                <Ionicons
                  name="timer-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={{ color: isDark ? colors.offwhite : colors.dark }}>
                Resume Last Quiz
              </Text>
            </View>
            <Feather
              name="chevron-right"
              size={20}
              color={isDark ? colors.offwhite : colors.dark}
            />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          className="flex-row items-center justify-between"
          onPress={() => {
            if (session) {
        
              router.push({
                pathname: `/FileDecisionRouter/${session.fileId}`,
                params: {
                  fileType: session.fileType,
                  fileTitle: session.fileTitle,
                  fileUrl: session.fileUrl,
                  fileIsPrivate: session.fileIsPrivate,
                  sourceType: session.sourceType,
                  courseId: session.courseId,
                  isCommentable: session.isCommentableBool,
                  page: session.lastPage,
                },
              });
            }
          }}
        >
          <View className="flex-row max-w-80 items-center">
            <View
              className="p-3 rounded-full mr-3"
              style={{
                backgroundColor: isDark
                  ? `${colors.primaryLight}20`
                  : `${colors.primaryLight}10`,
              }}
            >
              <Ionicons
                name="book-outline"
                size={20}
                color={colors.primaryLight}
              />
            </View>
            <Text style={{ color: isDark ? colors.offwhite : colors.dark , maxWidth: 200 }}>
              Continue Studying
              {session
                ? `: ${session.fileTitle || "Untitled"} (Page ${
                    session.lastPage
                  })`
                : ""}
            </Text>
          </View>
          <Feather
            name="chevron-right"
            size={20}
            color={isDark ? colors.offwhite : colors.dark}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ContinueSectionCard;
