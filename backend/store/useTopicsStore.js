import * as SQLite from "expo-sqlite";
import { create } from "zustand";
import { supabase } from "../supabase";

// SQLite database setup
const initializeDatabase = async () => {
  const db = await SQLite.openDatabaseAsync("hivedemia.db");

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      coursefile_id INTEGER NOT NULL,
      course_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_topics_course_id ON topics(course_id);
  `);

  return db;
};

export const useTopicsStore = create((set, get) => ({
  topics: [],
  isLoading: false,
  error: null,
  db: null,

  // Initialize database
  initializeDatabase: async () => {
    try {
      set({ isLoading: true });
      const database = await initializeDatabase();
      set({ db: database, isLoading: false });
      return database;
    } catch (error) {
      console.error("Error initializing topics database:", error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Fetch topics from local database
  fetchLocalTopics: async (courseId = null) => {
    try {
      set({ isLoading: true });
      const db = get().db || (await get().initializeDatabase());

      let query = "SELECT * FROM topics";
      let params = [];

      if (courseId) {
        query += " WHERE course_id = ?";
        params.push(courseId);
      }

      query += " ORDER BY name";

      const topics = await db.getAllAsync(query, params);
      set({ topics, isLoading: false });
      return topics;
    } catch (error) {
      console.error("Error fetching local topics:", error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Sync topics with Supabase
  syncTopics: async (userId) => {
    try {
      set({ isLoading: true });
      const db = get().db || (await get().initializeDatabase());

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
