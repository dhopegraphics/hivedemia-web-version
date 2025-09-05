import { useCallback, useRef, useState } from "react";
import { Animated } from "react-native";

export interface SelectionState {
  selectionMode: boolean;
  selectedCourses: Set<string>;
}

export interface SelectionActions {
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
  toggleCourseSelection: (courseId: string) => void;
  selectAllCourses: (courseIds: string[]) => void;
  clearSelection: () => void;
}

export interface UseSelectionManagerReturn
  extends SelectionState,
    SelectionActions {
  selectionBarAnim: Animated.Value;
}

/**
 * Hook for managing course selection state and animations
 */
export const useSelectionManager = (): UseSelectionManagerReturn => {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(
    new Set()
  );
  const selectionBarAnim = useRef(new Animated.Value(-100)).current;

  const enterSelectionMode = useCallback(() => {
    setSelectionMode(true);
    Animated.timing(selectionBarAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [selectionBarAnim]);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedCourses(new Set());
    Animated.timing(selectionBarAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [selectionBarAnim]);

  const toggleCourseSelection = useCallback(
    (courseId: string) => {
      setSelectedCourses((prev) => {
        const newSelected = new Set(prev);
        if (newSelected.has(courseId)) {
          newSelected.delete(courseId);
        } else {
          newSelected.add(courseId);
        }

        // Auto-exit selection mode if no courses are selected
        if (newSelected.size === 0) {
          setSelectionMode(false);
          Animated.timing(selectionBarAnim, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }

        return newSelected;
      });
    },
    [selectionBarAnim]
  );

  const selectAllCourses = useCallback((courseIds: string[]) => {
    setSelectedCourses(new Set(courseIds));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCourses(new Set());
  }, []);

  return {
    selectionMode,
    selectedCourses,
    selectionBarAnim,
    enterSelectionMode,
    exitSelectionMode,
    toggleCourseSelection,
    selectAllCourses,
    clearSelection,
  };
};
