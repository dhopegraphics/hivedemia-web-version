import { useCourseStore } from "@/backend/store/useCourseStore";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated } from "react-native";

export interface CourseDataState {
  fetchError: string | null;
  refreshing: boolean;
  searchQuery: string;
  isLoading: boolean;
  courses: any[];
  filteredCourses: any[];
}

export interface CourseDataActions {
  setSearchQuery: (query: string) => void;
  handleRefresh: () => Promise<void>;
}

export interface UseCourseDataReturn
  extends CourseDataState,
    CourseDataActions {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
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
