import { CourseDeletionService } from "@/utils/courseDeletionService";
import { useRouter } from "expo-router";
import { useCallback, useRef } from "react";
import { Animated } from "react-native";
import { useCourseData } from "./useCourseData";
import { useDeletionManager } from "./useDeletionManager";
import { useSelectionManager } from "./useSelectionManager";

export interface UseCourseActionsReturn {
  // Data and state
  courseData: ReturnType<typeof useCourseData>;
  selectionManager: ReturnType<typeof useSelectionManager>;
  deletionManager: ReturnType<typeof useDeletionManager>;

  // Animation
  fabScale: Animated.Value;

  // Actions
  handleLongPress: (courseId: string) => void;
  handleCreateCourse: () => void;
  handleRetry: () => void;
  handleBulkDelete: () => void;
  handleSelectAll: () => void;
  animateFAB: () => void;
}

/**
 * Main hook that orchestrates all course-related actions and state
 */
export const useCourseActions = (): UseCourseActionsReturn => {
  const router = useRouter();
  const courseData = useCourseData();
  const selectionManager = useSelectionManager();
  const deletionManager = useDeletionManager();

  const fabScale = useRef(new Animated.Value(1)).current;

  const animateFAB = useCallback(() => {
    Animated.sequence([
      Animated.spring(fabScale, {
        toValue: 0.9,
        useNativeDriver: true,
      }),
      Animated.spring(fabScale, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fabScale]);

  const handleCreateCourse = useCallback(() => {
    animateFAB();
    router.push("/CourseHub/CreateCourse");
  }, [animateFAB, router]);

  const handleRetry = useCallback(() => {
    courseData.setSearchQuery("");
    courseData.handleRefresh();
  }, [courseData]);

  const handleSelectAll = useCallback(() => {
    const allCourseIds = courseData.filteredCourses.map((course: any) =>
      course.id.toString()
    );
    selectionManager.selectAllCourses(allCourseIds);
  }, [courseData.filteredCourses, selectionManager]);

  const handleLongPress = useCallback(
    (courseId: string) => {
      if (!selectionManager.selectionMode) {
        const course = courseData.courses.find(
          (c: any) => c.id.toString() === courseId
        );

        if (course) {
          CourseDeletionService.showSingleDeletionConfirmation(
            courseId,
            { id: courseId, title: course.title },
            {
              onSelectMultiple: () => {
                selectionManager.enterSelectionMode();
                selectionManager.toggleCourseSelection(courseId);
              },
              onDelete: () => {
                CourseDeletionService.deleteSingleCourse(
                  courseId,
                  { id: courseId, title: course.title },
                  {
                    onStartDeleting: deletionManager.startDeletingCourse,
                    onFinishDeleting: deletionManager.finishDeletingCourse,
                    onSuccess: deletionManager.showSuccessMessage,
                    onError: deletionManager.showErrorMessage,
                  }
                );
              },
            }
          );
        }
      }
    },
    [selectionManager, courseData.courses, deletionManager]
  );

  const handleBulkDelete = useCallback(() => {
    CourseDeletionService.deleteBulkCourses(
      selectionManager.selectedCourses,
      courseData.courses,
      {
        onStart: deletionManager.startBulkDeleting,
        onFinish: () => {
          deletionManager.finishBulkDeleting();
          selectionManager.exitSelectionMode();
        },
        onSuccess: deletionManager.showSuccessMessage,
        onError: deletionManager.showErrorMessage,
        singleDeletionCallbacks: {
          onStartDeleting: deletionManager.startDeletingCourse,
          onFinishDeleting: deletionManager.finishDeletingCourse,
          onSuccess: () => {}, // Handled by bulk success
          onError: deletionManager.showErrorMessage,
        },
      }
    );
  }, [selectionManager, courseData.courses, deletionManager]);

  return {
    courseData,
    selectionManager,
    deletionManager,
    fabScale,
    handleLongPress,
    handleCreateCourse,
    handleRetry,
    handleBulkDelete,
    handleSelectAll,
    animateFAB,
  };
};
