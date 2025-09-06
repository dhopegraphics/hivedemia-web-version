import { useReducer, useEffect } from "react";
import {
  CourseFormData,
  StudyPlaceState,
  StudyPlaceAction,
} from "@/types/StudyPlaceTypes";
import {
  createCourse,
  updateCourse,
  filterCourses,
  simulateFileUpload,
  simulateBulkDelete,
} from "@/utils/studyplace/courseUtils";
import { generateMockCourses } from "@/utils/studyplace/helpers";

// Components
import StudyPlaceHeader from "./StudyPlaceHeader";
import StatsOverview from "./StatsOverview";
import SelectionBar from "./SelectionBar";
import CourseCard from "./CourseCard";
import CourseForm from "./CourseForm";
import CourseDetail from "./CourseDetail";
import EmptyState from "./EmptyState";
import LoadingState from "./LoadingState";
import BulkDeleteOverlay from "./BulkDeleteOverlay";

const initialState: StudyPlaceState = {
  courses: [],
  filteredCourses: [],
  searchQuery: "",
  isSelectionMode: false,
  selectedCourses: new Set(),
  showCreateForm: false,
  showEditForm: null,
  showCourseDetail: null,
  isLoading: true,
  error: null,
  isDeletingBulk: false,
  uploadingFiles: new Set(),
};

function studyPlaceReducer(
  state: StudyPlaceState,
  action: StudyPlaceAction
): StudyPlaceState {
  switch (action.type) {
    case "SET_COURSES":
      return { ...state, courses: action.payload, isLoading: false };
    case "SET_FILTERED_COURSES":
      return { ...state, filteredCourses: action.payload };
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };
    case "SET_SELECTION_MODE":
      return {
        ...state,
        isSelectionMode: action.payload,
        selectedCourses: action.payload ? state.selectedCourses : new Set(),
      };
    case "SET_SELECTED_COURSES":
      return { ...state, selectedCourses: action.payload };
    case "SET_SHOW_CREATE_FORM":
      return { ...state, showCreateForm: action.payload };
    case "SET_SHOW_EDIT_FORM":
      return { ...state, showEditForm: action.payload };
    case "SET_SHOW_COURSE_DETAIL":
      return { ...state, showCourseDetail: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_DELETING_BULK":
      return { ...state, isDeletingBulk: action.payload };
    case "SET_UPLOADING_FILES":
      return { ...state, uploadingFiles: action.payload };
    default:
      return state;
  }
}

export default function StudyPlace() {
  const [state, dispatch] = useReducer(studyPlaceReducer, initialState);

  // Load initial data
  useEffect(() => {
    const loadCourses = async () => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const mockCourses = generateMockCourses();
        dispatch({ type: "SET_COURSES", payload: mockCourses });
        dispatch({ type: "SET_FILTERED_COURSES", payload: mockCourses });
      } catch {
        dispatch({ type: "SET_ERROR", payload: "Failed to load courses" });
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };
    loadCourses();
  }, []);

  // Filter courses when search query changes
  useEffect(() => {
    const filtered = filterCourses(state.courses, state.searchQuery);
    dispatch({ type: "SET_FILTERED_COURSES", payload: filtered });
  }, [state.courses, state.searchQuery]);

  // Handlers
  const handleSearch = (query: string) => {
    dispatch({ type: "SET_SEARCH_QUERY", payload: query });
  };

  const handleCreateCourse = async (formData: CourseFormData) => {
    try {
      const newCourse = await createCourse(formData);
      const updatedCourses = [...state.courses, newCourse];
      dispatch({ type: "SET_COURSES", payload: updatedCourses });
      dispatch({ type: "SET_SHOW_CREATE_FORM", payload: false });
    } catch (error) {
      console.error("Failed to create course:", error);
    }
  };

  const handleUpdateCourse = async (formData: CourseFormData) => {
    if (!state.showEditForm) return;
    try {
      const existingCourse = state.courses.find(
        (c) => c.id === state.showEditForm
      );
      if (!existingCourse) return;

      const updatedCourse = updateCourse(existingCourse, formData);
      const updatedCourses = state.courses.map((course) =>
        course.id === state.showEditForm ? updatedCourse : course
      );
      dispatch({ type: "SET_COURSES", payload: updatedCourses });
      dispatch({ type: "SET_SHOW_EDIT_FORM", payload: null });
    } catch (error) {
      console.error("Failed to update course:", error);
    }
  };

  const handleCourseClick = (courseId: string) => {
    if (state.isSelectionMode) {
      const newSelected = new Set(state.selectedCourses);
      if (newSelected.has(courseId)) {
        newSelected.delete(courseId);
      } else {
        newSelected.add(courseId);
      }
      dispatch({ type: "SET_SELECTED_COURSES", payload: newSelected });
    } else {
      dispatch({ type: "SET_SHOW_COURSE_DETAIL", payload: courseId });
    }
  };

  const handleToggleSelection = () => {
    dispatch({ type: "SET_SELECTION_MODE", payload: !state.isSelectionMode });
  };

  const handleSelectAll = () => {
    const allIds = new Set(state.filteredCourses.map((course) => course.id));
    dispatch({ type: "SET_SELECTED_COURSES", payload: allIds });
  };

  const handleBulkDelete = async () => {
    dispatch({ type: "SET_DELETING_BULK", payload: true });
    try {
      await simulateBulkDelete(
        Array.from(state.selectedCourses),
        () => {}, // onProgress
        (deletedIds) => {
          // onComplete
          const remainingCourses = state.courses.filter(
            (course) => !deletedIds.includes(course.id)
          );
          dispatch({ type: "SET_COURSES", payload: remainingCourses });
          dispatch({ type: "SET_SELECTED_COURSES", payload: new Set() });
          dispatch({ type: "SET_SELECTION_MODE", payload: false });
        }
      );
    } catch (error) {
      console.error("Failed to delete courses:", error);
    } finally {
      dispatch({ type: "SET_DELETING_BULK", payload: false });
    }
  };

  const handleFileUpload = async (courseId: string, files: FileList) => {
    const newUploadingFiles = new Set(state.uploadingFiles);
    newUploadingFiles.add(courseId);
    dispatch({ type: "SET_UPLOADING_FILES", payload: newUploadingFiles });

    try {
      await simulateFileUpload(
        courseId,
        files.length,
        () => {}, // onProgress
        (id, count) => {
          // onComplete
          // Update course documents count
          const updatedCourses = state.courses.map((course) =>
            course.id === id
              ? { ...course, documentsCount: course.documentsCount + count }
              : course
          );
          dispatch({ type: "SET_COURSES", payload: updatedCourses });

          // Remove from uploading set
          const updatedUploadingFiles = new Set(state.uploadingFiles);
          updatedUploadingFiles.delete(id);
          dispatch({
            type: "SET_UPLOADING_FILES",
            payload: updatedUploadingFiles,
          });
        }
      );
    } catch (error) {
      console.error("Failed to upload files:", error);
      newUploadingFiles.delete(courseId);
      dispatch({ type: "SET_UPLOADING_FILES", payload: newUploadingFiles });
    }
  };

  const selectedCourse = state.showCourseDetail
    ? state.courses.find((c) => c.id === state.showCourseDetail)
    : null;

  const editCourse = state.showEditForm
    ? state.courses.find((c) => c.id === state.showEditForm)
    : null;

  if (state.isLoading) {
    return <LoadingState message="Loading your courses..." />;
  }

  if (state.error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500">{state.error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <StudyPlaceHeader
          searchQuery={state.searchQuery}
          onSearchChange={handleSearch}
          onCreateCourse={() =>
            dispatch({ type: "SET_SHOW_CREATE_FORM", payload: true })
          }
        />

        {/* Stats Overview */}
        <StatsOverview
          totalCourses={state.courses.length}
          totalDocuments={state.courses.reduce(
            (sum, course) => sum + course.documentsCount,
            0
          )}
        />

        {/* Selection Bar */}
        {state.isSelectionMode && (
          <SelectionBar
            selectedCount={state.selectedCourses.size}
            totalCount={state.filteredCourses.length}
            onSelectAll={handleSelectAll}
            onBulkDelete={() =>
              dispatch({ type: "SET_DELETING_BULK", payload: true })
            }
            onExitSelection={handleToggleSelection}
          />
        )}

        {/* Course Grid */}
        {state.filteredCourses.length === 0 ? (
          <EmptyState
            onCreateCourse={() =>
              dispatch({ type: "SET_SHOW_CREATE_FORM", payload: true })
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {state.filteredCourses.map((course, index) => (
              <CourseCard
                key={course.id}
                course={course}
                index={index}
                isSelectionMode={state.isSelectionMode}
                isSelected={state.selectedCourses.has(course.id)}
                isUploading={state.uploadingFiles.has(course.id)}
                onClick={() => handleCourseClick(course.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (!state.isSelectionMode) {
                    handleToggleSelection();
                    const newSelected = new Set([course.id]);
                    dispatch({
                      type: "SET_SELECTED_COURSES",
                      payload: newSelected,
                    });
                  }
                }}
              />
            ))}
          </div>
        )}

        {/* Create Course Form */}
        <CourseForm
          isOpen={state.showCreateForm}
          onClose={() =>
            dispatch({ type: "SET_SHOW_CREATE_FORM", payload: false })
          }
          onSubmit={handleCreateCourse}
        />

        {/* Edit Course Form */}
        <CourseForm
          course={editCourse || undefined}
          isOpen={!!state.showEditForm}
          onClose={() =>
            dispatch({ type: "SET_SHOW_EDIT_FORM", payload: null })
          }
          onSubmit={handleUpdateCourse}
        />

        {/* Course Detail */}
        {selectedCourse && (
          <CourseDetail
            course={selectedCourse}
            isOpen={!!state.showCourseDetail}
            onClose={() =>
              dispatch({ type: "SET_SHOW_COURSE_DETAIL", payload: null })
            }
            onEdit={() => {
              dispatch({ type: "SET_SHOW_COURSE_DETAIL", payload: null });
              dispatch({
                type: "SET_SHOW_EDIT_FORM",
                payload: selectedCourse.id,
              });
            }}
            onDelete={async () => {
              const updatedCourses = state.courses.filter(
                (c) => c.id !== selectedCourse.id
              );
              dispatch({ type: "SET_COURSES", payload: updatedCourses });
              dispatch({ type: "SET_SHOW_COURSE_DETAIL", payload: null });
            }}
            onUploadFiles={(files) =>
              handleFileUpload(selectedCourse.id, files)
            }
          />
        )}

        {/* Bulk Delete Overlay */}
        <BulkDeleteOverlay
          isVisible={state.isDeletingBulk}
          selectedCount={state.selectedCourses.size}
          isDeleting={state.isDeletingBulk}
          onConfirm={handleBulkDelete}
          onCancel={() =>
            dispatch({ type: "SET_DELETING_BULK", payload: false })
          }
        />
      </div>
    </div>
  );
}
