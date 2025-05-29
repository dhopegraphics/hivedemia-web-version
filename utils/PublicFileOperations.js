import { supabase } from "@/backend/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system";
import { useState } from "react";
import { Alert } from "react-native";
import { useUserStore } from "../backend/store/useUserStore";

export const PublicFileOperations = ({ setFiles }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [progressMode, setProgressMode] = useState("upload");
  const { profile } = useUserStore();

  const handleFileUpload = async ({
    title,
    description,
    subject,
    fileName,
    fileType,
    fileSize,
    pageCount,
    allowComments,
    isAnonymous,
    isRealAuthor,
    realAuthor,
    file,
  }) => {
    try {
      setUploading(true);

      // Validate the file object
      if (!file || !file.uri) {
        throw new Error("Invalid file object");
      }

      const user_id = profile?.user_id;
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const fileBuffer = decode(base64);
      const filePath = `${user_id}/${Date.now()}-${fileName}`;
      const contentType = file.mimeType || `application/${fileType}`;

      const { error: uploadError } = await supabase.storage
        .from("crowdsources-notes")
        .upload(filePath, fileBuffer, {
          contentType: contentType,
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload failed:", uploadError.message);
        Alert.alert("Upload Failed", uploadError.message);
        return;
      }

      const { data: fileUrlData, error: urlError } = await supabase.storage
        .from("crowdsources-notes")
        .getPublicUrl(filePath);

      const fileUrl = fileUrlData?.publicUrl || "";

      const { data: insertData, error: insertError } = await supabase
        .from("shared_notes")
        .insert([
          {
            title,
            description,
            subject,
            url: fileUrl,
            file_name: fileName,
            file_type: fileType,
            file_size: fileSize,
            page_count: pageCount,
            file_is_private: false,
            allow_comments: allowComments ?? true,
            is_anonymous: isAnonymous ?? false,
            uploaded_by: isAnonymous ? "Anonymous" : user_id,
            is_real_author: isRealAuthor,
            real_author: isRealAuthor ? user_id : realAuthor,
            file_path: filePath,
          },
        ])
        .select("*")
        .single();

      if (insertError) {
        console.error("Insert failed:", insertError.message);
        Alert.alert("DB Insert Failed", insertError.message);
        return;
      }

      console.log("Inserted note:", insertData);
      const insertedNote = {
        ...insertData,
        file_path: insertData.file_path || filePath, // Ensure file_path is present
      };

      // Update local cache and UI
      if (typeof setFiles === "function") {
        setFiles((prev) => {
          const updated = [insertedNote, ...prev];
          AsyncStorage.setItem(`shared-notes`, JSON.stringify(updated));
          return updated;
        });
      } else {
        // Fallback: update AsyncStorage directly if setFiles is not provided
        const cache = await AsyncStorage.getItem(`shared-notes`);
        let notes = [];
        if (cache) notes = JSON.parse(cache);
        notes = [insertedNote, ...notes];
        await AsyncStorage.setItem(`shared-notes`, JSON.stringify(notes));
      }
      return insertedNote;
    } catch (err) {
      console.error("Unexpected error:", err.message);
      Alert.alert("Upload Error", err.message || "Something went wrong");
      throw err; // Re-throw to allow handling in the caller
    } finally {
      setUploading(false);
    }
  };

  const handleFileDelete = async (fileId, filePath) => {
    try {
      setUploading(true);
      setProgressMode("delete");
      setUploadProgress(0);

      let prog = 0;
      const sim = setInterval(() => {
        prog += 20;
        setUploadProgress(prog);
        if (prog >= 90) clearInterval(sim);
      }, 100);

      await supabase.from("shared_notes").delete().eq("id", fileId);
      await supabase.storage.from("crowdsources-notes").remove([filePath]);

      if (typeof setFiles === "function") {
        setFiles((prev) => {
          const updated = prev.filter((f) => f.id !== fileId);
          AsyncStorage.setItem(`shared-notes`, JSON.stringify(updated));
          return updated;
        });
      }

      clearInterval(sim);
      setUploadProgress(100);
    } catch (err) {
      console.error("File delete error:", err);
      throw err;
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 800);
    }
  };

  return {
    handleFileUpload,
    uploading,
    uploadProgress,
    progressMode,
    handleFileDelete,
  };
};
