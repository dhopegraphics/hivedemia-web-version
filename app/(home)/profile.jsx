import { useUserStore } from "@/backend/store/useUserStore";
import CourseCard from "@/components/CourseCard";
import ProgressCircle from "@/components/ProgressCircle";
import StatCard from "@/components/StatCard";
import { colors } from "@/constants/Colors";
import { MaterialIcons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import { Image, ScrollView, Text, View } from "react-native";

const ProfileScreen = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const currentUser = useUserStore((state) => state.profile);
  const fetchUser = useUserStore((state) => state.hydrateProfile);

  useEffect(() => {
    fetchUser(); // Fetch user once when component mounts
  }, [fetchUser]);

  // Mock user data
  const user = {
    university: "Stanford University",
    major: "Computer Science",
    year: "Junior",
    studyStreak: 18,
    points: 1245,
    aiInteractions: 87,
  };

  // Mock courses
  const courses = [
    { code: "CS106B", name: "Programming Abstractions", progress: 75 },
    { code: "MATH51", name: "Linear Algebra", progress: 68 },
    { code: "PHYS41", name: "Mechanics", progress: 82 },
  ];

  // Mock study stats
  const stats = [
    { label: "Study Hours", value: "36.5", change: "+12%", icon: "book" },
    { label: "Quizzes Taken", value: "24", change: "+5", icon: "quiz" },
    { label: "Notes Created", value: "58", change: "+8", icon: "note" },
  ];

  return (
    <>
      <ScrollView
        style={{ backgroundColor: isDark ? colors.dark : colors.offwhite }}
        className={`flex-1 pt-16 }`}
      >
        {/* Header Section */}
        <View
          style={{ backgroundColor: isDark ? colors.dark : colors.offwhite }}
          className={`p-6 pb-8 shadow-sm`}
        >
          <View className="flex-row justify-between items-start mb-6">
            <View>
              <Text
                className={`text-2xl font-bold ${
                  isDark ? "text-white" : "text-gray"
                }`}
              >
                {currentUser.full_name}
              </Text>

              <Text
                className={`text-base ${
                  isDark ? "text-gray" : "text-gray-500"
                }`}
              >
                {currentUser.university_id}
              </Text>
            </View>
            <Image
              source={{ uri: currentUser?.avatar_url }}
              className="w-20 h-20 rounded-full border-2 border-green-500"
            />
          </View>

          {/* Stats Row */}
          <View className="flex-row justify-between mb-6">
            <StatCard
              icon="bonfire"
              value={user.studyStreak}
              label="Day Streak"
              color="#EF4444"
              isDark={isDark}
            />
            <StatCard
              icon="star"
              value={user.points}
              label="Points"
              color="#F59E0B"
              isDark={isDark}
            />
            <StatCard
              icon="happy-sharp"
              value={user.aiInteractions}
              label="AI Sessions"
              color="#10B981"
              isDark={isDark}
            />
          </View>
        </View>

        {/* Progress Section */}
        <View className={`p-6 mt-4 ${isDark ? "bg-gray-800" : "bg-white"}`}>
          <Text
            className={`text-xl font-bold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Course Progress
          </Text>
          <View className="flex-row justify-between mb-2">
            {courses.map((course, index) => (
              <ProgressCircle
                colors={colors}
                key={index}
                progress={course.progress}
                label={course.code}
                size={80}
                strokeWidth={8}
                isDark={isDark}
              />
            ))}
          </View>
          <View className="mt-4">
            {courses.map((course, index) => (
              <CourseCard
                key={index}
                code={course.code}
                name={course.name}
                progress={course.progress}
                isDark={isDark}
              />
            ))}
          </View>
        </View>

        {/* Study Statistics */}
        <View className={`p-6 mt-4 ${isDark ? "bg-gray-800" : "bg-white"}`}>
          <Text
            className={`text-xl font-bold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Study Statistics
          </Text>
          <View className="space-y-3">
            {stats.map((stat, index) => (
              <View
                key={index}
                className={`flex-row items-center justify-between p-4 rounded-lg ${
                  isDark ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                <View className="flex-row items-center">
                  <View
                    className={`p-2 rounded-full mr-3 ${
                      isDark ? "bg-offwhite" : "bg-white"
                    }`}
                  >
                    <MaterialIcons
                      name={stat.icon}
                      size={20}
                      color={isDark ? colors.dark : "#4B5563"}
                    />
                  </View>
                  <View>
                    <Text
                      className={`font-medium ${
                        isDark ? "text-primary-100" : "text-gray"
                      }`}
                    >
                      {stat.label}
                    </Text>
                    <Text
                      className={`text-sm ${
                        isDark ? "text-gray" : "text-gray-500"
                      }`}
                    >
                      {stat.change} from last week
                    </Text>
                  </View>
                </View>
                <Text
                  className={`text-lg font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {stat.value}
                </Text>
              </View>
            ))}
          </View>
          <View className="mb-28" />
        </View>
      </ScrollView>
    </>
  );
};

export default ProfileScreen;
