import { View, Text, Image } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";

const StudentCalendarViewComponent = ({ colors, isDark }) => {
  return (
    <View className="p-4">
      <Text
        className="text-lg font-bold mb-4"
        style={{ color: isDark ? colors.offwhite : colors.dark }}
      >
        Study Calendar
      </Text>
      <View className="items-center justify-center">
        <Image
          source={require("@/assets/images/cave_manCrying.png")}
          className="w-48 h-48 mb-6"
        />
      </View>

      <View
        className="mb-6 p-6 rounded-xl items-center justify-center"
        style={{
          backgroundColor: isDark ? `${colors.primaryDark}80` : colors.white,
          height: 300,
        }}
      >
        <Ionicons
          name="calendar"
          size={48}
          color={colors.primary}
          style={{ opacity: 0.5, marginBottom: 12 }}
        />
        <Text
          className="text-center"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          Calendar view coming soon
        </Text>
        <Text
          className="text-center mt-2"
          style={{
            color: isDark ? `${colors.offwhite}80` : `${colors.dark}80`,
          }}
        >
          We&apos;re working on an interactive calendar to visualize your study plan.
        </Text>
      </View>
    </View>
  );
};

export default StudentCalendarViewComponent;
