import { useCourseStore } from "@/backend/store/useCourseStore";
import { useUserStore } from "@/backend/store/useUserStore";
import { supabase } from "@/backend/supabase";
import * as SQLite from "expo-sqlite";
import { Alert } from "react-native";

export interface CourseToDelete {
  id: string;
  title: string;
}

export interface DeletionCallbacks {
  onStartDeleting: (courseId: string) => void;
  onFinishDeleting: (courseId: string) => void;
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
}

/**
 * Service for handling course deletion operations
 */
export class CourseDeletionService {
  /**
   * Delete a single course with all its associated data
   */
  static async deleteSingleCourse(
    courseId: string,
    course: CourseToDelete,
    callbacks: DeletionCallbacks
  ): Promise<void> {
    try {
      callbacks.onStartDeleting(courseId);

      const coursesDb = await SQLite.openDatabaseAsync("courses.db");
      const notesTakenDb = await SQLite.openDatabaseAsync("notes.db");

      // Get user
      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData?.user?.id;
      if (!user_id) throw new Error("Not authenticated");

      // Get course data for folder deletion
      const { data: courseData } = await supabase
        .from("course")
        .select("title")
        .eq("id", courseId)
        .eq("createdby", user_id)
        .single();

      // Get user profile from local store for folder structure
      let username = "user";
      try {
        const userProfile = useUserStore.getState().profile;

        if (userProfile) {
          // Try multiple fields in order of preference
          username =
            userProfile.username ||
            userProfile.full_name?.replace(/\s+/g, "_") ||
            userProfile.email?.split("@")[0] ||
            "user";
        } else {
          console.warn(
            "⚠️ No local profile found for deletion, using auth fallbacks"
          );
          // Fallback to auth user data if no local profile
          if (userData.user?.user_metadata?.username) {
            username = userData.user.user_metadata.username;
          } else if (userData.user?.email) {
            username = userData.user.email.split("@")[0];
          }
        }
      } catch (profileError) {
        console.warn(
          "⚠️ Error accessing local profile for deletion:",
          profileError
        );
        // Fallback to auth user data if local profile access fails
        if (userData.user?.user_metadata?.username) {
          username = userData.user.user_metadata.username;
        } else if (userData.user?.email) {
          username = userData.user.email.split("@")[0];
        }
      }

      // If we still have "user", try to get it from the database as a last resort
      if (username === "user") {
        try {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("username, full_name, email")
            .eq("id", user_id)
            .single();

          if (profileData) {
            username =
              profileData.username ||
              profileData.full_name?.replace(/\s+/g, "_") ||
              profileData.email?.split("@")[0] ||
              userData.user?.email?.split("@")[0] ||
              "user";
          }
        } catch (dbError) {
          console.warn("⚠️ Database profile lookup failed:", dbError);
          // Final fallback to email from auth
          if (userData.user?.email) {
            username = userData.user.email.split("@")[0];
          }
        }
      }

      // Get file metadata including Google Drive IDs
      const { data: toDelete } = await supabase
        .from("coursefiles")
        .select("id, name, google_drive_id, path")
        .eq("course_id", courseId)
        .eq("user_id", user_id);

      // Delete files from Google Drive instead of Supabase storage
      if (toDelete && toDelete.length > 0) {
        const { googleDriveAPI } = await import(
          "./googledrivefunctions/googleDriveAPI"
        );

        let deletedCount = 0;
        let failedCount = 0;

        for (const file of toDelete) {
          const driveFileId = file.google_drive_id || file.path;

          if (driveFileId) {
            try {
              await googleDriveAPI.deleteFile(driveFileId);

              deletedCount++;
            } catch (driveError) {
              console.warn(
                `⚠️ Failed to delete file ${file.name} from Google Drive:`,
                driveError
              );
              failedCount++;
              // Continue with other deletions even if one fails
            }
          } else {
            console.warn(`⚠️ No Google Drive ID found for file: ${file.name}`);
            failedCount++;
          }
        }

        // Delete the course folder after all files are deleted
        if (courseData?.title) {
          try {
            const { GOOGLE_DRIVE_CONFIG } = await import(
              "./googledrivefunctions/googleDriveConfig"
            );

            // Build the folder structure that was used for this course
            const folderStructure = [
              GOOGLE_DRIVE_CONFIG.FOLDERS.ROOT_FOLDER, // "Hivedemia"
              GOOGLE_DRIVE_CONFIG.FOLDERS.COURSE_FILES, // "coursefiles"
              `${username}_${user_id}`, // "username_userId"
              googleDriveAPI.sanitizeFolderName(courseData.title), // sanitized course name
            ];

            await googleDriveAPI.deleteFolder(folderStructure);
          } catch (folderError) {
            console.warn("⚠️ Failed to delete course folder:", folderError);
            // Don't fail the entire deletion if folder deletion fails
          }
        }
      } else {
      }

      // Delete from Supabase
      await supabase.from("coursefiles").delete().eq("course_id", courseId);
      await supabase.from("course").delete().eq("id", courseId);

      // Delete from local DB
      await coursesDb.runAsync(`DELETE FROM courses WHERE id = ?`, courseId);

      // Clean up notes
      await this.cleanupNotes(notesTakenDb, courseId);

      // Update local state and refresh file counts
      await useCourseStore.getState().loadLocalCourses(true);
      await useCourseStore.getState().attachFileCountsToCourses();

      callbacks.onSuccess(`${course.title} deleted successfully`);
    } catch (err) {
      console.error("Delete course error:", err);
      callbacks.onError("Could not delete course.");
    } finally {
      callbacks.onFinishDeleting(courseId);
    }
  }

  /**
   * Delete multiple courses with confirmation
   */
  static async deleteBulkCourses(
    selectedCourses: Set<string>,
    courses: any[],
    callbacks: {
      onStart: () => void;
      onFinish: () => void;
      onSuccess: (message: string) => void;
      onError: (error: string) => void;
      singleDeletionCallbacks: DeletionCallbacks;
    }
  ): Promise<void> {
    if (selectedCourses.size === 0) return;

    Alert.alert(
      "Delete Courses",
      `Are you sure you want to delete ${selectedCourses.size} course${
        selectedCourses.size > 1 ? "s" : ""
      }? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            callbacks.onStart();

            try {
              const courseIds = Array.from(selectedCourses);
              for (const courseId of courseIds) {
                const course = courses.find(
                  (c: any) => c.id.toString() === courseId
                );
                if (course) {
                  await this.deleteSingleCourse(
                    courseId,
                    { id: courseId, title: course.title },
                    callbacks.singleDeletionCallbacks
                  );
                }
              }

              callbacks.onSuccess(
                `${courseIds.length} courses deleted successfully`
              );
            } catch (err) {
              console.error("Bulk delete error:", err);
              callbacks.onError("Some courses could not be deleted.");
            } finally {
              callbacks.onFinish();
            }
          },
        },
      ]
    );
  }

  /**
   * Show single course deletion confirmation
   */
  static showSingleDeletionConfirmation(
    courseId: string,
    course: CourseToDelete,
    callbacks: {
      onSelectMultiple: () => void;
      onDelete: () => void;
    }
  ): void {
    Alert.alert(
      "Delete Course",
      `Are you sure you want to delete "${course.title}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Select Multiple",
          onPress: callbacks.onSelectMultiple,
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: callbacks.onDelete,
        },
      ]
    );
  }

  /**
   * Clean up notes and related data for a course
   */
  private static async cleanupNotes(
    notesTakenDb: any,
    courseId: string
  ): Promise<void> {
    const notes = await notesTakenDb.getAllAsync(
      `SELECT id FROM notes WHERE courseId = ?`,
      [courseId]
    );

    const noteIds = notes.map((n: any) => n.id);
    if (noteIds.length > 0) {
      const placeholders = noteIds.map(() => "?").join(", ");
      await notesTakenDb.execAsync("BEGIN TRANSACTION");
      try {
        await notesTakenDb.runAsync(
          `DELETE FROM saved_books WHERE noteId IN (${placeholders})`,
          noteIds
        );
        await notesTakenDb.runAsync(
          `DELETE FROM voice_notes WHERE noteId IN (${placeholders})`,
          noteIds
        );
        await notesTakenDb.runAsync(`DELETE FROM notes WHERE courseId = ?`, [
          courseId,
        ]);
        await notesTakenDb.execAsync("COMMIT");
      } catch (err) {
        await notesTakenDb.execAsync("ROLLBACK");
        console.error("Failed to delete notes:", err);
      }
    }
  }
}
