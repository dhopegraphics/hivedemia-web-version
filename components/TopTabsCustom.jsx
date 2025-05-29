import { colors } from "@/constants/Colors";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const TopTabsCustom = ({ activeTab, setActiveTab }) => {

  return (
    <View className="flex-row justify-between mb-2">
      {["today", "schedule", "tasks", "calendar"].map((tab) => (
        <TouchableOpacity
          key={tab}
          className={`pb-2 ${activeTab === tab ? "border-b-2" : ""}`}
          style={{
            borderColor: activeTab === tab ? colors.white : "transparent",
            width: "20%",
            alignItems: "center",
          }}
          onPress={() => setActiveTab(tab)}
        >
          <Text className="font-medium" style={{ color: colors.white }}>
            {tab === "today"
              ? "Today"
              : tab === "schedule"
              ? "Schedule"
              : tab === "calendar"
              ? "Calendar"
              : "Tasks"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default TopTabsCustom;
