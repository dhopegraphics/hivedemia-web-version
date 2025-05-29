import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import ScheduleTypeSelector from "./ScheduleTypeSelector";
import RenderExamFields from "./SchedulerBottomComponents/RenderExamFields";
import WeeklyPlannerTabs from "./SchedulerBottomComponents/WeeklyPlansTopTabs";
import TaskTopTabs from "./SchedulerBottomComponents/TaskTopTabs";
import { colors } from "@/constants/Colors";
import { useColorScheme } from "nativewind";
import { useCourseStore } from "@/backend/store/useCourseStore";


const DynamicSchedulerBottomSheet = ({ bottomSheetRef, onScheduleCreated }) => {
  const { colorScheme } = useColorScheme();
   const { courses } = useCourseStore();
  const isDark = colorScheme === "dark";
  const [scheduleType, setScheduleType] = useState("exam");
  const [formData, setFormData] = useState({
    // Common fields
    title: "",
    description: "",
    date: new Date(),
    time: new Date(),
    priority: "medium",

    // Exam-specific fields
    course: "",
    code: "",
    location: "",

    // Task-specific fields
    duration: new Date(),
    completed: false,
    focus: "",
    tasks: [],
    important : false, 

    // Weekly plan fields

    data: [],
    task: "",
    recurring: false,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [weeklyPlans, setWeeklyPlans] = useState([]);
  const [tasks, setTasks] = useState([]);

  const priorities = [
    { id: "high", label: "High", color: "#EF4444" },
    { id: "medium", label: "Medium", color: "#F59E0B" },
    { id: "low", label: "Low", color: "#10B981" },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData((prev) => ({ ...prev, date: selectedDate }));
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setFormData((prev) => ({ ...prev, time: selectedTime }));
    }
  };

  const handleDurationChange = (event, selectedDuration) => {
    setShowTimePicker(false);
    if (selectedDuration) {
      setFormData((prev) => ({
        ...prev,
        duration: selectedDuration, // Keep as Date
      }));
    }
  };

  const handleAddTask = () => {
    const duration = formData.duration || new Date();
    const hours = duration.getHours();
    const minutes = duration.getMinutes();

    const newTask = {
      task_id: Math.random(),
      title: formData.title,
      duration: `${hours}h ${minutes}m`, // Duration in string format
      completed: formData.completed,
    };

    setTasks((prevTasks) => [...prevTasks, newTask]);

    setFormData((prev) => ({
      ...prev,
      title: "",
      duration: new Date(),
      completed: false,
      important : false, 
      tasks: [...prev.tasks, newTask], // <-- update formData.tasks too
    }));
  };

  const handleAddWeeklyPlan = () => {
    const duration = formData.duration || new Date();
    const hours = duration.getHours();
    const minutes = duration.getMinutes();

    const newEntry = {
      id: Math.random(),
      course: formData.course,
      task: formData.task,
      duration: `${hours}h ${minutes}m`, // Duration in string format
      description: formData.description,
      recurring: formData.recurring,
    };
    setWeeklyPlans((prevPlans) => [...prevPlans, newEntry]);

    setFormData((prev) => ({
      ...prev,
      course: "",
      task: "",
      duration: new Date(),
      description: "",
      recurring: false,
    }));
  };

  const handleCreateSchedule = () => {
    let newSchedule;

    switch (scheduleType) {
      case "exam":
        newSchedule = {
          id: Math.random(),
          type: "exam",
          course: formData.course,
          code: formData.code,
          title: `${formData.course} Exam`,
          date: formData.date.toISOString().split("T")[0],
          time: formData.time.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          location: formData.location,
          priority: formData.priority,
        };
        break;
      case "task":
        newSchedule = {
          plan_id: Math.random(),
          type: "task",
          focus: formData.focus,
          created_at: new Date().toISOString(),
          date: formData.date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          tasks: tasks,
        };
        break;
      case "weekly":
        newSchedule = {
          id: Math.random(),
          type: "weekly",
          title: formData.date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          description: formData.description,
          data: weeklyPlans,
          recurring: formData.recurring,
          priority: formData.priority,
        };
        break;

      default:
        return;
    }

    onScheduleCreated(newSchedule);
    bottomSheetRef.current?.close();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: new Date(),
      time: new Date(),
      priority: "medium",
      course: "",
      code: "",
      focus: "",
      location: "",
      duration: new Date(),
      completed: false,
      weeklyPlans: [],
      data: [], // ✅ Corrected this
      tasks: [], // ✅ Corrected this
      recurring: false,
    });
    setWeeklyPlans([]);
    setTasks([]);
  };

  const handleDeletePlan = (indexToDelete) => {
    setWeeklyPlans((prevPlans) =>
      prevPlans.filter((_, index) => index !== indexToDelete)
    );
  };

  const handleDeleteTask = (indexToDelete) => {
    setTasks((prevTask) =>
      prevTask.filter((_, index) => index !== indexToDelete)
    );
  };

  const getRequiredFields = () => {
    switch (scheduleType) {
      case "exam":
        return formData.course && formData.code;
      case "task":
        return formData.title && formData.duration && formData.focus;
      case "weekly":
        return formData.task && formData.duration;
      default:
        return false;
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={["85%"]}
      enablePanDownToClose
      handleStyle={{backgroundColor: isDark ? colors.dark : colors.light}}
      handleIndicatorClassName="bg-gray-800"
    >
      <BottomSheetView
        style={{ backgroundColor: isDark ? colors.dark : colors.light }}
        className="flex-1 p-5"
      >
        <Text
        style={{color : isDark ? colors.white : colors.dark}}
        className="text-2xl font-bold  text-center mb-5">
          Create New Schedule
        </Text>

        <ScheduleTypeSelector
          selectedType={scheduleType}
          onSelect={setScheduleType}
          colors={colors}
          isDark={isDark}
        />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Common Fields */}
          <View
           style={{ backgroundColor: isDark ? colors.darkLight : colors.white }}
          className="flex-row items-center rounded-lg px-4 py-3 mb-4 shadow-sm">
            <MaterialIcons
              name="date-range"
              size={20}
              color={isDark ? colors.offwhite : colors.gray}
              className="mr-3"
            />
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="flex-1 py-2"
              
            >
              <Text
              style={{color : isDark ? colors.offwhite : colors.dark}}
              >
                {formData.date
                  ? new Date(formData.date).toLocaleDateString()
                  : "Select Date"}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={
                  formData.date instanceof Date ? formData.date : new Date()
                }
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
          </View>

          {scheduleType !== "weekly" && scheduleType !== "task" && (
            <View
            style={{ backgroundColor: isDark ? colors.darkLight : colors.white }}
            className="flex-row items-center rounded-lg px-4 py-3 mb-4 shadow-sm">
              <MaterialIcons
                name="access-time"
                size={20}
                color={isDark ? colors.offwhite : colors.gray}
                className="mr-3"
              />
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                className="flex-1 py-2"
              >
                <Text
                 style={{color : isDark ? colors.offwhite : colors.dark}}
                >
                  {formData.time.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={
                    formData.time instanceof Date ? formData.time : new Date()
                  }
                  mode="time"
                  display="default"
                  onChange={handleTimeChange}
                />
              )}
            </View>
          )}

          {/* Type-Specific Fields */}
          {scheduleType === "exam" && (
            <RenderExamFields
              formData={formData}
              handleInputChange={handleInputChange}
              isDark={isDark}
              colors={colors}
              courses={courses}
            />
          )}
          {scheduleType === "task" && (
            <>
              <TaskTopTabs
                formData={formData}
                handleInputChange={handleInputChange}
                handleDurationChange={handleDurationChange}
                handleDeleteTask={handleDeleteTask}
                tasks={tasks}
                isDark={isDark}
                colors={colors}
              />
              <TouchableOpacity
                className={`flex-1 px-4 py-2 mb-4  rounded-lg items-center ${
                  !getRequiredFields() ? "bg-gray-200" : "bg-green-500"
                }`}
                disabled={!getRequiredFields()}
                onPress={handleAddTask}
              >
                <Text className="text-white font-semibold">
                  Add Multiple Task
                </Text>
              </TouchableOpacity>
            </>
          )}
          {scheduleType === "weekly" && (
            <>
              <WeeklyPlannerTabs
                formData={formData}
                handleInputChange={handleInputChange}
                handleDurationChange={handleDurationChange}
                scheduleType={scheduleType}
                plans={weeklyPlans} // ✅ new prop
                handleDeletePlan={handleDeletePlan}
                isDark={isDark}
                colors={colors}
                courses={courses}
              />
              <TouchableOpacity
                className={`flex-1 px-4 py-2 mb-4  rounded-lg items-center ${
                  !getRequiredFields() ? "bg-gray-200" : "bg-green-500"
                }`}
                disabled={!getRequiredFields()}
                onPress={handleAddWeeklyPlan}
              >
                <Text className="text-white font-semibold">
                  Add Weekly Plan
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Priority Selection */}
          {scheduleType !== "task" && (
            <View className="mb-6">
              <Text  style={{ color: isDark ? colors.offwhite : colors.gray }} className=" font-medium mb-2">Priority:</Text>
              <View className="flex-row justify-between">
                {priorities.map((priority) => (
                  <TouchableOpacity
                    key={priority.id}
                    onPress={() => handleInputChange("priority", priority.id)}
                    className={`flex-1 mx-2 py-3 rounded-lg border-2 ${
                      formData.priority === priority.id
                        ? priority.id === "high"
                          ? "border-red-400 bg-red-50"
                          : priority.id === "medium"
                          ? "border-yellow-400 bg-yellow-50"
                          : "border-green-400 bg-green-50"
                        : "border-gray-200"
                    }`}
                  >
                    <Text
                      className={`text-center font-medium ${
                        formData.priority === priority.id
                          ? priority.id === "high"
                            ? "text-red-600"
                            : priority.id === "medium"
                            ? "text-yellow-600"
                            : "text-green-600"
                          : "text-gray-600"
                      }`}
                    >
                      {priority.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View className="flex-row  mb-[20%]  justify-between mt-auto">
          <TouchableOpacity
            onPress={() => bottomSheetRef.current?.close()}
            className="flex-1 mr-2 py-4  bg-gray-50 rounded-lg border border-gray-800 items-center"
          >
            <Text className="text-gray-800 font-bold">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCreateSchedule}
            disabled={
              (scheduleType === "weekly" && weeklyPlans.length === 0) ||
              (scheduleType === "task" && tasks.length === 0) ||
              (scheduleType !== "weekly" &&
                scheduleType !== "task" &&
                !getRequiredFields())
            }
            className={`flex-1 ml-2 py-4 rounded-lg items-center ${
              (scheduleType === "weekly" && weeklyPlans.length === 0) ||
              (scheduleType === "task" && tasks.length === 0) ||
              (scheduleType !== "weekly" &&
                scheduleType !== "task" &&
                !getRequiredFields())
                ? "bg-green-300"
                : "bg-green-500"
            }`}
          >
            <Text className="text-white font-bold">
              {scheduleType === "exam"
                ? "Schedule Exam"
                : scheduleType === "task"
                ? "Add Task"
                : "Create Plan"}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default DynamicSchedulerBottomSheet;
