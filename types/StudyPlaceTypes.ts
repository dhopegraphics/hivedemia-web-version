export interface Course {
  id: string;
  title: string;
  code: string;
  professor?: string;
  description?: string;
  icon: string;
  color: string;
  documentsCount: number;
  lastUpdated: string;
  files?: File[];
}

export interface CourseFormData {
  title: string;
  code: string;
  professor: string;
  description: string;
  icon: string;
  color: string;
}

export type CourseIconType =
  | "BookOpen"
  | "Brain"
  | "GraduationCap"
  | "Calculator"
  | "Microscope"
  | "Palette"
  | "Globe"
  | "Music"
  | "Code"
  | "Heart"
  | "Beaker"
  | "Cpu"
  | "TreePine"
  | "Languages"
  | "Building"
  | "Briefcase"
  | "Camera"
  | "Gamepad2"
  | "Wrench";

export interface StudyPlaceState {
  courses: Course[];
  filteredCourses: Course[];
  searchQuery: string;
  isSelectionMode: boolean;
  selectedCourses: Set<string>;
  showCreateForm: boolean;
  showEditForm: string | null;
  showCourseDetail: string | null;
  isLoading: boolean;
  error: string | null;
  isDeletingBulk: boolean;
  uploadingFiles: Set<string>;
}

export type StudyPlaceAction =
  | { type: "SET_COURSES"; payload: Course[] }
  | { type: "SET_FILTERED_COURSES"; payload: Course[] }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SET_SELECTION_MODE"; payload: boolean }
  | { type: "SET_SELECTED_COURSES"; payload: Set<string> }
  | { type: "SET_SHOW_CREATE_FORM"; payload: boolean }
  | { type: "SET_SHOW_EDIT_FORM"; payload: string | null }
  | { type: "SET_SHOW_COURSE_DETAIL"; payload: string | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_DELETING_BULK"; payload: boolean }
  | { type: "SET_UPLOADING_FILES"; payload: Set<string> }
  | { type: "ADD_COURSE"; payload: Course }
  | { type: "UPDATE_COURSE"; payload: Course }
  | { type: "DELETE_COURSES"; payload: string[] }
  | {
      type: "UPDATE_COURSE_DOCUMENTS";
      payload: { courseId: string; count: number };
    };
