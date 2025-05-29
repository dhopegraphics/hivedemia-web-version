import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import RenderTaskFields from "./RenderTaskFields";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";

const TaskTopTabs = ({
  formData,
  handleInputChange,
  handleDurationChange,
  tasks = [],
  handleDeleteTask,
  colors,
  isDark,
}) => {
  const [activeTab, setActiveTab] = useState("create");

  return (
    <View
      style={{ backgroundColor: isDark ? colors.darkLight : colors.white }}
      className="flex-1 px-4 pt-4 rounded-xl"
    >
      <View
        style={{ backgroundColor: isDark ? colors.dark : colors.white }}
        className="flex-row items-center  rounded-lg px-4 py-3 mb-4 shadow-sm"
      >
        <MaterialIcons
          name="title"
          size={20}
          color={isDark ? colors.white : colors.dark}
          className="mr-3"
        />
        <TextInput
          placeholder="Plan Title (Topic To Focus)"
          value={formData.focus}
          onChangeText={(text) => handleInputChange("focus", text)}
          className="flex-1 dark:text-white text-gray-800"
        />
      </View>
      {/* Tab Buttons */}
      <View className="flex-row rounded-xl w-full h-9 flex-1  bg-slate-200 justify-around mb-4">
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
            Add Task
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
            Review Task
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === "create" ? (
        <ScrollView>
          <RenderTaskFields
            formData={formData}
            handleInputChange={handleInputChange}
            isDark={isDark}
            colors={colors}
            handleDurationChange={handleDurationChange}
          />
        </ScrollView>
      ) : (
        <ScrollView className="space-y-4">
          {tasks.length === 0 ? (
            <Text className="text-gray-500 text-center mt-4">
              No plans added yet.
            </Text>
          ) : (
            <>
              {/* Move Focus here */}
              <View className="bg-white rounded-lg p-4 shadow-sm">
                <Text className="text-gray-600">
                  Focus: {formData.focus || "-"}
                </Text>
              </View>

              {/* Now map over tasks */}
              {tasks.map((task, index) => (
                <View key={index} className="bg-white rounded-lg p-4 shadow-sm">
                  <View className="flex-row justify-between items-start mb-2">
                    <Text className="text-gray-800 text-lg font-bold">
                      Task {index + 1}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteTask(index)}
                      className="p-1"
                    >
                      <AntDesign name="close" size={24} color="black" />
                    </TouchableOpacity>
                  </View>
                  <Text className="text-gray-600">
                    Task: {task.title || "-"}
                  </Text>
                  <Text className="text-gray-600">
                    Duration: {task.duration}
                  </Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default TaskTopTabs;
