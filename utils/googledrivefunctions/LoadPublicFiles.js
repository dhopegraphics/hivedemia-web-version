// Google Drive version of LoadPublicFiles.js
// Same function names and signatures as the original Supabase version

import { supabase } from "@/backend/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { googleDriveAPI } from "./googleDriveAPI";

export const useLoadPublicFiles = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      // Load from local cache first
      const cache = await AsyncStorage.getItem(`shared-notes`);
      if (cache) setFiles(JSON.parse(cache));

      // Still use Supabase authentication
      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData?.user?.id;

      if (!user_id) {
        setLoading(false);
        return;
      }

      // Fetch shared notes metadata from Supabase (same as original)
      const { data, error } = await supabase
        .from("shared_notes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading shared notes:", error.message);
        setLoading(false);
        return;
      }

      if (data) {
        // For Google Drive files, refresh URLs if needed
        const updatedFiles = await Promise.all(
          data.map(async (file) => {
            // If we have a Google Drive ID, try to get fresh URLs
            if (file.google_drive_id) {
              try {
                const { downloadUrl, viewUrl } =
                  await googleDriveAPI.getFileDownloadUrl(file.google_drive_id);
                if (downloadUrl || viewUrl) {
                  return {
                    ...file,
                    url: downloadUrl || viewUrl,
                    google_drive_url: downloadUrl || viewUrl,
                  };
                }
              } catch (urlError) {
                console.warn(
                  `Failed to get URL for file ${file.file_name}:`,
                  urlError
                );
                // Keep existing file data if Google Drive request fails
              }
            }
            return file;
          })
        );

        setFiles(updatedFiles);
        await AsyncStorage.setItem(
          `shared-notes`,
          JSON.stringify(updatedFiles)
        );
      }
    } catch (err) {
      console.error("Failed to sync shared notes", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh function that can be exported and used with RefreshControl
  const refreshFiles = useCallback(async () => {
    await loadFiles();
  }, [loadFiles]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  return { files, loading, refreshFiles };
};
