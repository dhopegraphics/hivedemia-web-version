// Google Drive version of useDeleteCourse.js
// Same function names and signatures as the original Supabase version

import { useUserStore } from "@/backend/store/useUserStore";
import { supabase } from "@/backend/supabase";
import { useToast } from "@/context/ToastContext";
import { router } from "expo-router";
import * as SQLite from "expo-sqlite";
import { Alert } from "react-native";
import { googleDriveAPI } from "./googleDriveAPI";

export const useDeleteCourse = ({ id, fileNames }) => {
  const { showToast } = useToast();

  return () =>
    Alert.alert(
      "Delete Course",
      "Are you sure you want to delete this course and all its files?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const coursesDb = await SQLite.openDatabaseAsync("courses.db");
              const notesTakenDb = await SQLite.openDatabaseAsync("notes.db");

              // Get user
              const { data: userData } = await supabase.auth.getUser();
              const user_id = userData?.user?.id;
              if (!user_id) throw new Error("Not authenticated");

              // Get user profile from local store (much faster and works offline)
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
                    "⚠️ No local profile found for course deletion, using auth fallbacks"
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
                  "⚠️ Error accessing local profile for course deletion:",
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

              // Get course title
              const { data: courseData, error: courseError } = await supabase
                .from("course")
                .select("title")
                .eq("id", id)
                .single();

              if (courseError) throw new Error("Could not fetch course title");

              // Get file metadata including Google Drive IDs
              const { data: toDelete } = await supabase
                .from("coursefiles")
                .select("id, name, google_drive_id, path")
                .eq("course_id", id)
                .eq("user_id", user_id);

              // Delete files from Google Drive
              if (toDelete && toDelete.length > 0) {
                for (const file of toDelete) {
                  const driveFileId = file.google_drive_id || file.path;
                  if (driveFileId) {
                    try {
                      await googleDriveAPI.deleteFile(driveFileId);
                    } catch (driveError) {
                      console.warn(
                        `Failed to delete file ${file.name} from Google Drive:`,
                        driveError
                      );
                      // Continue with other deletions even if one fails
                    }
                  }
                }
              }

              // Delete course folder from Google Drive
              try {
                const { GOOGLE_DRIVE_CONFIG } = await import(
                  "./googleDriveConfig"
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
                console.warn(`⚠️ Failed to delete course folder:`, folderError);
                // Continue with database deletion even if folder deletion fails
              }

              // Delete from Supabase database
              await supabase.from("coursefiles").delete().eq("course_id", id);
              await supabase.from("course").delete().eq("id", id);

              // Delete from local database
              await coursesDb.runAsync(`DELETE FROM courses WHERE id = ?`, id);

              // Clean up notes + related saved_books and voice_notes
              const notes = await notesTakenDb.getAllAsync(
                `SELECT id FROM notes WHERE courseId = ?`,
                [id]
              );

              const noteIds = notes.map((n) => n.id);

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

                  await notesTakenDb.runAsync(
                    `DELETE FROM notes WHERE courseId = ?`,
                    [id]
                  );

                  await notesTakenDb.execAsync("COMMIT");
                } catch (err) {
                  await notesTakenDb.execAsync("ROLLBACK");
                  console.error("Failed to delete notes or related data:", err);
                }
              }

              // Show success toast
              showToast(
                `${courseData.title} Deleted Successfully`,
                "error",
                400
              );

              // Navigate back
              router.back();
            } catch (err) {
              console.error("Delete course error:", err.message);
              Alert.alert("Error", "Could not delete course.");
            }
          },
        },
      ]
    );
};
