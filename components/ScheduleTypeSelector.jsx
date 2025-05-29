import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const scheduleTypes = [
  { id: "exam", icon: "assignment", label: "Exam", color: "#EF4444" },
  { id: "task", icon: "check-circle", label: "Task", color: "#3B82F6" },
  { id: "weekly", icon: "date-range", label: "Weekly Plan", color: "#10B981" },
];

const ScheduleTypeSelector = ({ selectedType, onSelect, colors, isDark }) => {
  return (
    <View
      style={{ backgroundColor: isDark ? colors.dark : colors.light }}
      className="flex-row justify-between mb-6"
    >
      {scheduleTypes.map((type) => (
        <TouchableOpacity
          key={type.id}
          onPress={() => onSelect(type.id)}
          style={{
            backgroundColor:
              selectedType === type.id
                ? isDark
                  ? colors.deepLight // or another dark-theme highlight
                  : colors.light // or a light-theme highlight
                : "transparent",
          }}
          className="items-center p-3 rounded-xl"
        >
          <View
            className={`p-3 rounded-full mb-2`}
            style={{ backgroundColor: `${type.color}20` }}
          >
            <MaterialIcons name={type.icon} size={24} color={type.color} />
          </View>
          <Text className="font-medium text-gray-700">{type.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default ScheduleTypeSelector;
