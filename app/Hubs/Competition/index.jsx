import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import CreateCompetition from "@/components/CompetitionHub/CreateCompetition";
import CompetitionHistory from "@/components/CompetitionHub/CompetitionHistory";
import OngoingCompetitions from "@/components/CompetitionHub/OngoingCompetitions";
import { useColorScheme } from "nativewind";
import { colors } from "@/constants/Colors";

const Competition = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState("ongoing");
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: isDark ? colors.dark : colors.light }}
    >
      {/* Header */}
      <View className="px-4 pt-20 pb-12 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity className="p-2" onPress={() => router.back()}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDark ? colors.offwhite : colors.dark}
            />
          </TouchableOpacity>
          <Text
            className="text-xl font-bold ml-2"
            style={{ color: isDark ? colors.offwhite : colors.dark }}
          >
            Competition
          </Text>
        </View>

        <TouchableOpacity className="p-2" onPress={() => {}}>
          <Ionicons
            name="help-circle-outline"
            size={24}
            color={isDark ? colors.offwhite : colors.dark}
          />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View
        className="flex-row px-4 gap-6 pb-2 border-b"
        style={{ borderColor: isDark ? `${colors.gray}30` : colors.lightGray }}
      >
        {["ongoing", "create", "history"].map((tab) => (
          <TouchableOpacity
            key={tab}
            className="mr-6 pb-2"
            style={{
              borderBottomWidth: 2,
              borderBottomColor:
                activeTab === tab ? colors.primary : "transparent",
            }}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              className="font-medium capitalize"
              style={{
                color:
                  activeTab === tab
                    ? isDark
                      ? colors.primary
                      : colors.primary
                    : isDark
                    ? `${colors.offwhite}70`
                    : colors.gray,
              }}
            >
              {tab === "ongoing"
                ? "Ongoing"
                : tab === "create"
                ? "Create New"
                : "History"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content Area */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {activeTab === "ongoing" && (
          <OngoingCompetitions isDark={isDark} colors={colors} />
        )}

        {activeTab === "create" && (
          <CreateCompetition isDark={isDark} colors={colors} />
        )}

        {activeTab === "history" && (
          <CompetitionHistory isDark={isDark} colors={colors} />
        )}
      </ScrollView>
    </View>
  );
};

export default Competition;
