// @/store/useCourseStore.ts
import { dbManager } from "@/backend/services/DatabaseManager";
import { supabase } from "@/backend/supabase";
import uuid from "react-native-uuid";
import { create } from "zustand";

export const useCourseStore = create((set, get) => ({
  courses: [],
  isLoading: false,
  lastLoaded: null,

  initCourseTable: async () => {
    try {
      await dbManager.executeWithRetry("courses.db", async (db) => {
        await db.execAsync(`
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
      });
    } catch (err) {
      console.error("Failed to initialize courses table:", err);
    }
  },

  loadLocalCourses: async (forceReload = false) => {
    const state = get();

    // Check if courses are already loaded and not forcing reload
    if (state.courses.length > 0 && !forceReload) {
      return state.courses;
    }

    // Check if already loading to prevent duplicate requests
    if (state.isLoading) {
      return state.courses;
    }

    // Check cache validity (5 minutes)
    const now = Date.now();
    if (state.lastLoaded && now - state.lastLoaded < 300000 && !forceReload) {
      return state.courses;
    }

    try {
      set({ isLoading: true });
      const rows = await dbManager.executeWithRetry(
        "courses.db",
        async (db) => {
          return await db.getAllAsync(
            "SELECT * FROM courses ORDER BY created_at DESC"
          );
        }
      );
      set({
        courses: rows,
        isLoading: false,
        lastLoaded: now,
      });
      return rows;
    } catch (err) {
      console.error("Failed to load local courses:", err);
      set({ isLoading: false });
      return [];
    }
  },

  // Helper function to get courses efficiently
  getCoursesIfNeeded: async () => {
    const state = get();
    if (state.courses.length === 0) {
      return await state.loadLocalCourses();
    }
    return state.courses;
  },

  addLocalCourse: async (course) => {
    try {
      const newId = uuid.v4();
      await dbManager.executeWithRetry("courses.db", async (db) => {
        await db.runAsync(
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
      });

      const newCourse = { ...course, id: newId };
      set((state) => ({ courses: [newCourse, ...state.courses] }));
      return newCourse;
    } catch (err) {
      console.error("Failed to add local course:", err);
    }
  },

  updateLocalCourse: async (courseId, updatedData) => {
    try {
      // Update local database
      await dbManager.executeWithRetry("courses.db", async (db) => {
        await db.runAsync(
          `UPDATE courses SET 
           title = ?, code = ?, description = ?, professor = ?, 
           color = ?, icon = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          updatedData.title,
          updatedData.code,
          updatedData.description,
          updatedData.professor,
          updatedData.color,
          updatedData.icon,
          courseId
        );
      });

      // Update state
      set((state) => ({
        courses: state.courses.map((course) =>
          course.id === courseId
            ? {
                ...course,
                ...updatedData,
                updated_at: new Date().toISOString(),
              }
            : course
        ),
      }));

      // Sync with Supabase
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { error: supabaseError } = await supabase
          .from("course")
          .update({
            title: updatedData.title,
            code: updatedData.code,
            description: updatedData.description,
            professor: updatedData.professor,
            color: updatedData.color,
            icon: updatedData.icon,
            updated_at: new Date().toISOString(),
          })
          .eq("id", courseId)
          .eq("createdby", user.id);

        if (supabaseError) {
          console.warn(
            "Failed to sync update to Supabase:",
            supabaseError.message
          );
        }
      }

      return true;
    } catch (err) {
      console.error("Failed to update course:", err);
      return false;
    }
  },

  getCourseById: async (courseId) => {
    try {
      return await dbManager.executeWithRetry("courses.db", async (db) => {
        return await db.getFirstAsync(
          "SELECT * FROM courses WHERE id = ?",
          courseId
        );
      });
    } catch (err) {
      console.error("Failed to get course by ID:", err);
      return null;
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

      await dbManager.executeWithRetry("courses.db", async (db) => {
        // Load local course codes only
        const localCourses = await db.getAllAsync("SELECT code FROM courses");
        const localCodes = localCourses.map((c) => c.code);

        const newCourses = remoteCourses.filter(
          (course) => !localCodes.includes(course.code)
        );

        for (const course of newCourses) {
          await db.runAsync(
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
      });

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
      if (!user) {
        return;
      }

      const localCourses = await dbManager.executeWithRetry(
        "courses.db",
        async (db) => {
          return await db.getAllAsync(
            "SELECT * FROM courses ORDER BY created_at DESC"
          );
        }
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
        console.error("❌ Error fetching file data:", filesError.message);
        return;
      }

      if (updatesError) {
        console.error(
          "❌ Error fetching course update info:",
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
      await dbManager.executeWithRetry("courses.db", async (db) => {
        for (const courseId of courseIds) {
          const fileCount = countsMap.get(courseId) || 0;
          const updatedAt = updatesMap.get(courseId) ?? null;

          await db.runAsync(
            `UPDATE courses SET fileCount = ?, updated_at = ? WHERE id = ?`,
            fileCount,
            updatedAt,
            courseId
          );
        }
      });

      // Refresh in-memory state with force reload to ensure updated file counts

      const enrichedCourses = await get().loadLocalCourses(true);

      return enrichedCourses;
    } catch (err) {
      console.error(
        "Failed to attach and persist file counts and update info:",
        err
      );
    }
  },
}));
