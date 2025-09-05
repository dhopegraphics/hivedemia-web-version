import { usePlannerStore } from "@/backend/store/plannerStore";
import { useAiSuggestionStore } from "@/backend/store/useAiSuggestionStore";
import { useToast } from "./use-toast";
import { useEffect, useRef, useState } from "react";
import {
  ExamType,
  MenuPosition,
  PlanType,
  ScheduleType,
  TaskType,
  WeeklyPlanEntryType,
} from "../types/PlannerTypes";
import {
  deletePlan,
  deleteWeeklyPlanEntry,
  getErrorMessage,
  replanSchedule,
} from "../utils/plannerUtils";

export const usePlannerScreen = () => {
  const { toast } = useToast();

  // Refs
  const bottomSheetRef = useRef<{
    expand: () => void;
    close?: () => void;
  } | null>(null);

  const editBottomSheetRef = useRef<{
    expand: () => void;
    close?: () => void;
  } | null>(null);

  const editExamBottomSheetRef = useRef<{
    expand: () => void;
    close?: () => void;
  } | null>(null);

  // State
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({
    x: 0,
    y: 0,
  });
  const [activeTab, setActiveTab] = useState<string>("today");
  const [taskToEdit, setTaskToEdit] = useState<TaskType | null>(null);
  const [examToEdit, setExamToEdit] = useState<ExamType | null>(null);

  // Store hooks
  const {
    updateTaskItem,
    updateExam,
    addExam,
    addTaskPlan,
    addWeeklyPlan,
    initPlannerTables,
    loadPlannerFromDB,
    schedules: PlannerSchedules,
    toggleTaskImportance,
  } = usePlannerStore();

  const {
    suggestion,
    loading,
    fetchSuggestion,
    loadSuggestionFromDb,
    clearSuggestion,
  } = useAiSuggestionStore();

  // Effects
  useEffect(() => {
    (async () => {
      await initPlannerTables();
      await loadPlannerFromDB();
    })();
  }, [initPlannerTables, loadPlannerFromDB]);

  useEffect(() => {
    loadSuggestionFromDb();
  }, [loadSuggestionFromDb]);

  useEffect(() => {
    if (PlannerSchedules?.tasks?.length) {
      fetchSuggestion(PlannerSchedules);
    }
  }, [PlannerSchedules, fetchSuggestion]);

  useEffect(() => {
    if (suggestion?.created_at) {
      const created = new Date(suggestion.created_at);
      const now = new Date();
      const diff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      if (diff > 2) {
        clearSuggestion();
      }
    }
  }, [suggestion, clearSuggestion]);

  // Task completion toggle
  const toggleTaskCompletion = async (
    planId: any,
    taskId: string | number | boolean | Uint8Array<ArrayBufferLike> | null
  ) => {
    const { schedules, loadPlannerFromDB } = usePlannerStore.getState();

    const plan = schedules.tasks.find(
      (p: { plan_id: any }) => p.plan_id === planId
    );
    if (!plan) return;

    const task = plan.tasks.find(
      (t: {
        task_id: string | number | boolean | Uint8Array<ArrayBufferLike> | null;
      }) => t.task_id === taskId
    );
    if (!task) return;

    const updatedCompletion = task.completed ? 0 : 1;

    try {
      const plannerDb = await SQLite.openDatabaseAsync("planner.db");
      await plannerDb.runAsync(
        `UPDATE task_items SET completed = ? WHERE task_id = ?`,
        [updatedCompletion, taskId]
      );

      const updatedTasks = plan.tasks.map(
        (t: {
          task_id:
            | string
            | number
            | boolean
            | Uint8Array<ArrayBufferLike>
            | null;
          completed: any;
        }) => (t.task_id === taskId ? { ...t, completed: !t.completed } : t)
      );

      const allCompleted = updatedTasks.every(
        (t: { completed: any }) => t.completed
      );

      if (allCompleted) {
        showToast(`You just completed ${plan.focus}`, "success", 500);
      }

      await loadPlannerFromDB();
    } catch (error) {
      console.error("Failed to toggle task:", error);
    }
  };

  // More options toggle
  const toggleMoreOptions = (
    planId: any,
    taskId: any,
    event: { nativeEvent: { pageX: any; pageY: any } }
  ) => {
    const { pageX, pageY } = event.nativeEvent;
    const task = PlannerSchedules.tasks
      .find((plan: { plan_id: any }) => plan.plan_id === planId)
      ?.tasks.find((task: { task_id: any }) => task.task_id === taskId);
    setMenuPosition({ x: pageX, y: pageY });
    if (task) {
      setSelectedTask(task);
      setIsMenuVisible(true);
    }
  };

  // Handle option selection
  const handleOptionSelect = async (option: { id: any }, task: TaskType) => {
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
        await usePlannerStore.getState().deleteTask(task.task_id, task.plan_id);
        showToast("Task deleted", "success", 500);
        setIsMenuVisible(false);
        break;
      default:
        console.log("Unknown option");
        break;
    }
  };

  // Schedule handlers
  const handleAddSchedule = () => {
    bottomSheetRef.current?.expand();
  };

  const handleScheduleCreated = (newSchedule: ScheduleType) => {
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

  // Plan management
  const handleReplanSchedule = async (plan: PlanType): Promise<void> => {
    await replanSchedule(plan);
  };

  const handlePlanDelete = async (plan: PlanType): Promise<void> => {
    Alert.alert(
      "Delete Plan?",
      `Are you sure you want to delete the plan: "${plan?.focus}"? This will remove all associated tasks.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePlan(plan);
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

  // Exam management
  const handleUpcomingExamDelete = async (examsArray: ExamType[]) => {
    if (!Array.isArray(examsArray) || examsArray.length === 0) {
      Alert.alert("No exams to delete.");
      return;
    }

    Alert.alert(
      "Delete All Exams",
      `Are you sure you want to delete all ${examsArray.length} exams?`,
      [
        { text: "Cancel", style: "cancel" },
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

  const handleExamItemDelete = async (exams: ExamType[], examId: any) => {
    const exam = exams.find((e) => e.id === examId);
    if (!exam) {
      Alert.alert("Error", "Exam not found.");
      return;
    }

    Alert.alert(
      "Delete Exam",
      `Are you sure you want to delete the exam: ${exam.course} (${exam.code})?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await usePlannerStore.getState().deleteExam(examId);
            } catch (error) {
              Alert.alert(
                "Error",
                `An error occurred while deleting the exam. ${getErrorMessage(
                  error
                )}`
              );
            }
          },
        },
      ]
    );
  };

  // Weekly plan management
  const handleWeeklyPlanItemDelete = async (entry: WeeklyPlanEntryType) => {
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
              await deleteWeeklyPlanEntry(entry.id);
            } catch (error) {
              Alert.alert(
                "Error",
                `An error occurred while deleting the task. ${getErrorMessage(
                  error
                )}`
              );
            }
          },
        },
      ]
    );
  };

  const handleFullWeeklyPlanDelete = async (weeklyPlans: any[]) => {
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

  // Update handlers
  const handleTaskUpdated = async (updatedTask: any) => {
    await updateTaskItem(updatedTask);
    setSelectedTask(null);
    setIsMenuVisible(false);
    if (editBottomSheetRef.current?.close) {
      editBottomSheetRef.current.close();
    }
    showToast("Task updated successfully", "success", 400);
  };

  const handleExamEdit = (exam: ExamType) => {
    setExamToEdit(exam);
    if (editExamBottomSheetRef.current?.expand) {
      editExamBottomSheetRef.current.expand();
    }
  };

  const handleExamUpdated = async (updatedExam: any) => {
    await updateExam(updatedExam);
    await loadPlannerFromDB();
    setExamToEdit(null);
    if (editExamBottomSheetRef.current?.close) {
      editExamBottomSheetRef.current.close();
    }
    showToast("Exam updated successfully", "success", 400);
  };

  return {
    // Refs
    bottomSheetRef,
    editBottomSheetRef,
    editExamBottomSheetRef,

    // State
    isMenuVisible,
    setIsMenuVisible,
    selectedTask,
    menuPosition,
    activeTab,
    setActiveTab,
    taskToEdit,
    examToEdit,

    // Data
    PlannerSchedules,
    suggestion,
    loading,

    // Handlers
    toggleTaskCompletion,
    toggleMoreOptions,
    handleOptionSelect,
    handleAddSchedule,
    handleScheduleCreated,
    handleReplanSchedule,
    handlePlanDelete,
    handleUpcomingExamDelete,
    handleExamItemDelete,
    handleWeeklyPlanItemDelete,
    handleFullWeeklyPlanDelete,
    handleTaskUpdated,
    handleExamEdit,
    handleExamUpdated,
  };
};
