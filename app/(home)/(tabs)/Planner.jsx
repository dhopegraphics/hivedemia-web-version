import { usePlannerStore } from "@/backend/store/plannerStore";
import { useUserStore } from "@/backend/store/useUserStore";
import EditTaskBottomSheet from "@/components/EditTaskBottomSheet";
import FloatingOptionsMenu from "@/components/FloatingOptionsMenu";
import DynamicSchedulerBottomSheet from "@/components/SchedulerBottomSheet";
import StudentCalendarViewComponent from "@/components/StudentCalendarViewComponent";
import TasksViewComponent from "@/components/TasksViewComponent";
import TodayPlanComponent from "@/components/TodayPlanComponent";
import TopTabsCustom from "@/components/TopTabsCustom";
import UpcomingExamComponent from "@/components/UpcomingExamComponent";
import WeeklyPlanSectionComponent from "@/components/WeeklyPlanSectionComponent";
import { colors } from "@/constants/Colors";
import { useToast } from "@/context/ToastContext";
import { plannerDb } from "@/data/localDb";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PlannerScreen() {
  const { showToast } = useToast();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const bottomSheetRef = useRef(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState("today");
  const editBottomSheetRef = useRef(null);
  const { updateTaskItem } = usePlannerStore();
  const { addExam, addTaskPlan, addWeeklyPlan } = usePlannerStore();
  const [taskToEdit, setTaskToEdit] = useState(null);
  const {
    initPlannerTables,
    loadPlannerFromDB,
    schedules: PlannerSchedules,
  } = usePlannerStore();
  const { toggleTaskImportance } = usePlannerStore();

  useEffect(() => {
    (async () => {
      await initPlannerTables();
      await loadPlannerFromDB();
    })();
  }, [initPlannerTables, loadPlannerFromDB]);

  const AiSuggestion = [
    {
      suggestion_id: 1,
      plan_id: 1,
      suggestion_message: [
        "Spend extra time on problems you struggled with last week",
        "Try teaching concepts to a study partner",
        "Take 5-minute breaks every 25 minutes",
      ],
    },
  ];

  const toggleTaskCompletion = async (planId, taskId) => {
    const { schedules, loadPlannerFromDB } = usePlannerStore.getState();

    // Find the plan
    const plan = schedules.tasks.find((p) => p.plan_id === planId);
    if (!plan) return;

    // Find the task
    const task = plan.tasks.find((t) => t.task_id === taskId);
    if (!task) return;

    const updatedCompletion = task.completed ? 0 : 1;

    // Update in SQLite
    try {
      await plannerDb.runAsync(
        `UPDATE task_items SET completed = ? WHERE task_id = ?`,
        [updatedCompletion, taskId]
      );

      const updatedTasks = plan.tasks.map((t) =>
        t.task_id === taskId ? { ...t, completed: !t.completed } : t
      );

      const allCompleted = updatedTasks.every((t) => t.completed);

      if (allCompleted) {
        showToast(`You just completed ${plan.focus}`, "success", 500);
      }

      // Reload everything to sync UI
      await loadPlannerFromDB();
    } catch (error) {
      console.error("Failed to toggle task:", error);
    }
  };

  const toggleMoreOptions = (planId, taskId, event) => {
    const { pageX, pageY } = event.nativeEvent;
    const task = PlannerSchedules.tasks
      .find((plan) => plan.plan_id === planId)
      ?.tasks.find((task) => task.task_id === taskId);
    setMenuPosition({ x: pageX, y: pageY });
    if (task) {
      setSelectedTask(task);
      setIsMenuVisible(true);
    }
  };

  const handleOptionSelect = async (option, task) => {
    switch (option.id) {
      case 1: // Edit
        setTaskToEdit(task);
        editBottomSheetRef.current?.expand();
        break;

      case 2: // Toggle Important
        await toggleTaskImportance(task.task_id, task.important);
        showToast(
          `Task marked as ${task.important ? "normal" : "important"}`,
          "success",
          500
        );
        setIsMenuVisible(false);
        break;

      case 3: // Delete
        // Delete the task
        await usePlannerStore.getState().deleteTask(task.task_id, task.plan_id);
        showToast("Task deleted", "success", 500); // Show a success message
        setIsMenuVisible(false); // Close the menu
        break;

      default:
        console.log("Unknown option");
        break;
    }
  };

  const handleAddSchedule = () => {
    bottomSheetRef.current?.expand();
  };

  const handleScheduleCreated = (newSchedule) => {
    switch (newSchedule.type) {
      case "exam":
        addExam(newSchedule);
        break;
      case "task":
        addTaskPlan(newSchedule);
        break;
      case "weekly":
        addWeeklyPlan(newSchedule);
        break;
    }
  };

  const ReplanSchedule = async (plan) => {
    try {
      const { profile } = useUserStore.getState();
      const user_id = profile?.user_id;
      console.log(user_id);
      if (!user_id) return;

      // Get the old plan
      const oldPlan = await plannerDb.getAllSync(
        `SELECT * FROM tasks WHERE plan_id = ?`,
        plan.plan_id
      );
      if (!oldPlan) return;

      const taskItems = await plannerDb.getAllAsync(
        `SELECT * FROM task_items WHERE plan_id = ?`,
        plan.plan_id
      );

      // Generate new plan ID and use today's date
      const newPlanId = String(Math.random());
      const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const created_at = new Date().toISOString();

      // Insert new plan
      await plannerDb.runAsync(
        `INSERT INTO tasks (plan_id, user_id, date, created_at, focus) VALUES (?, ?, ?, ?, ?)`,
        [newPlanId, user_id, today, created_at, plan.focus]
      );

      // Insert copied task items with new task IDs
      for (const task of taskItems) {
        await plannerDb.runAsync(
          `INSERT INTO task_items (task_id, plan_id, title, duration, completed, important) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            String(Math.random()),
            newPlanId,
            task.title,
            task.duration,
            0, // reset completion
            task.important ? 1 : 0,
          ]
        );
      }

      // Delete the old task items and plan
      await plannerDb.runAsync(
        `DELETE FROM task_items WHERE plan_id = ?`,
        plan.plan_id
      );
      await plannerDb.runAsync(
        `DELETE FROM tasks WHERE plan_id = ?`,
        plan.plan_id
      );

      // Refresh
      await usePlannerStore.getState().loadPlannerFromDB();
      console.log("Re-planned schedule successfully.");
    } catch (err) {
      console.error("Error replanning schedule:", err);
    }
  };

  const handlePlanDelete = async (plan) => {
    Alert.alert(
      "Delete Plan?",
      `Are you sure you want to delete the plan: "${plan?.focus}"? This will remove all associated tasks.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await plannerDb.runAsync(
                `DELETE FROM task_items WHERE plan_id = ?`,
                plan.plan_id
              );
              await plannerDb.runAsync(
                `DELETE FROM tasks WHERE plan_id = ?`,
                plan.plan_id
              );
              await usePlannerStore.getState().loadPlannerFromDB();
              showToast(
                `Plan "${plan.focus}" deleted successfully`,
                "success",
                400
              );
            } catch (err) {
              console.error("Failed to delete plan:", err);
              showToast("Error deleting plan", "error", 500);
            }
          },
        },
      ]
    );
  };

  const HandleUpcomingExamDelete = async (examsArray) => {
    if (!Array.isArray(examsArray) || examsArray.length === 0) {
      Alert.alert("No exams to delete.");
      return;
    }

    Alert.alert(
      "Delete All Exams",
      `Are you sure you want to delete all ${examsArray.length} exams?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              const { deleteExam, loadPlannerFromDB } =
                usePlannerStore.getState();

              for (const exam of examsArray) {
                await deleteExam(exam.id);
              }

              await loadPlannerFromDB();
              console.log("All exams deleted.");
            } catch (error) {
              console.error("Failed to delete exams:", error);
              Alert.alert(
                "Error",
                "An error occurred while deleting the exams."
              );
            }
          },
        },
      ]
    );
  };

  const handleExamItemDelete = async (exams, examId) => {
    const exam = exams.find((e) => e.id === examId);

    if (!exam) {
      Alert.alert("Error", "Exam not found.");
      return;
    }

    Alert.alert(
      "Delete Exam",
      `Are you sure you want to delete the exam: ${exam.course} (${exam.code})?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await usePlannerStore.getState().deleteExam(examId);
            } catch (error) {
              Alert.alert(
                "Error",
                `An error occurred while deleting the exam. ${error.message}`
              );
            }
          },
        },
      ]
    );
  };

  const WeeklyPlanItemDelete = async (entry, planId) => {
    Alert.alert(
      "Delete Entry",
      `Are you sure you want to delete the task: ${entry.task} (${entry.course})?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await plannerDb.runAsync(
                `DELETE FROM weekly_entries WHERE id = ?`,
                entry.id
              );
              await usePlannerStore.getState().loadPlannerFromDB();
            } catch (error) {
              Alert.alert(
                "Error",
               ` An error occurred while deleting the task.${error.message}`
              );
            }
          },
        },
      ]
    );
  };

  const handleFullWeeklyPlanDelete = async (weeklyPlans) => {
    if (!Array.isArray(weeklyPlans) || weeklyPlans.length === 0) {
      Alert.alert("No plans to delete.");
      return;
    }

    Alert.alert(
      "Delete All Plans",
      `Are you sure you want to delete all ${weeklyPlans.length} plans?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              const { deleteWeeklyPlan, loadPlannerFromDB } =
                usePlannerStore.getState();

              const uniquePlanIds = [
                ...new Set(weeklyPlans.map((entry) => entry.plan_id)),
              ];

              for (const id of uniquePlanIds) {
                await deleteWeeklyPlan(id);
              }

              await loadPlannerFromDB();
              console.log("All weekly plans deleted.");
            } catch (error) {
              console.error("Failed to delete weekly plans:", error);
              Alert.alert(
                "Error",
                "An error occurred while deleting the weekly plans."
              );
            }
          },
        },
      ]
    );
  };

  const handleTaskUpdated = async (updatedTask) => {
    await updateTaskItem(updatedTask);
    setSelectedTask(null);
    setIsMenuVisible(false);
    editBottomSheetRef.current?.close();
    showToast("Task updated successfully", "success", 400);
  };

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: isDark ? colors.dark : colors.light }}
    >
      {/* Header */}
      <View
        className="px-6 pt-20 pb-4"
        style={{
          backgroundColor: isDark ? colors.primaryDark : colors.primary,
        }}
      >
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold" style={{ color: colors.white }}>
            Exam Planner
          </Text>
          <TouchableOpacity onPress={handleAddSchedule}>
            <Ionicons name="calendar" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <TopTabsCustom activeTab={activeTab} setActiveTab={setActiveTab} />
      </View>

      {/* Main Content */}

      {activeTab === "today" ? (
        <>
          <TodayPlanComponent
            plans={PlannerSchedules?.tasks}
            onTaskToggle={toggleTaskCompletion}
            isDark={isDark}
            colors={colors}
            AiSuggestion={AiSuggestion}
            MoreOptionsToggle={toggleMoreOptions}
          />
        </>
      ) : activeTab === "schedule" ? (
        <>
          {PlannerSchedules?.exams?.length === 0 &&
          PlannerSchedules?.weeklyPlans?.length === 0 ? (
            <View className="flex-1 items-center justify-center px-6 pt-10">
              <Image
                source={require("@/assets/images/scared.png")}
                className="w-48 h-48 mb-6"
              />
              <Text className="text-center font-JakartaBold dark:text-primary-100 text-lg text-gray-500">
                No exams or weekly plans scheduled yet.
              </Text>
            </View>
          ) : (
            <ScrollView className="flex-1 px-6 pt-6">
              <UpcomingExamComponent
                colors={colors}
                isDark={isDark}
                exams={PlannerSchedules?.exams}
                HandleUpcomingExamDelete={HandleUpcomingExamDelete}
                handleExamItemDelete={handleExamItemDelete}
              />
              <WeeklyPlanSectionComponent
                colors={colors}
                isDark={isDark}
                weeklyPlan={PlannerSchedules?.weeklyPlans}
                WeeklyPlanItemDelete={WeeklyPlanItemDelete}
                handleFullWeeklyPlanDelete={handleFullWeeklyPlanDelete}
              />
            </ScrollView>
          )}
        </>
      ) : activeTab === "tasks" ? (
        <>
          <TasksViewComponent
            onTaskToggle={toggleTaskCompletion}
            plans={PlannerSchedules?.tasks}
            MoreOptionsToggle={toggleMoreOptions}
            isMenuVisible={isMenuVisible}
            setIsMenuVisible={setIsMenuVisible}
            ReplanSchedule={ReplanSchedule}
            handlePlanDelete={handlePlanDelete}
            colors={colors}
            isDark={isDark}
          />
        </>
      ) : (
        <>
          <StudentCalendarViewComponent colors={colors} isDark={isDark} />
        </>
      )}

      <FloatingOptionsMenu
        isVisible={isMenuVisible}
        task={selectedTask}
        onOptionSelect={handleOptionSelect}
        onClose={() => setIsMenuVisible(false)} // Close the options menu
        position={menuPosition}
      />
      <DynamicSchedulerBottomSheet
        bottomSheetRef={bottomSheetRef}
        onScheduleCreated={handleScheduleCreated}
      />

      <EditTaskBottomSheet
        bottomSheetRef={editBottomSheetRef}
        isDark={isDark}
        taskToEdit={taskToEdit}
        onTaskUpdated={handleTaskUpdated}
      />
    </View>
  );
}
