import { create } from "zustand";
import { supabase } from "../supabase";

// Simple localStorage-based storage for web compatibility
// This provides the same interface but uses web-compatible storage
const webStorage = {
  getTopics: () => {
    try {
      const stored = localStorage.getItem("hivedemia_topics");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  setTopics: (topics) => {
    try {
      localStorage.setItem("hivedemia_topics", JSON.stringify(topics));
    } catch (error) {
      console.warn("Failed to save topics to localStorage:", error);
    }
  },

  addTopic: (topic) => {
    const topics = webStorage.getTopics();
    const newTopic = {
      id: Date.now(), // Simple ID generation
      ...topic,
      created_at: new Date().toISOString(),
    };
    topics.push(newTopic);
    webStorage.setTopics(topics);
    return newTopic;
  },

  deleteTopicsByCourse: (courseId) => {
    const topics = webStorage.getTopics();
    const filtered = topics.filter((topic) => topic.course_id !== courseId);
    webStorage.setTopics(filtered);
  },

  getTopicsByCourse: (courseId) => {
    const topics = webStorage.getTopics();
    return topics.filter((topic) => topic.course_id === courseId);
  },

  clearAllTopics: () => {
    try {
      localStorage.removeItem("hivedemia_topics");
    } catch (error) {
      console.warn("Failed to clear topics from localStorage:", error);
    }
  },
};

export const useTopicsStore = create((set, get) => ({
  topics: [],
  isLoading: false,
  error: null,

  // Initialize - just load from localStorage
  initializeDatabase: async () => {
    try {
      set({ isLoading: true });
      const topics = webStorage.getTopics();
      set({ topics, isLoading: false });
    } catch (error) {
      console.error("Error loading topics:", error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Fetch topics from local storage
  fetchLocalTopics: async (courseId = null) => {
    try {
      set({ isLoading: true });
      const allTopics = webStorage.getTopics();
      const filteredTopics = courseId
        ? allTopics.filter((topic) => topic.course_id === courseId)
        : allTopics;

      set({ topics: filteredTopics, isLoading: false });
      return filteredTopics;
    } catch (error) {
      console.error("Error fetching topics:", error);
      set({ error: error.message, isLoading: false });
      return [];
    }
  },

  // Sync topics with Supabase
  syncTopics: async (userId) => {
    try {
      set({ isLoading: true });

      // Fetch user's courses from Supabase
      const { data: courses, error: coursesError } = await supabase
        .from("course")
        .select("id")
        .eq("createdby", userId);

      if (coursesError) throw new Error(coursesError.message);
      if (!courses || courses.length === 0) {
        set({ topics: [], isLoading: false });
        return [];
      }

      const courseIds = courses.map((course) => course.id);

      // Fetch topics for these courses
      const { data: remoteTopics, error: topicsError } = await supabase
        .from("extracted_topics")
        .select("id, name, coursefile_id, course_id, created_at")
        .in("course_id", courseIds);

      if (topicsError) throw new Error(topicsError.message);

      // Clear existing topics for these courses
      for (const courseId of courseIds) {
        await db.runAsync("DELETE FROM topics WHERE course_id = ?", courseId);
      }

      // Insert fetched topics into local database
      if (remoteTopics && remoteTopics.length > 0) {
        const insertPromises = remoteTopics.map((topic) =>
          db.runAsync(
            "INSERT OR REPLACE INTO topics (id, name, coursefile_id, course_id, created_at) VALUES (?, ?, ?, ?, ?)",
            topic.id,
            topic.name,
            topic.coursefile_id,
            topic.course_id,
            topic.created_at
          )
        );

        await Promise.all(insertPromises);
      }

      // Fetch updated local topics
      const topics = await get().fetchLocalTopics();
      set({ isLoading: false });
      return topics;
    } catch (error) {
      console.error("Error syncing topics:", error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Add new topic
  addTopic: async (topic) => {
    try {
      set({ isLoading: true });
      const db = get().db || (await get().initializeDatabase());

      // Insert into local database
      const result = await db.runAsync(
        "INSERT INTO topics (id, name, coursefile_id, course_id) VALUES (?, ?, ?, ?)",
        topic.id,
        topic.name,
        topic.coursefile_id,
        topic.course_id
      );

      // Update state
      await get().fetchLocalTopics();
      set({ isLoading: false });
      return result;
    } catch (error) {
      console.error("Error adding topic:", error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Get topics by course ID
  getTopicsByCourse: async (courseId) => {
    try {
      set({ isLoading: true });
      const db = get().db || (await get().initializeDatabase());

      const topics = await db.getAllAsync(
        "SELECT * FROM topics WHERE course_id = ? ORDER BY name",
        courseId
      );

      set({ isLoading: false });
      return topics;
    } catch (error) {
      console.error("Error getting topics by course:", error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Clear all topics (useful for testing or logout)
  clearTopics: async () => {
    try {
      set({ isLoading: true });
      const db = get().db || (await get().initializeDatabase());

      await db.runAsync("DELETE FROM topics");
      set({ topics: [], isLoading: false });
    } catch (error) {
      console.error("Error clearing topics:", error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
}));
