import { Course, CourseFormData } from "@/types/StudyPlaceTypes";
import { COURSE_COLORS } from "./constants";
import { useCourseStore } from "@/backend/store/useCourseStore";
import { supabase } from "@/backend/supabase";

// Define store course interface
interface StoreCourse {
  id: string;
  title: string;
  code: string;
  professor?: string;
  description?: string;
  icon?: string;
  color?: string;
  fileCount?: number;
  updated_at?: string;
  created_at?: string;
  files?: File[];
}

// Convert Course store data to StudyPlace Course format
export const convertStoreCourseToStudyPlace = (
  storeCourse: StoreCourse
): Course => {
  return {
    id: storeCourse.id,
    title: storeCourse.title,
    code: storeCourse.code,
    professor: storeCourse.professor || "",
    description: storeCourse.description || "",
    icon: storeCourse.icon || "BookOpen",
    color: storeCourse.color || COURSE_COLORS[0],
    documentsCount: storeCourse.fileCount || 0,
    lastUpdated: storeCourse.updated_at
      ? new Date(storeCourse.updated_at).toLocaleDateString()
      : "Just now",
    files: storeCourse.files || [],
  };
};

// Convert StudyPlace Course to store format
export const convertStudyPlaceCourseToStore = (
  course: Course,
  userId: string
) => {
  return {
    id: course.id,
    createdby: userId,
    title: course.title,
    code: course.code,
    professor: course.professor || "",
    description: course.description || "",
    icon: course.icon,
    color: course.color,
    fileCount: course.documentsCount || 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

export const createCourse = async (
  formData: CourseFormData
): Promise<Course> => {
  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    // Create course data for store
    const courseData = {
      createdby: user.id,
      title: formData.title,
      code: formData.code,
      professor: formData.professor,
      description: formData.description,
      icon: formData.icon,
      color: formData.color,
    };

    // Add to local store
    const storeCourse = await useCourseStore
      .getState()
      .addLocalCourse(courseData);

    // Sync with Supabase
    await useCourseStore.getState().syncWithSupabase();

    // Convert to StudyPlace format
    return convertStoreCourseToStudyPlace(storeCourse);
  } catch (error) {
    console.error("Failed to create course:", error);
    throw error;
  }
};

export const updateCourse = async (
  courseId: string,
  formData: CourseFormData
): Promise<Course> => {
  try {
    const updateData = {
      title: formData.title,
      code: formData.code,
      professor: formData.professor,
      description: formData.description,
      icon: formData.icon,
      color: formData.color,
    };

    // Update in local store
    const success = await useCourseStore
      .getState()
      .updateLocalCourse(courseId, updateData);
    if (!success) {
      throw new Error("Failed to update course");
    }

    // Get updated course
    const updatedCourse = await useCourseStore
      .getState()
      .getCourseById(courseId);
    if (!updatedCourse) {
      throw new Error("Course not found after update");
    }

    // Convert to StudyPlace format
    return convertStoreCourseToStudyPlace(updatedCourse);
  } catch (error) {
    console.error("Failed to update course:", error);
    throw error;
  }
};

export const validateCourseForm = (
  formData: CourseFormData,
  courses: Course[],
  editingCourseId?: string
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!formData.title.trim()) {
    errors.title = "Course title is required";
  }

  if (!formData.code.trim()) {
    errors.code = "Course code is required";
  }

  // Check for duplicate course codes (exclude the course being edited)
  const duplicateCourse = courses.find(
    (course) => course.code === formData.code && course.id !== editingCourseId
  );

  if (duplicateCourse) {
    errors.code = "Course code already exists";
  }

  return errors;
};

export const getInitialFormData = (course?: Course): CourseFormData => {
  return {
    title: course?.title || "",
    code: course?.code || "",
    professor: course?.professor || "",
    description: course?.description || "",
    icon: course?.icon || "BookOpen",
    color: course?.color || COURSE_COLORS[0],
  };
};

export const filterCourses = (
  courses: Course[],
  searchQuery: string
): Course[] => {
  if (!searchQuery.trim()) return courses;

  const query = searchQuery.toLowerCase();
  return courses.filter(
    (course) =>
      course.title.toLowerCase().includes(query) ||
      course.code.toLowerCase().includes(query) ||
      course.professor?.toLowerCase().includes(query)
  );
};

export const getTotalDocuments = (courses: Course[]): number => {
  return courses.reduce((sum, course) => sum + course.documentsCount, 0);
};

// Load all courses from store
export const loadAllCourses = async (): Promise<Course[]> => {
  try {
    // Initialize course table if needed
    await useCourseStore.getState().initCourseTable();

    // Sync from Supabase to get latest data
    await useCourseStore.getState().syncFromSupabaseToLocal();

    // Attach file counts
    await useCourseStore.getState().attachFileCountsToCourses();

    // Load local courses
    const storeCourses = await useCourseStore.getState().loadLocalCourses(true);

    // Convert to StudyPlace format
    return storeCourses.map(convertStoreCourseToStudyPlace);
  } catch (error) {
    console.error("Failed to load courses:", error);
    return [];
  }
};

// Delete multiple courses
export const deleteCourses = async (courseIds: string[]): Promise<boolean> => {
  try {
    return await useCourseStore.getState().deleteCourses(courseIds);
  } catch (error) {
    console.error("Failed to delete courses:", error);
    return false;
  }
};

// Update course document count after file upload
export const updateCourseDocumentCount = async (
  courseId: string,
  additionalCount: number
): Promise<void> => {
  try {
    // Get current course
    const currentCourse = await useCourseStore
      .getState()
      .getCourseById(courseId);
    if (!currentCourse) {
      throw new Error("Course not found");
    }

    // Update file count
    const newFileCount = (currentCourse.fileCount || 0) + additionalCount;
    await useCourseStore.getState().updateLocalCourse(courseId, {
      fileCount: newFileCount,
    });

    console.log(`Updated course ${courseId} document count to ${newFileCount}`);
  } catch (error) {
    console.error("Failed to update document count:", error);
    throw error;
  }
};

export const simulateFileUpload = async (
  courseId: string,
  fileCount: number,
  onProgress: (courseId: string) => void,
  onComplete: (courseId: string, count: number) => void
): Promise<void> => {
  onProgress(courseId);

  // Simulate upload delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Update the actual document count
  await updateCourseDocumentCount(courseId, fileCount);

  onComplete(courseId, fileCount);
};

export const simulateBulkDelete = async (
  selectedCourseIds: string[],
  onProgress: () => void,
  onComplete: (deletedIds: string[]) => void
): Promise<void> => {
  onProgress();

  // Simulate delete delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Actually delete the courses
  await deleteCourses(selectedCourseIds);

  onComplete(selectedCourseIds);
};
