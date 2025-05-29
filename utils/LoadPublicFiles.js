import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/backend/supabase";

export const useLoadPublicFiles = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      // Load from local cache first
      const cache = await AsyncStorage.getItem(`shared-notes`);
      if (cache) setFiles(JSON.parse(cache));

      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData?.user?.id;
      
      if (!user_id) {
        setLoading(false);
        return;
      }
      
      // Fetch shared notes for the user
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
        setFiles(data);
        await AsyncStorage.setItem(`shared-notes`, JSON.stringify(data));
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