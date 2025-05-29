import { supabase } from "@/backend/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";

export const useLoadFiles = ({ id, setFiles }) => {
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const cache = await AsyncStorage.getItem(`course-files-${id}`);
        if (cache) setFiles(JSON.parse(cache));

        const { data: userData } = await supabase.auth.getUser();
        const user_id = userData?.user?.id;
        if (!user_id) return;

        const { data, error } = await supabase
          .from("coursefiles")
          .select("*")
          .eq("course_id", id)
          .eq("user_id", user_id);

        if (data) {
          const localCache = await AsyncStorage.getItem(`course-files-${id}`);
          const localFiles = localCache ? JSON.parse(localCache) : [];

          const formatted = data.map((file) => {
            const localMatch = localFiles.find((f) => f.name === file.name);
            return {
              id: file.id,
              name: file.name,
              type: file.type,
              date: new Date(file.created_at).toISOString().split("T")[0],
              size: file.size,
              url: localMatch?.url || "not well",
              unprocessedUrl: localMatch?.unprocessedUrl || "not well",
              filePath: localMatch?.filePath || "no File Path find",
            };
          });

          setFiles(formatted);
          await AsyncStorage.setItem(`course-files-${id}`, JSON.stringify(formatted));
        }
      } catch (err) {
        console.error("Failed to sync course files", err);
      }
    };

    loadFiles();
  }, [id]);
};
