import { supabase } from "@/backend/supabase";
import { useToast } from "@/context/ToastContext";
import { coursesDb, notesTakenDb } from "@/data/localDb";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Alert } from "react-native";

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
              // Get user
              const { data: userData } = await supabase.auth.getUser();
              const user_id = userData?.user?.id;
              if (!user_id) throw new Error("Not authenticated");

              // Get course title
              const { data: courseData, error: courseError } = await supabase
                .from("course")
                .select("title")
                .eq("id", id)
                .single();

              if (courseError) throw new Error("Could not fetch course title");

              // Get file metadata
              const { data: toDelete } = await supabase
                .from("coursefiles")
                .select("id, name")
                .eq("course_id", id)
                .eq("user_id", user_id);

              // Local file paths
              const localCache = await AsyncStorage.getItem(
                `course-files-${id}`
              );
              const localFiles = localCache ? JSON.parse(localCache) : [];

              const localMatches = localFiles.filter((f) =>
                fileNames.includes(f.name)
              );

              const filePathsToDelete = localMatches.map((f) => f.filePath);

              if (filePathsToDelete.length > 0) {
                await supabase.storage
                  .from("coursefiles")
                  .remove(filePathsToDelete);
              }

              // Delete from Supabase
              await supabase.from("coursefiles").delete().eq("course_id", id);
              await supabase.from("course").delete().eq("id", id);

              // ✅ Delete from local DB
              await coursesDb.runAsync(`DELETE FROM courses WHERE id = ?`, id);
              // ✅ Clean up notes + related saved_books and voice_notes
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
                  console.log(
                    "Deleted all notes and related entries for course:",
                    id
                  );
                } catch (err) {
                  await notesTakenDb.execAsync("ROLLBACK");
                  console.error("Failed to delete notes or related data:", err);
                }
              }

              // ✅ Show toast
              showToast(
                `${courseData.title} Deleted Successfully`,
                "error",
                400
              );

              // ✅ Navigate back
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
