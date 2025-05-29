import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { colors } from "@/constants/Colors";

const EditTaskBottomSheet = ({
  bottomSheetRef,
  taskToEdit,
  onTaskUpdated,
  isDark,
}) => {
  const [editFormData, setEditFormData] = useState({
    title: "",
    duration: new Date(),
    important: false,
  });

  const [showDurationPicker, setShowDurationPicker] = useState(false);

  // Update form when taskToEdit changes
  useEffect(() => {
    if (taskToEdit) {
      // Parse duration string into a Date object (e.g., "1h 30m" -> Date)
      const durationParts = taskToEdit.duration.match(/(\d+)h\s*(\d+)m/);
      let durationDate = new Date();

      if (durationParts) {
        const hours = parseInt(durationParts[1]) || 0;
        const minutes = parseInt(durationParts[2]) || 0;
        durationDate.setHours(hours, minutes, 0, 0);
      }

      setEditFormData({
        title: taskToEdit.title || "",
        duration: durationDate,
        important: taskToEdit.important || false,
      });
    }
  }, [taskToEdit]);

  const handleInputChange = (field, value) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDurationChange = (event, selectedDuration) => {
    setShowDurationPicker(false);
    if (selectedDuration) {
      setEditFormData((prev) => ({ ...prev, duration: selectedDuration }));
    }
  };

  const handleUpdateTask = () => {
    if (!taskToEdit) return;

    const hours = editFormData.duration.getHours();
    const minutes = editFormData.duration.getMinutes();

    const updatedTask = {
      ...taskToEdit,
      title: editFormData.title,
      duration: `${hours}h ${minutes}m`,
      important: editFormData.important,
    };

    onTaskUpdated(updatedTask);
    bottomSheetRef.current?.close();
  };

  if (!taskToEdit) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={["60%"]}
      enablePanDownToClose
      handleStyle={{ backgroundColor: isDark ? colors.dark : colors.light }}
      handleIndicatorClassName="bg-gray-800"
    >
      <BottomSheetView
        style={{ backgroundColor: isDark ? colors.dark : colors.light }}
        className="flex-1 p-5"
      >
        <Text
          style={{ color: isDark ? colors.white : colors.dark }}
          className="text-2xl font-bold text-center mb-5"
        >
          Edit Task
        </Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Task Title */}
          <View className="mb-4">
            <Text
              style={{ color: isDark ? colors.offwhite : colors.gray }}
              className="font-medium mb-2"
            >
              Title
            </Text>
            <View
              style={{
                backgroundColor: isDark ? colors.darkLight : colors.white,
              }}
              className="flex-row items-center rounded-lg px-4 py-3 shadow-sm"
            >
              <MaterialIcons
                name="title"
                size={20}
                color={isDark ? colors.offwhite : colors.gray}
                className="mr-3"
              />
              <TextInput
                value={editFormData.title}
                onChangeText={(text) => handleInputChange("title", text)}
                placeholder="Task Title"
                className="flex-1 py-2"
                placeholderTextColor={isDark ? "#666" : "#999"}
                style={{ color: isDark ? colors.offwhite : colors.dark }}
              />
            </View>
          </View>

          {/* Task Duration */}
          <View className="mb-4">
            <Text
              style={{ color: isDark ? colors.offwhite : colors.gray }}
              className="font-medium mb-2"
            >
              Duration
            </Text>
            <View
              style={{
                backgroundColor: isDark ? colors.darkLight : colors.white,
              }}
              className="flex-row items-center rounded-lg px-4 py-3 shadow-sm"
            >
              <MaterialIcons
                name="timer"
                size={20}
                color={isDark ? colors.offwhite : colors.gray}
                className="mr-3"
              />
              <TouchableOpacity
                onPress={() => setShowDurationPicker(true)}
                className="flex-1 py-2"
              >
                <Text style={{ color: isDark ? colors.offwhite : colors.dark }}>
                  {editFormData.duration.getHours()}h{" "}
                  {editFormData.duration.getMinutes()}m
                </Text>
              </TouchableOpacity>
              {showDurationPicker && (
                <DateTimePicker
                  value={editFormData.duration}
                  mode="time"
                  display="spinner"
                  onChange={handleDurationChange}
                />
              )}
            </View>
          </View>

          {/* Important Toggle */}
          <View className="mb-4">
            <Text
              style={{ color: isDark ? colors.offwhite : colors.gray }}
              className="font-medium mb-2"
            >
              Mark as Important
            </Text>
            <TouchableOpacity
              onPress={() =>
                handleInputChange("important", !editFormData.important)
              }
              className="flex-row items-center"
            >
              <View
                className={`w-6 h-6 rounded-md mr-3 flex items-center justify-center ${
                  editFormData.important ? "bg-yellow-500" : "bg-gray-300"
                }`}
              >
                {editFormData.important && (
                  <MaterialIcons name="star" size={18} color="white" />
                )}
              </View>
              <Text style={{ color: isDark ? colors.offwhite : colors.dark }}>
                {editFormData.important ? "Important" : "Normal Priority"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View className="flex-row justify-between  pb-12 mb-6">
          <TouchableOpacity
            onPress={() => bottomSheetRef.current?.close()}
            className="flex-1 mr-2 py-4 bg-gray-50 rounded-lg border border-gray-800 items-center"
          >
            <Text className="text-gray-800 font-bold">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleUpdateTask}
            disabled={!editFormData.title.trim()}
            className={`flex-1 ml-2 py-4 rounded-lg items-center ${
              !editFormData.title.trim() ? "bg-green-300" : "bg-green-500"
            }`}
          >
            <Text className="text-white font-bold">Update Task</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default EditTaskBottomSheet;
