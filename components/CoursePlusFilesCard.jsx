import { View, Text, TouchableOpacity } from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const CoursePlusFilesCard = ({ isDark, colors, course, fileCount }) => {
  const router = useRouter();

  // Documents text (file count fetched from the coursefiles table)
  const documentsText =
    fileCount > 0
      ? `${fileCount} document${fileCount > 1 ? "s" : ""}`
      : "No documents yet";

  // Last updated text (from the course's updated_at field)
  const lastUpdatedText = course.updated_at
    ? `Last updated: ${new Date(course.updated_at).toLocaleDateString()}`
    : "Recently created";

  const HandleCoursePass = () => {
    router.push({
      pathname: `/CourseHub/${course.id}`,
      params: {
        courseTitle: course.title,
        courseCode: course.code,
        courseProfessor: course.professor,
        courseDescription: course.description,
        courseColor: course.color,
        courseIcon: course.icon,
      },
    });
  };

  return (
    <View>
      <TouchableOpacity
        className="rounded-xl p-4 mb-4"
        style={{
          backgroundColor: isDark ? `${colors.primaryDark}80` : colors.white,
          borderLeftWidth: 4,
          borderLeftColor: course.color,
        }}
        onPress={HandleCoursePass}
      >
        <View className="flex-row justify-between items-start mb-2">
          <View>
            <Text
              className="text-lg font-semibold"
              style={{ color: isDark ? colors.offwhite : colors.dark }}
            >
              {course.title}
            </Text>
            <Text
              className="text-sm"
              style={{
                color: isDark ? `${colors.offwhite}80` : `${colors.dark}80`,
              }}
            >
              {course.code}
            </Text>
          </View>
          <MaterialIcons name={course.icon} size={24} color={course.color} />
        </View>

        <View className="flex-row justify-between items-center">
          <Text
            className="text-sm"
            style={{
              color: isDark ? `${colors.offwhite}80` : `${colors.dark}80`,
            }}
          >
            {documentsText} • {lastUpdatedText}
          </Text>
          <Feather
            name="chevron-right"
            size={20}
            color={isDark ? colors.offwhite : colors.dark}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default CoursePlusFilesCard;
