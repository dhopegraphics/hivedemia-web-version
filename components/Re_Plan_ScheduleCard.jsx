import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View, } from "react-native";

const Re_Plan_ScheduleCard = ({plan , isDark , colors , ReplanSchedule }) => {


  return (
    <View
      className="rounded-xl p-4 mb-4 shadow-slate-100"
      style={{
        backgroundColor: isDark ? `${colors.primaryDark}80` : colors.white,
      }}
    >
      <Text
        className="text-lg font-bold mb-3"
        style={{ color: isDark ? colors.offwhite : colors.dark }}
      >
        Most Recent Completed Task
      </Text>

      <View className="flex-row items-center mb-4">
        <Ionicons
          name="bulb-outline"
          size={20}
          color={colors.primary}
          className="mr-2"
        />
        <Text style={{ color: isDark ? colors.offwhite : colors.dark }}>
          <Text className="font-semibold">Today&apos;s Focus: </Text>
          {plan.focus}
        </Text>
      </View>

      <TouchableOpacity
        className="flex-row justify-center items-center py-2 rounded-md mt-2"
        style={{
          backgroundColor: isDark ? colors.primaryDark : `${colors.primary}20`,
        }}
        onPress={() => ReplanSchedule(plan)}
      >
        <Ionicons
          name="refresh"
          size={16}
          color={isDark ? colors.primary : colors.primaryDark}
        />
        <Text
          className="ml-2 font-medium"
          style={{ color: isDark ? colors.primary : colors.primaryDark }}
        >
          Re-plan Schedule
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Re_Plan_ScheduleCard;
