import { Course, CourseFormData } from "@/types/StudyPlaceTypes";
import { COURSE_COLORS } from "./constants";

export const createCourse = (formData: CourseFormData): Course => {
  return {
    id: Date.now().toString(),
    title: formData.title,
    code: formData.code,
    professor: formData.professor,
    description: formData.description,
    icon: formData.icon,
    color: formData.color,
    documentsCount: 0,
    lastUpdated: "Just now",
  };
};

export const updateCourse = (
  existingCourse: Course,
  formData: CourseFormData
): Course => {
  return {
    ...existingCourse,
    title: formData.title,
    code: formData.code,
    professor: formData.professor,
    description: formData.description,
    icon: formData.icon,
    color: formData.color,
    lastUpdated: "Just now",
  };
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

export const simulateFileUpload = async (
  courseId: string,
  fileCount: number,
  onProgress: (courseId: string) => void,
  onComplete: (courseId: string, count: number) => void
): Promise<void> => {
  onProgress(courseId);

  // Simulate upload delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

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

  onComplete(selectedCourseIds);
};
