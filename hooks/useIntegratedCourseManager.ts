import { useState, useEffect, useCallback } from "react";
import { Course, CourseFormData } from "@/types/StudyPlaceTypes";
import {
  loadAllCourses,
  createCourse,
  updateCourse,
  deleteCourses,
  convertStoreCourseToStudyPlace,
} from "@/utils/studyplace/courseUtils";
import { useCourseStore } from "@/backend/store/useCourseStore";

export interface IntegratedCourseManager {
  // Course data
  courses: Course[];
  isLoading: boolean;
  error: string | null;

  // Course operations
  loadCourses: () => Promise<void>;
  createNewCourse: (formData: CourseFormData) => Promise<Course>;
  updateExistingCourse: (
    courseId: string,
    formData: CourseFormData
  ) => Promise<Course>;
  deleteCoursesBulk: (courseIds: string[]) => Promise<boolean>;
  refreshCourse: (courseId: string) => Promise<void>;

  // Simplified file management - individual courses can use hooks directly
  updateCourseFileCount: (courseId: string, newCount: number) => void;
}

export const useIntegratedCourseManager = (): IntegratedCourseManager => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load courses from store
  const loadCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const loadedCourses = await loadAllCourses();
      setCourses(loadedCourses);
    } catch (err) {
      console.error("Failed to load courses:", err);
      setError(err instanceof Error ? err.message : "Failed to load courses");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new course
  const createNewCourse = useCallback(
    async (formData: CourseFormData): Promise<Course> => {
      try {
        setError(null);
        const newCourse = await createCourse(formData);

        // Add to local state
        setCourses((prev) => [newCourse, ...prev]);

        return newCourse;
      } catch (err) {
        console.error("Failed to create course:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create course";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    []
  );

  // Update existing course
  const updateExistingCourse = useCallback(
    async (courseId: string, formData: CourseFormData): Promise<Course> => {
      try {
        setError(null);
        const updatedCourse = await updateCourse(courseId, formData);

        // Update local state
        setCourses((prev) =>
          prev.map((course) =>
            course.id === courseId ? updatedCourse : course
          )
        );

        return updatedCourse;
      } catch (err) {
        console.error("Failed to update course:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update course";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    []
  );

  // Delete courses in bulk
  const deleteCoursesBulk = useCallback(
    async (courseIds: string[]): Promise<boolean> => {
      try {
        setError(null);
        const success = await deleteCourses(courseIds);

        if (success) {
          // Remove from local state
          setCourses((prev) =>
            prev.filter((course) => !courseIds.includes(course.id))
          );
        }

        return success;
      } catch (err) {
        console.error("Failed to delete courses:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete courses";
        setError(errorMessage);
        return false;
      }
    },
    []
  );

  // Refresh a specific course (reload from store)
  const refreshCourse = useCallback(async (courseId: string) => {
    try {
      const storeCourse = await useCourseStore
        .getState()
        .getCourseById(courseId);
      if (storeCourse) {
        const updatedCourse = convertStoreCourseToStudyPlace(storeCourse);
        setCourses((prev) =>
          prev.map((course) =>
            course.id === courseId ? updatedCourse : course
          )
        );
      }
    } catch (err) {
      console.error("Failed to refresh course:", err);
    }
  }, []);

  // Update course file count in local state
  const updateCourseFileCount = useCallback(
    (courseId: string, newCount: number) => {
      setCourses((prev) =>
        prev.map((course) =>
          course.id === courseId
            ? { ...course, documentsCount: newCount }
            : course
        )
      );
    },
    []
  );

  // Load courses on mount
  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  return {
    courses,
    isLoading,
    error,
    loadCourses,
    createNewCourse,
    updateExistingCourse,
    deleteCoursesBulk,
    refreshCourse,
    updateCourseFileCount,
  };
};
