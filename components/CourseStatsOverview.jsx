import { View, Text } from "react-native";

const CourseStatsOverview = ({ isDark, colors, courses }) => {
  return (
    <View className="flex-row justify-between mb-8">
      <View
        className="p-4 rounded-xl"
        style={{
          backgroundColor: isDark ? colors.primaryDark : colors.primaryLight,
          width: "48%",
        }}
      >
        <Text
          className="text-sm mb-1"
          style={{ color: isDark ? colors.offwhite : colors.white }}
        >
          Total Courses
        </Text>
        <Text className="text-2xl font-bold" style={{ color: colors.white }}>
          {courses.length}
        </Text>
      </View>
      <View
        className="p-4 rounded-xl"
        style={{
          backgroundColor: isDark ? colors.primaryDark : colors.primaryLight,
          width: "48%",
        }}
      >
        <Text
          className="text-sm mb-1"
          style={{ color: isDark ? colors.offwhite : colors.white }}
        >
          Total Documents
        </Text>
        <Text className="text-2xl font-bold" style={{ color: colors.white }}>
          {courses.reduce((sum, course) => sum + (course.fileCount || 0), 0)}
        </Text>
      </View>
    </View>
  );
};

export default CourseStatsOverview;
