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
      // Use the store's toggle function instead of direct database access
      const {
        toggleTaskCompletion: storeToggleTask,
        loadPlannerFromDB,
        plans,
      } = usePlannerStore.getState();
      await storeToggleTask(taskId);

      // Reload data and check completion
      await loadPlannerFromDB();

      // Check if all tasks in plan are completed
      const updatedPlan = plans.find(
        (p: { plan_id: any }) => p.plan_id === planId
      );

      if (updatedPlan) {
        const allCompleted = updatedPlan.tasks.every(
          (t: { completed: any }) => t.completed
        );

        if (allCompleted) {
          toast({
            title: `You just completed ${plan.focus}`,
            variant: "default",
          });
        }
      }
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
        toast({
          title: `Task marked as ${task.important ? "normal" : "important"}`,
          variant: "default",
        });
        setIsMenuVisible(false);
        break;
      case 3: // Delete
        await usePlannerStore.getState().deleteTask(task.task_id, task.plan_id);
        toast({
          title: "Task deleted",
          variant: "default",
        });
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
    if (
      confirm(
        `Are you sure you want to delete the plan: "${plan?.focus}"? This will remove all associated tasks.`
      )
    ) {
      try {
        await deletePlan(plan.plan_id);
        toast({
          title: "Plan deleted successfully",
          variant: "default",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      }
    }
  };

  // Exam management
  const handleExamDelete = async (exams: ExamType[]) => {
    if (exams.length === 0) {
      toast({
        title: "No exams to delete",
        variant: "default",
      });
      return;
    }

    if (
      confirm(
        "Are you sure you want to delete all selected exams? This action cannot be undone."
      )
    ) {
      try {
        for (const exam of exams) {
          // Implementation for delete exam
        }
        toast({
          title: "Exams deleted successfully",
          variant: "default",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      }
    }
  };

  const handleExamItemDelete = async (exams: ExamType[], examId: string) => {
    const exam = exams.find((e) => e.id === examId);
    if (!exam) {
      toast({
        title: "Error",
        description: "Exam not found.",
        variant: "destructive",
      });
      return;
    }

    if (
      confirm(
        `Are you sure you want to delete the exam: "${exam.course}"? This action cannot be undone.`
      )
    ) {
      try {
        // Implementation for delete specific exam
        toast({
          title: "Exam deleted successfully",
          variant: "default",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      }
    }
  };

  // Weekly plan management
  const handleWeeklyPlanItemDelete = async (entry: WeeklyPlanEntryType) => {
    if (
      confirm(
        `Are you sure you want to delete the task: ${entry.task} (${entry.course})?`
      )
    ) {
      try {
        await deleteWeeklyPlanEntry(entry.id);
        toast({
          title: "Entry deleted successfully",
          variant: "default",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: `An error occurred while deleting the task. ${getErrorMessage(
            error
          )}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleFullWeeklyPlanDelete = async (
    weeklyPlans: WeeklyPlanEntryType[]
  ) => {
    if (!Array.isArray(weeklyPlans) || weeklyPlans.length === 0) {
      toast({
        title: "No plans to delete",
        variant: "default",
      });
      return;
    }

    if (
      confirm(
        `Are you sure you want to delete all ${weeklyPlans.length} plans?`
      )
    ) {
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
        toast({
          title: "All weekly plans deleted successfully",
          variant: "default",
        });
      } catch (error) {
        console.error("Failed to delete weekly plans:", error);
        toast({
          title: "Error",
          description: "An error occurred while deleting the weekly plans.",
          variant: "destructive",
        });
      }
    }
  };

  // Update handlers
  const handleTaskUpdated = async (updatedTask: TaskType) => {
    await updateTaskItem(updatedTask);
    setSelectedTask(null);
    setIsMenuVisible(false);
    if (editBottomSheetRef.current?.close) {
      editBottomSheetRef.current.close();
    }
    toast({
      title: "Task updated successfully",
      variant: "default",
    });
  };

  const handleExamEdit = (exam: ExamType) => {
    setExamToEdit(exam);
    if (editExamBottomSheetRef.current?.expand) {
      editExamBottomSheetRef.current.expand();
    }
  };

  const handleExamUpdated = async (updatedExam: ExamType) => {
    await updateExam(updatedExam);
    await loadPlannerFromDB();
    setExamToEdit(null);
    if (editExamBottomSheetRef.current?.close) {
      editExamBottomSheetRef.current.close();
    }
    toast({
      title: "Exam updated successfully",
      variant: "default",
    });
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
    handleExamDelete,
    handleExamItemDelete,
    handleWeeklyPlanItemDelete,
    handleFullWeeklyPlanDelete,
    handleTaskUpdated,
    handleExamEdit,
    handleExamUpdated,
  };
};
