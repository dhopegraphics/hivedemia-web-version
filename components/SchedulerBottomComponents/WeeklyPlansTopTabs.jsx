import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import RenderWeeklyFields from "./RenderWeeklyFields"; // your custom input component
import { AntDesign } from "@expo/vector-icons";

const WeeklyPlannerTabs = ({
  formData, // array of plans
  handleInputChange,
  handleDurationChange,
  scheduleType,
  plans = [],
  handleDeletePlan,
  colors,
  isDark,
  courses,
}) => {
  const [activeTab, setActiveTab] = useState("create");

  return (
    <View
      style={{ backgroundColor: isDark ? colors.darkLight : colors.white }}
      className="flex-1 px-4 pt-4 rounded-xl bg-white"
    >
      {/* Tab Buttons */}
      <View className="flex-row rounded-xl w-full h-9 flex-1   justify-around mb-4">
        <TouchableOpacity
          onPress={() => setActiveTab("create")}
          className={`${
            activeTab === "create" ? "bg-primary-100" : "bg-slate-200"
          } items-center rounded-xl justify-center  w-[50%] `}
        >
          <Text
            className={`font-semibold  ${
              activeTab === "create" ? "text-white" : "text-gray-500"
            }`}
          >
            Create Plan
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("review")}
          className={`${
            activeTab === "review" ? "bg-primary-100" : "bg-slate-200"
          } items-center rounded-xl justify-center  w-[50%] `}
        >
          <Text
            className={`font-semibold ${
              activeTab === "review" ? "text-white" : "text-gray-500"
            }`}
          >
            Plans Review
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === "create" ? (
        <ScrollView>
          <RenderWeeklyFields
            formData={formData}
            handleInputChange={handleInputChange}
            handleDurationChange={handleDurationChange}
            scheduleType={scheduleType}
            isDark={isDark}
            colors={colors}
            courses={courses}
          />
        </ScrollView>
      ) : (
        <ScrollView className="space-y-4">
          {plans.length === 0 ? (
            <Text className="text-gray-500 text-center mt-4">
              No plans added yet.
            </Text>
          ) : (
            plans.map((plan, index) => (
              <View key={index} className="bg-white rounded-lg p-4 shadow-sm">
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="text-gray-800 text-lg font-bold">
                    Plan {index + 1}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeletePlan(index)}
                    className="p-1"
                  >
                    <AntDesign name="close" size={24} color="black" />
                  </TouchableOpacity>
                </View>
                <Text className="text-gray-600">
                  Course: {plan.course || "-"}
                </Text>
                <Text className="text-gray-600">Task: {plan.task || "-"}</Text>
                <Text className="text-gray-600">Duration: {plan.duration}</Text>
                <Text className="text-gray-600">
                  Recurring: {plan.recurring ? "Yes" : "No"}
                </Text>
                <Text className="text-gray-600">
                  Description: {plan.description || "-"}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default WeeklyPlannerTabs;
