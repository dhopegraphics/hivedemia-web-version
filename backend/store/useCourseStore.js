// @/store/useCourseStore.ts
import { create } from "zustand";
import { coursesDb } from "@/data/localDb";
import { supabase } from "@/backend/supabase";
import uuid from "react-native-uuid";
import { useToast } from "@/context/ToastContext";

export const useCourseStore = create((set, get) => ({
  courses: [],

  initCourseTable: async () => {
    try {
      await coursesDb.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS courses (
          id TEXT PRIMARY KEY,
          createdby TEXT NOT NULL,
          title TEXT NOT NULL,
          code TEXT NOT NULL UNIQUE,
          description TEXT,
          professor TEXT,
          color TEXT DEFAULT '#00DF82',
          icon TEXT DEFAULT 'school',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP ,
          fileCount INTEGER DEFAULT 0,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (err) {
      console.error("Failed to initialize courses table:", err);
    }
  },

  loadLocalCourses: async () => {
    try {
      const rows = await coursesDb.getAllAsync(
        "SELECT * FROM courses ORDER BY created_at DESC"
      );
      set({ courses: rows });
      return rows;
    } catch (err) {
      console.error("Failed to load local courses:", err);
    }
  },

  addLocalCourse: async (course) => {
    try {
      const newId = uuid.v4();
      await coursesDb.runAsync(
        `INSERT INTO courses (id, createdby, title, code, description, professor, color, icon)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        newId,
        course.createdby,
        course.title,
        course.code,
        course.description,
        course.professor,
        course.color,
        course.icon
      );

      const newCourse = { ...course, id: newId };
      set((state) => ({ courses: [newCourse, ...state.courses] }));
      return newCourse;
    } catch (err) {
      console.error("Failed to add local course:", err);
    }
  },
  syncFromSupabaseToLocal: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: remoteCourses, error } = await supabase
        .from("course")
        .select("*") // Full data, not just 'code'
        .eq("createdby", user.id);

      if (error) {
        console.warn("Supabase fetch error:", error.message);
        return;
      }

      // Load local course codes only
      const localCourses = await coursesDb.getAllAsync(
        "SELECT code FROM courses"
      );
      const localCodes = localCourses.map((c) => c.code);

      const newCourses = remoteCourses.filter(
        (course) => !localCodes.includes(course.code)
      );

      for (const course of newCourses) {
        await coursesDb.runAsync(
          `INSERT INTO courses (id, createdby, title, code, description, professor, color, icon, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          course.id,
          course.createdby,
          course.title,
          course.code,
          course.description,
          course.professor,
          course.color ?? "#00DF82",
          course.icon ?? "school",
          course.created_at
        );
      }

      // Update state after syncing
      const all = await get().loadLocalCourses();
      return all;
    } catch (err) {
      console.error("Failed to sync from Supabase to local DB:", err);
    }
  },

  syncWithSupabase: async () => {
    try {
      const localCourses = await get().loadLocalCourses();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { showToast } = useToast();

      const { data: remoteCourses, error } = await supabase
        .from("course")
        .select("id, code")
        .eq("createdby", user.id);

      if (error) {
        console.warn("Supabase fetch error:", error.message);
        return;
      }

      const toSync = localCourses
        .filter((lc) => !remoteCourses.some((rc) => rc.code === lc.code))
        .map(
          ({
            id,
            createdby,
            title,
            code,
            description,
            professor,
            color,
            icon,
            created_at,
          }) => ({
            id,
            createdby,
            title,
            code,
            description,
            professor,
            color,
            icon,
            created_at,
          })
        );

      if (toSync.length > 0) {
        const { error: syncError } = await supabase
          .from("course")
          .insert(toSync);

        if (syncError) {
          console.error("Failed to sync courses:", syncError.message);
        } else {
          showToast(`Courses synced to online successfully `, "success", 400);
          console.log("Courses synced successfully.");
        }
      }
    } catch (err) {
      console.error("Error during sync with Supabase:", err);
    }
  },
  attachFileCountsToCourses: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const localCourses = await coursesDb.getAllAsync(
        "SELECT * FROM courses ORDER BY created_at DESC"
      );
      const courseIds = localCourses.map((course) => course.id);

      if (courseIds.length === 0) {
        set({ courses: [] });
        return;
      }

      const [
        { data: allFiles, error: filesError },
        { data: remoteUpdates, error: updatesError },
      ] = await Promise.all([
        supabase
          .from("coursefiles")
          .select("id, course_id")
          .eq("user_id", user.id)
          .in("course_id", courseIds),

        supabase
          .from("course")
          .select("id, updated_at")
          .eq("createdby", user.id)
          .in("id", courseIds),
      ]);

      if (filesError) {
        console.error("Error fetching file data:", filesError.message);
        return;
      }

      if (updatesError) {
        console.error(
          "Error fetching course update info:",
          updatesError.message
        );
        return;
      }

      // Build maps for quick lookup
      const countsMap = new Map();
      for (const file of allFiles) {
        countsMap.set(file.course_id, (countsMap.get(file.course_id) || 0) + 1);
      }

      const updatesMap = new Map();
      for (const update of remoteUpdates) {
        updatesMap.set(update.id, update.updated_at);
      }

      // Persist into local DB
      for (const courseId of courseIds) {
        const fileCount = countsMap.get(courseId) || 0;
        const updatedAt = updatesMap.get(courseId) ?? null;

        await coursesDb.runAsync(
          `UPDATE courses SET fileCount = ?, updated_at = ? WHERE id = ?`,
          fileCount,
          updatedAt,
          courseId
        );
      }

      // Refresh in-memory state
      const enrichedCourses = await get().loadLocalCourses();
      return enrichedCourses;
    } catch (err) {
      console.error(
        "Failed to attach and persist file counts and update info:",
        err
      );
    }
  },
}));
