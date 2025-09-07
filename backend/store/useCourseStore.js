// @/store/useCourseStore.ts
import { dbManager } from "@/backend/services/DatabaseManager";
import { supabase } from "@/backend/supabase";
import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

export const useCourseStore = create((set, get) => ({
  courses: [],
  isLoading: false,
  lastLoaded: null,

  initCourseTable: async () => {
    try {
      // Initialize IndexedDB - this replaces SQLite table creation
      await dbManager.initDB();
      console.log("✅ IndexedDB initialized for courses");
    } catch (err) {
      console.error("Failed to initialize IndexedDB:", err);
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
          // Get all courses from IndexedDB, sorted by created_at descending
          const allCourses = await db.getAllAsync("courses");
          return allCourses.sort(
            (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
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
      const newId = uuidv4();
      const newCourse = {
        id: newId,
        createdby: course.createdby,
        title: course.title,
        code: course.code,
        description: course.description || "",
        professor: course.professor || "",
        color: course.color || "#00DF82",
        icon: course.icon || "school",
        fileCount: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await dbManager.executeWithRetry("courses.db", async (db) => {
        // Add course to IndexedDB
        await db.runAsync("courses", newCourse);
      });

      set((state) => ({ courses: [newCourse, ...state.courses] }));
      return newCourse;
    } catch (err) {
      console.error("Failed to add local course:", err);
      throw err;
    }
  },

  updateLocalCourse: async (courseId, updatedData) => {
    try {
      // Get existing course first
      const existingCourse = await dbManager.executeWithRetry(
        "courses.db",
        async (db) => {
          return await db.getFirstAsync("courses", courseId);
        }
      );

      if (!existingCourse) {
        throw new Error("Course not found");
      }

      // Prepare updated course data
      const updatedCourse = {
        ...existingCourse,
        ...updatedData,
        updated_at: new Date().toISOString(),
      };

      // Update local IndexedDB
      await dbManager.executeWithRetry("courses.db", async (db) => {
        await db.runAsync("courses", updatedCourse);
      });

      // Update state
      set((state) => ({
        courses: state.courses.map((course) =>
          course.id === courseId ? updatedCourse : course
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
        return await db.getFirstAsync("courses", courseId);
      });
    } catch (err) {
      console.error("Failed to get course by ID:", err);
      return null;
    }
  },

  deleteCourses: async (courseIds) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Delete from local IndexedDB
      await dbManager.executeWithRetry("courses.db", async (db) => {
        for (const courseId of courseIds) {
          await db.deleteAsync("courses", courseId);
        }
      });

      // Delete from Supabase
      const { error: supabaseError } = await supabase
        .from("course")
        .delete()
        .in("id", courseIds)
        .eq("createdby", user.id);

      if (supabaseError) {
        console.warn("Failed to delete from Supabase:", supabaseError.message);
      }

      // Update local state
      set((state) => ({
        courses: state.courses.filter(
          (course) => !courseIds.includes(course.id)
        ),
      }));

      return true;
    } catch (err) {
      console.error("Failed to delete courses:", err);
      return false;
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
        .select("*")
        .eq("createdby", user.id);

      if (error) {
        console.warn("Supabase fetch error:", error.message);
        return;
      }

      await dbManager.executeWithRetry("courses.db", async (db) => {
        // Load local course codes only
        const localCourses = await db.getAllAsync("courses");
        const localCodes = localCourses.map((c) => c.code);

        const newCourses = remoteCourses.filter(
          (course) => !localCodes.includes(course.code)
        );

        for (const course of newCourses) {
          const courseData = {
            id: course.id,
            createdby: course.createdby,
            title: course.title,
            code: course.code,
            description: course.description || "",
            professor: course.professor || "",
            color: course.color ?? "#00DF82",
            icon: course.icon ?? "school",
            fileCount: 0,
            created_at: course.created_at,
            updated_at: course.updated_at || course.created_at,
          };

          await db.runAsync("courses", courseData);
        }
      });

      // Update state after syncing
      const all = await get().loadLocalCourses(true);
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
            updated_at,
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
            updated_at: updated_at || created_at,
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
          const courses = await db.getAllAsync("courses");
          return courses.sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
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

          // Get existing course and update it
          const existingCourse = await db.getFirstAsync("courses", courseId);
          if (existingCourse) {
            const updatedCourse = {
              ...existingCourse,
              fileCount: fileCount,
              updated_at:
                updatedAt ||
                existingCourse.updated_at ||
                existingCourse.created_at,
            };
            await db.runAsync("courses", updatedCourse);
          }
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
