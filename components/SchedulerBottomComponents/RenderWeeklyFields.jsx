import {
  View,
  Text,
  TextInput,
  Switch,
  Modal,
  TouchableOpacity,
  FlatList,
} from "react-native";
import React from "react";
import { MaterialIcons } from "@expo/vector-icons";

import DurationPicker from "../DurationPIcker";

const RenderWeeklyFields = ({
  formData,
  handleInputChange,
  handleDurationChange,
  colors,
  isDark,
  courses,
}) => {
  const [modalVisible, setModalVisible] = React.useState(false);

  const handleSelectCourse = (course) => {
    handleInputChange("course", course.title);
    handleInputChange("code", course.code);
    setModalVisible(false);
  };
  return (
    <>
      <View
        style={{ backgroundColor: isDark ? colors.dark : colors.white }}
        className="flex-row items-center rounded-lg px-4 py-3 mb-4 shadow-sm"
      >
        <MaterialIcons
          name="class"
          size={20}
          color={isDark ? colors.offwhite : colors.gray}
          className="mr-3"
        />
        <TextInput
          placeholder="Course Name"
          value={formData.course}
          onChangeText={(text) => handleInputChange("course", text)}
          className="flex-1 font-JakartaMedium"
          style={{ color: isDark ? colors.offwhite : colors.gray }}
          placeholderTextColor={isDark ? colors.offwhite : colors.gray}
        />
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <MaterialIcons
            name="arrow-drop-down-circle"
            size={24}
            color={isDark ? colors.offwhite : colors.gray}
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </View>

      <View
        style={{ backgroundColor: isDark ? colors.dark : colors.white }}
        className="flex-row items-center  rounded-lg px-4 py-3 mb-4 shadow-sm"
      >
        <MaterialIcons
          name="title"
          size={20}
          color={isDark ? colors.white : colors.gray}
          className="mr-3"
        />
        <TextInput
          placeholder="Task Message"
          value={formData.task}
          onChangeText={(text) => handleInputChange("task", text)}
          placeholderTextColor={isDark ? colors.offwhite : colors.gray}
          className="flex-1 dark:text-white text-gray-800"
        />
      </View>

      <View
        style={{ backgroundColor: isDark ? colors.dark : colors.white }}
        className="flex-row items-center rounded-lg px-4 py-3 mb-4 shadow-sm"
      >
        <MaterialIcons
          name="access-time"
          size={20}
          color={isDark ? colors.white : colors.gray}
          className="mr-3"
        />
        <DurationPicker
          duration={formData.duration}
          isDark={isDark}
          onChange={(newDate) => handleDurationChange(null, newDate)}
        />
      </View>

      <View className="flex-row items-center dark:bg-secondary-100 rounded-lg px-4 py-3 mb-4 shadow-sm">
        <MaterialIcons
          name="description"
          size={20}
          color={isDark ? colors.white : colors.dark}
          className="mr-3"
        />
        <TextInput
          placeholder="Description"
          value={formData.description}
          placeholderTextColor={isDark ? colors.offwhite : colors.dark}
          onChangeText={(text) => handleInputChange("description", text)}
          className="flex-1 dark:text-white text-gray-800"
          multiline
        />
      </View>

      <View
        style={{ backgroundColor: isDark ? colors.dark : colors.white }}
        className="flex-row items-center justify-between  rounded-lg px-4 py-3 mb-4 shadow-sm"
      >
        <Text
          style={{ color: isDark ? colors.offwhite : colors.dark }}
          className="text-gray-800"
        >
          Recurring Weekly Plan
        </Text>
        <Switch
          value={formData.recurring}
          onValueChange={(value) => handleInputChange("recurring", value)}
          trackColor={{ false: "#e5e7eb", true: "#00DF82" }}
          thumbColor={formData.recurring ? "#fff" : "#f3f4f6"}
        />
      </View>
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.3)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: isDark ? colors.darkLight : colors.white,
              borderRadius: 12,
              width: "85%",
              maxHeight: "60%",
              padding: 16,
            }}
          >
            <Text
              style={{
                color: isDark ? colors.offwhite : colors.dark,
                fontWeight: "bold",
                fontSize: 16,
                marginBottom: 12,
              }}
            >
              Select Course
            </Text>
            <FlatList
              data={courses}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectCourse(item)}
                  style={{
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? colors.dark : "#eee",
                  }}
                >
                  <Text
                    style={{
                      color: isDark ? colors.offwhite : colors.dark,
                      fontSize: 15,
                    }}
                  >
                    {item.title} ({item.code})
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{ marginTop: 16, alignSelf: "flex-end" }}
            >
              <Text style={{ color: colors.primary, fontWeight: "bold" }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default RenderWeeklyFields;
