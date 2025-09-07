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
        // First, load from cache immediately to show something quickly
        const cache = await webStorage.getItem(`course-files-${id}`);
        if (cache) {
          const cachedFiles = JSON.parse(cache);
          setFiles(cachedFiles);
        }

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

        if (data && data.length > 0) {
          const localCache = await webStorage.getItem(`course-files-${id}`);
          const localFiles = localCache ? JSON.parse(localCache) : [];

          // Process files with better error handling and concurrency control
          const formatted = await Promise.allSettled(
            data.map(async (file) => {
              try {
                const localMatch = localFiles.find((f) => f.name === file.name);

                // For Google Drive files, ensure we have valid URLs
                let fileUrl = file?.url || "not defined";
                let unprocessedUrl =
                  localMatch?.unprocessedUrl || file?.url || "not defined";

                // Only try to refresh URLs if we have a Google Drive ID and the existing URL seems invalid
                if (
                  file.google_drive_id &&
                  (!fileUrl || fileUrl === "not defined")
                ) {
                  try {
                    // Add timeout to prevent hanging
                    const urlPromise = googleDriveAPI.getFileDownloadUrl(
                      file.google_drive_id
                    );
                    const timeoutPromise = new Promise((_, reject) =>
                      setTimeout(
                        () => reject(new Error("URL fetch timeout")),
                        5000
                      )
                    );

                    const { downloadUrl, viewUrl } = await Promise.race([
                      urlPromise,
                      timeoutPromise,
                    ]);

                    if (downloadUrl || viewUrl) {
                      fileUrl = downloadUrl || viewUrl;
                      unprocessedUrl = fileUrl;
                    }
                  } catch (urlError) {
                    console.warn(
                      `Failed to get URL for file ${file.name}:`,
                      urlError.message
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
              } catch (fileError) {
                console.error(`Error processing file ${file.name}:`, fileError);
                // Return a basic file object even if processing fails
                return {
                  id: file.id,
                  name: file.name,
                  type: file.type,
                  date: new Date(file.created_at).toISOString().split("T")[0],
                  size: file.size,
                  url: file?.url || "not defined",
                  unprocessedUrl: file?.url || "not defined",
                  filePath: file?.path || "no File Path find",
                  googleDriveId: file.google_drive_id || null,
                };
              }
            })
          );

          // Filter successful results and handle failed ones
          const processedFiles = formatted
            .filter((result) => result.status === "fulfilled")
            .map((result) => result.value);

          const failedCount = formatted.filter(
            (result) => result.status === "rejected"
          ).length;
          if (failedCount > 0) {
            console.warn(`${failedCount} files failed to process completely`);
          }

          setFiles(processedFiles);
          await webStorage.setItem(
            `course-files-${id}`,
            JSON.stringify(processedFiles)
          );
        } else {
          // No files in database, clear any stale cache
          setFiles([]);
          await webStorage.setItem(`course-files-${id}`, JSON.stringify([]));
        }
      } catch (err) {
        console.error("Failed to sync course files", err);
        // On error, try to fall back to cache
        try {
          const cache = await webStorage.getItem(`course-files-${id}`);
          if (cache) {
            setFiles(JSON.parse(cache));
          }
        } catch (cacheError) {
          console.error("Failed to load from cache:", cacheError);
          setFiles([]);
        }
      }
    };

    // Add a small delay to prevent immediate API calls when rapidly switching courses
    const timeoutId = setTimeout(loadFiles, 100);

    return () => clearTimeout(timeoutId);
  }, [id, setFiles]);
};
