import { useToast } from "@/context/ToastContext";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

export interface DeletionState {
  deletingCourses: Set<string>;
  bulkDeleting: boolean;
}

export interface DeletionActions {
  startDeletingCourse: (courseId: string) => void;
  finishDeletingCourse: (courseId: string) => void;
  startBulkDeleting: () => void;
  finishBulkDeleting: () => void;
  showSuccessMessage: (message: string) => void;
  showErrorMessage: (error: string) => void;
}

export interface UseDeletionManagerReturn
  extends DeletionState,
    DeletionActions {}

/**
 * Hook for managing course deletion state and feedback
 */
export const useDeletionManager = (): UseDeletionManagerReturn => {
  const [deletingCourses, setDeletingCourses] = useState<Set<string>>(
    new Set()
  );
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const { showToast } = useToast();

  const startDeletingCourse = useCallback((courseId: string) => {
    setDeletingCourses((prev) => new Set(prev).add(courseId));
  }, []);

  const finishDeletingCourse = useCallback((courseId: string) => {
    setDeletingCourses((prev) => {
      const newSet = new Set(prev);
      newSet.delete(courseId);
      return newSet;
    });
  }, []);

  const startBulkDeleting = useCallback(() => {
    setBulkDeleting(true);
  }, []);

  const finishBulkDeleting = useCallback(() => {
    setBulkDeleting(false);
  }, []);

  const showSuccessMessage = useCallback(
    (message: string) => {
      showToast(message, "error", 400);
    },
    [showToast]
  );

  const showErrorMessage = useCallback((error: string) => {
    Alert.alert("Error", error);
  }, []);

  return {
    deletingCourses,
    bulkDeleting,
    startDeletingCourse,
    finishDeletingCourse,
    startBulkDeleting,
    finishBulkDeleting,
    showSuccessMessage,
    showErrorMessage,
  };
};
