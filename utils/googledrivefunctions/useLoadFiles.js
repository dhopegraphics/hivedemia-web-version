// Google Drive version of useLoadFiles.js
// Same function names and signatures as the original Supabase version

import { supabase } from "@/backend/supabase";
import { useEffect } from "react";
import { googleDriveAPI } from "./googleDriveAPI";

// Web Storage utility to replace AsyncStorage
const webStorage = {
  async getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error("webStorage.getItem error:", error);
      return null;
    }
  },
  async setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error("webStorage.setItem error:", error);
    }
  },
};

export const useLoadFiles = ({ id, setFiles }) => {
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const cache = await webStorage.getItem(`course-files-${id}`);
        if (cache) setFiles(JSON.parse(cache));

        // Still use Supabase authentication
        const { data: userData } = await supabase.auth.getUser();
        const user_id = userData?.user?.id;
        if (!user_id) return;

        // Load file metadata from Supabase database (same as original)
        const { data, error } = await supabase
          .from("coursefiles")
          .select("*")
          .eq("course_id", id)
          .eq("user_id", user_id);

        if (error) {
          console.error("Failed to load files from database:", error);
          return;
        }

        if (data) {
          const localCache = await webStorage.getItem(`course-files-${id}`);
          const localFiles = localCache ? JSON.parse(localCache) : [];

          const formatted = await Promise.all(
            data.map(async (file) => {
              const localMatch = localFiles.find((f) => f.name === file.name);

              // For Google Drive files, ensure we have valid URLs
              let fileUrl = file?.url || "not defined";
              let unprocessedUrl =
                localMatch?.unprocessedUrl || file?.url || "not defined";

              // If we have a Google Drive ID, try to get fresh URLs
              if (file.google_drive_id) {
                try {
                  const { downloadUrl, viewUrl } =
                    await googleDriveAPI.getFileDownloadUrl(
                      file.google_drive_id
                    );
                  if (downloadUrl || viewUrl) {
                    fileUrl = downloadUrl || viewUrl;
                    unprocessedUrl = fileUrl;
                  }
                } catch (urlError) {
                  console.warn(
                    `Failed to get URL for file ${file.name}:`,
                    urlError
                  );
                  // Keep existing URLs if Google Drive request fails
                }
              }

              return {
                id: file.id,
                name: file.name,
                type: file.type,
                date: new Date(file.created_at).toISOString().split("T")[0],
                size: file.size,
                url: fileUrl,
                unprocessedUrl: unprocessedUrl,
                filePath: file?.path || "no File Path find",
                googleDriveId: file.google_drive_id || null,
              };
            })
          );

          setFiles(formatted);
          await webStorage.setItem(
            `course-files-${id}`,
            JSON.stringify(formatted)
          );
        }
      } catch (err) {
        console.error("Failed to sync course files", err);
      }
    };

    loadFiles();
  }, [id, setFiles]);
};
