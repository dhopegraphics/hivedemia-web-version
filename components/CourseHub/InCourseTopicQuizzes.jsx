import { supabase } from "@/backend/supabase";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

const InCourseTopicQuizzes = ({ isDark, colors, files, courseId }) => {
  const topicQuizzes = [];

  const router = useRouter();
  const [courseFiles, setCourseFiles] = useState([]);
  const sheetRef = useRef(null);
  const snapPoints = useMemo(() => ["40%", "80%"], []);

  const fetchCourseFiles = useCallback(async () => {
    const { data, error } = await supabase
      .from("coursefiles")
      .select("id, name, type")
      .eq("course_id", courseId);

    if (error) {
      console.error("Error fetching course files:", error);
      return;
    }

    const enriched = data.map((item) => {
      const matchedFile = files.find((f) => f.name === item.name);

      return {
        ...item,
        url: matchedFile?.url ?? null,
        size: matchedFile?.size ?? null,
        filePath: matchedFile?.filePath ?? null,
      };
    });

    setCourseFiles(enriched);
  }, [courseId, files]);

  // Optional: auto fetch when courseId changes
  useEffect(() => {
    fetchCourseFiles();
  }, [courseId , fetchCourseFiles]);

  const openSheet = useCallback(() => {
    fetchCourseFiles();
    sheetRef.current?.expand();
  }, [fetchCourseFiles]);

  return (
    <>
      <View className="flex-1">
        <Text
          className="text-lg font-bold mb-4"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          Topic Quizzes
        </Text>

        {topicQuizzes.length > 0 ? (
          <FlatList
            scrollEnabled={false}
            data={topicQuizzes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="p-4 rounded-xl mb-3"
                style={{
                  backgroundColor: isDark
                    ? `${colors.primaryDark}80`
                    : colors.white,
                }}
                onPress={() => router.push(`/quiz/${item.id}`)}
              >
                <Text
                  className="font-medium mb-1"
                  style={{ color: isDark ? colors.offwhite : colors.dark }}
                >
                  {item.title}
                </Text>
                <Text
                  style={{
                    color: isDark ? `${colors.offwhite}80` : `${colors.dark}80`,
                  }}
                >
                  {item.questions} questions • {item.date}
                </Text>
              </TouchableOpacity>
            )}
          />
        ) : (
          <View className="items-center py-8">
            <Ionicons
              name="document-text-outline"
              size={48}
              color={colors.primary}
              style={{ opacity: 0.5, marginBottom: 12 }}
            />
            <Text
              className="text-center"
              style={{ color: isDark ? colors.offwhite : colors.dark }}
            >
              No quizzes generated yet. Upload files and generate quizzes based
              on your materials.
            </Text>
            <TouchableOpacity
              className="mt-4 px-6 py-2 rounded-full"
              style={{ backgroundColor: colors.primary }}
              onPress={openSheet}
            >
              <Text className="font-medium" style={{ color: colors.white }}>
                Generate Quiz
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{
          backgroundColor: isDark ? colors.primaryDark : colors.white,
        }}
      >
        <BottomSheetView>
          <View className="p-4">
            <Text
              className="text-base font-semibold mb-3"
              style={{ color: isDark ? colors.offwhite : colors.dark }}
            >
              Select a file to generate quiz
            </Text>

            <FlatList
              scrollEnabled={false}
              data={courseFiles}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="p-4 mb-2 rounded-xl"
                  style={{
                    backgroundColor: isDark ? `${colors.dark}80` : "#f2f2f2",
                  }}
                  onPress={() => {
                    if (!item.url) return alert("File URL is missing.");

                    sheetRef.current?.close();
                    router.push({
                      pathname: `/TopicQuizzes/${courseId}`,
                      params: {
                        fileId: item.id,
                        fileName: item.name,
                        fileUrl: item.url,
                      },
                    });
                  }}
                >
                  <Text
                    className="font-medium"
                    style={{ color: isDark ? colors.offwhite : colors.dark }}
                  >
                    {item.name}
                  </Text>
                  <Text
                    className="text-xs mt-1"
                    style={{ color: isDark ? "#ccc" : "#666" }}
                  >
                    {item.type} • {item.size}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </BottomSheetView>
      </BottomSheet>
    </>
  );
};

export default InCourseTopicQuizzes;
