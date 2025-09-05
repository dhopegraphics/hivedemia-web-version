import { useCallback, useRef, useState } from "react";

// Web-compatible animation utility
const webAnimated = {
  Value: class {
    constructor(public value: number) {}
    setValue(value: number) {
      this.value = value;
    }
  },
  timing: (value: any, config: any) => ({
    start: (callback?: () => void) => {
      // Simple web animation fallback
      setTimeout(() => {
        value.setValue(config.toValue);
        callback?.();
      }, config.duration || 250);
    },
  }),
};

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
  selectionBarAnim: any; // Web animation value
}

/**
 * Hook for managing course selection state and animations
 */
export const useSelectionManager = (): UseSelectionManagerReturn => {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(
    new Set()
  );
  const selectionBarAnim = useRef(new webAnimated.Value(-100)).current;

  const enterSelectionMode = useCallback(() => {
    setSelectionMode(true);
    webAnimated
      .timing(selectionBarAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
      .start();
  }, [selectionBarAnim]);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedCourses(new Set());
    webAnimated
      .timing(selectionBarAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      })
      .start();
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
          webAnimated
            .timing(selectionBarAnim, {
              toValue: -100,
              duration: 300,
              useNativeDriver: true,
            })
            .start();
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
