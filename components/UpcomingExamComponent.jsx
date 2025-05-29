import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";


const UpcomingExamComponent = ({
  exams,
  isDark,
  colors,
  HandleUpcomingExamDelete,
  handleExamItemDelete,
}) => {
  const today = new Date().toISOString().split("T")[0]; // today's date, ignoring time
  

  // Filter and sort exams
  const upcomingExams = exams
  ?.filter((exam) => exam.date >= today) // keep only today or future
  .sort((a, b) => new Date(a.date) - new Date(b.date)); // ascending order

  if (!upcomingExams || upcomingExams.length === 0) {
    return (
      <View className="items-center justify-center my-10">
        <Ionicons
          name="calendar-outline"
          size={40}
          color={isDark ? colors.offwhite : colors.dark}
        />
        <Text
          className="mt-2 text-base"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          No upcoming exams
        </Text>
      </View>
    );
  }

  return (
    <View>
      <View className="flex-row items-center justify-between mb-4">
        <Text
          className="text-lg font-bold"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          Upcoming Exams
        </Text>
        <View>
          <TouchableOpacity
            onPress={() => HandleUpcomingExamDelete(upcomingExams)}
            className="dark:bg-secondary-200 px-2 py-0.5 rounded-md"
          >
            <Text className="dark:text-primary-100 text-black">
              Delete Full Upcoming Exam
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View className="mb-6 rounded-xl overflow-hidden">
        {upcomingExams.map((exam, index) => (
          <View
            key={exam.id}
            className="p-4"
            style={{
              backgroundColor: isDark
                ? `${colors.primaryDark}80`
                : colors.white,
              borderBottomWidth: index < upcomingExams.length - 1 ? 1 : 0,
              borderBottomColor: isDark
                ? `${colors.primary}20`
                : `${colors.primary}10`,
              borderLeftWidth: 4,
              borderLeftColor:
                exam.priority === "high"
                  ? "#FF6B6B"
                  : exam.priority === "medium"
                  ? "#FFD166"
                  : "#4ECDC4",
            }}
          >
            <View className="flex-row justify-between items-start mb-1">
              <Text
                className="font-bold"
                style={{ color: isDark ? colors.offwhite : colors.dark }}
              >
                {exam.course} ({exam.code})
              </Text>
              <View
                className="px-2 py-1 rounded-full"
                style={{
                  backgroundColor:
                    exam.priority === "high"
                      ? "#FF6B6B20"
                      : exam.priority === "medium"
                      ? "#FFD16620"
                      : "#4ECDC420",
                }}
              >
                <Text
                  style={{
                    color:
                      exam.priority === "high"
                        ? "#FF6B6B"
                        : exam.priority === "medium"
                        ? "#FFD166"
                        : "#4ECDC4",
                    fontSize: 12,
                  }}
                >
                  {exam.priority.toUpperCase()}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center mb-1">
              <Ionicons
                name="calendar-outline"
                size={14}
                color={isDark ? `${colors.offwhite}80` : `${colors.dark}80`}
              />
              <Text
                className="ml-1 text-sm"
                style={{
                  color: isDark ? `${colors.offwhite}80` : `${colors.dark}80`,
                }}
              >
                {exam.date} • {exam.time}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={isDark ? `${colors.offwhite}80` : `${colors.dark}80`}
                />
                <Text
                  className="ml-1 text-sm"
                  style={{
                    color: isDark ? `${colors.offwhite}80` : `${colors.dark}80`,
                  }}
                >
                  {exam.location}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleExamItemDelete(upcomingExams, exam.id)}>
                <FontAwesome5
                  name="trash"
                  size={14}
                  color={isDark ? colors.primary : colors.dark}
                />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export default UpcomingExamComponent;