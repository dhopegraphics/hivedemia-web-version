import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { useColorScheme } from "nativewind";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import TabsPublicHeader from "@/components/TabsPublicHeader";
import CourseStatsOverview from "@/components/CourseStatsOverview";
import CoursePlusFilesCard from "@/components/CoursePlusFilesCard";
import { colors } from "@/constants/Colors";
import { useCourseStore } from "@/backend/store/useCourseStore";

const StudyVault = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const [fetchError, setFetchError] = useState(null);
  const [refreshing, setRefreshing] = useState(false); // State for pull-to-refresh
  const [searchQuery, setSearchQuery] = useState("");
  // Fetch from local cache first
  const { courses } = useCourseStore();

  const handleRefresh = async () => {
    setRefreshing(true);
    await useCourseStore.getState().attachFileCountsToCourses();
    setRefreshing(false);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setFetchError(null); // Reset error before loading
        await useCourseStore.getState().initCourseTable();
        await useCourseStore.getState().loadLocalCourses();
        await useCourseStore.getState().syncFromSupabaseToLocal();
        await useCourseStore.getState().attachFileCountsToCourses();
      } catch (err) {
        setFetchError("Failed to load courses. Please try again.");
        setFetchError("Course loading error:", err);
      }
    };

    load();
  }, []);

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: isDark ? colors.dark : colors.light }}
    >
      <TabsPublicHeader
        HeaderName={"Study Place"}
        isDark={isDark}
        colors={colors}
        onSearch={setSearchQuery}
      />

      {fetchError ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text
            style={{ color: isDark ? colors.offwhite : colors.dark }}
            className="text-center"
          >
            {fetchError}
          </Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 16 }}
          ListHeaderComponent={
            <>
              <CourseStatsOverview
                isDark={isDark}
                colors={colors}
                courses={courses}
              />
              <Text
                className="text-lg font-bold mb-4"
                style={{ color: isDark ? colors.offwhite : colors.dark }}
              >
                My Courses
              </Text>
            </>
          }
          data={filteredCourses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <CoursePlusFilesCard
              course={item}
              isDark={isDark}
              colors={colors}
              fileCount={item.fileCount}
            />
          )}
          ListFooterComponent={<View className="mb-44" />}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
        />
      )}

      <TouchableOpacity
        className="absolute bottom-36 right-6 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        style={{ backgroundColor: colors.primary }}
        onPress={() => router.push("/CourseHub/CreateCourse")}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
};

export default StudyVault;
