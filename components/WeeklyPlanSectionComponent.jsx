import { Ionicons } from "@expo/vector-icons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import React from "react";
import { SectionList, Text, TouchableOpacity, View } from "react-native";

const WeeklyPlanSectionComponent = ({
  weeklyPlan,
  isDark,
  colors,
  handleFullWeeklyPlanDelete,
  WeeklyPlanItemDelete,
}) => {
  if (!weeklyPlan || weeklyPlan.length === 0) {
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
          No Weekly Plan
        </Text>
      </View>
    );
  }

  const getDurationDisplay = (duration) => {
    try {
      // If it's already a formatted string like "15h 50m", just return it
      if (typeof duration === "string" && duration.match(/^\d+h \d+m$/)) {
        return duration;
      }

      const date = duration instanceof Date ? duration : new Date(duration);

      if (isNaN(date.getTime())) {
        return "Invalid duration";
      }

      const hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();

      return `${hours > 0 ? `${hours}h ` : ""}${minutes}m`;
    } catch (err) {
      return `Invalid duration ${err.message}`;
    }
  };
  return (
    <View className="mb-16">
      <Text
        className="text-lg font-bold mb-4"
        style={{ color: isDark ? colors.offwhite : colors.dark }}
      >
        Weekly Study Plan
      </Text>

      <SectionList
        scrollEnabled={false}
        className="mb-6 rounded-xl overflow-hidden"
        sections={weeklyPlan}
        keyExtractor={(item) => item?.id.toString()}
        renderItem={({ item }) => (
          <View
            className="p-4"
            style={{
              backgroundColor: isDark
                ? `${colors.primaryDark}80`
                : colors.white,
              borderBottomWidth: 1,
              borderBottomColor: isDark
                ? `${colors.primary}20`
                : `${colors.primary}10`,
            }}
          >
            <View className="flex-row justify-between">
              <Text
                className="font-medium"
                style={{ color: isDark ? colors.offwhite : colors.dark }}
              >
                {item?.course}
              </Text>
              <Text
                style={{
                  color: isDark ? `${colors.offwhite}80` : `${colors.dark}80`,
                }}
              >
                {getDurationDisplay(item?.duration)}
              </Text>
            </View>
            <View className="flex-row pt-3 justify-between">
              <Text
                style={{
                  color: isDark ? `${colors.offwhite}80` : `${colors.dark}80`,
                }}
              >
                {item?.task}
              </Text>
              <View>
                <TouchableOpacity
                  onPress={() => WeeklyPlanItemDelete(item, item.id)}
                >
                  <FontAwesome5
                    name="trash"
                    size={14}
                    color={isDark ? colors.primary : colors.offwhite}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        renderSectionHeader={({ section }) => (
          <View
            className="p-3 flex-row justify-between"
            style={{
              backgroundColor: isDark ? colors.primaryDark : colors.primary,
            }}
          >
            <Text className="font-bold" style={{ color: colors.white }}>
              {section.title}
            </Text>
        
            <TouchableOpacity
              onPress={() => handleFullWeeklyPlanDelete(section.data)}
              className="dark:bg-secondary-100 px-2 py-0.5 rounded-md"
            >
              <Text className="dark:text-primary-100 text-black">
                Delete Full Plan
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <View className="mb-16" />
    </View>
  );
};

export default WeeklyPlanSectionComponent;
