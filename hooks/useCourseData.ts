import { useCourseStore } from "@/backend/store/useCourseStore";
import { useCallback, useEffect, useRef, useState } from "react";

// Web-compatible animation utility (reusing from useCourseActions)
// Web-compatible animation utility
class WebAnimatedValue {
  constructor(private value: number = 0) {}

  setValue(value: number) {
    this.value = value;
  }

  timing(config: {
    toValue: number;
    duration: number;
    useNativeDriver?: boolean;
  }) {
    return {
      start: (callback?: () => void) => {
        setTimeout(() => {
          this.setValue(config.toValue);
          callback?.();
        }, config.duration);
      },
    };
  }
}

const webAnimated = {
  Value: WebAnimatedValue,

  timing: (
    animValue: WebAnimatedValue,
    config: { toValue: number; duration: number; useNativeDriver?: boolean }
  ) => ({
    start: (callback?: () => void) => {
      setTimeout(() => {
        animValue.setValue(config.toValue);
        callback?.();
      }, config.duration);
    },
  }),

  spring: (
    animValue: WebAnimatedValue,
    config: {
      toValue: number;
      tension?: number;
      friction?: number;
      useNativeDriver?: boolean;
    }
  ) => ({
    start: (callback?: () => void) => {
      setTimeout(() => {
        animValue.setValue(config.toValue);
        callback?.();
      }, 300); // Default spring duration
    },
  }),

  parallel: (
    animations: Array<{ start: (callback?: () => void) => void }>
  ) => ({
    start: (callback?: () => void) => {
      let completed = 0;
      const total = animations.length;

      animations.forEach((animation) => {
        animation.start(() => {
          completed++;
          if (completed === total) {
            callback?.();
          }
        });
      });
    },
  }),
};

export interface CourseDataState {
  fetchError: string | null;
  refreshing: boolean;
  searchQuery: string;
  isLoading: boolean;
  courses: unknown[];
  filteredCourses: unknown[];
}

export interface CourseDataActions {
  setSearchQuery: (query: string) => void;
  handleRefresh: () => Promise<void>;
}

export interface UseCourseDataReturn
  extends CourseDataState,
    CourseDataActions {
  fadeAnim: WebAnimatedValue;
  slideAnim: WebAnimatedValue;
}

/**
 * Hook for managing course data loading, filtering, and animations
 */
export const useCourseData = (): UseCourseDataReturn => {
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Animation values
  const fadeAnim = useRef(new webAnimated.Value(0)).current;
  const slideAnim = useRef(new webAnimated.Value(50)).current;

  const { courses } = useCourseStore();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await useCourseStore.getState().attachFileCountsToCourses();
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const filteredCourses = courses.filter((course: { title: string }) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const animateEntrance = useCallback(() => {
    webAnimated
      .parallel([
        webAnimated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
        }),
        webAnimated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ])
      .start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    const load = async () => {
      try {
        setFetchError(null);
        setIsLoading(true);

        await useCourseStore.getState().initCourseTable();
        await useCourseStore.getState().loadLocalCourses();
        await useCourseStore.getState().syncFromSupabaseToLocal();
        await useCourseStore.getState().attachFileCountsToCourses();

        animateEntrance();
      } catch (error) {
        setFetchError(
          "Unable to load your courses. Please check your connection and try again."
        );
        console.error("Course loading error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [animateEntrance]);

  return {
    fetchError,
    refreshing,
    searchQuery,
    isLoading,
    courses,
    filteredCourses,
    fadeAnim,
    slideAnim,
    setSearchQuery,
    handleRefresh,
  };
};
