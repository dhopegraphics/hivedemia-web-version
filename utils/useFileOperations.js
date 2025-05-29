// components/CourseHubDetail/useFileOperations.js
import { supabase } from "@/backend/supabase";
import { useToast } from "@/context/ToastContext";
import { notesTakenDb } from "@/data/localDb";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { decode } from "base64-arraybuffer";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useState } from "react";
import { Alert } from "react-native";


import { allowedExtensions } from "./AllowedExtensions";
import { downloadAndCachePdf } from "./downloadAndCachePdf";

export const useFileOperations = ({ id, setFiles }) => {
    const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [progressMode, setProgressMode] = useState("upload");

  const handleFileUpload = async () => {


    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];
      const fileExt = file.name.split(".").pop().toLowerCase();

      if (!allowedExtensions.includes(fileExt)) {
        Alert.alert(
          "Unsupported File",
          "Only PDF, Word, Excel, Text, or Markdown files are allowed."
        );
        return;
      }

      setUploading(true);
      setProgressMode("upload");
      setUploadProgress(0);
   

      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      const user_id = userData?.user?.id;

      if (userError || !user_id) {
        Alert.alert("Auth Error", "User must be logged in to upload files.");
        return;
      }

      // Read base64 from file system
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const fileBuffer = decode(base64);
      const filePath = `${user_id}/${Date.now()}-${file.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("coursefiles")
        .upload(filePath, fileBuffer, {
          contentType: file.mimeType,
          upsert: false, // Optional: Set to true if you want to overwrite duplicates
        });

      if (uploadError) {
        console.error("Upload failed:", uploadError.message);
        Alert.alert("Upload Failed", uploadError.message);
        return;
      }

      // Simulate progress for UX (Supabase doesn't support progress natively)
      let simulatedProgress = 0;
      const interval = setInterval(() => {
        simulatedProgress += 10;
        setUploadProgress(simulatedProgress);
        if (simulatedProgress >= 90) clearInterval(interval);
      }, 150);

      // Generate public URL or signed URL for preview
      const { data: fileUrlData, error: urlError } = await supabase.storage
        .from("coursefiles")
       .createSignedUrl(filePath, 26280);

      if (urlError) {
        console.warn("URL generation failed:", urlError.message);
      }

      const fileUrl = fileUrlData?.signedUrl || "";

      const { data: signedUrl, error: signedUrlError } = await supabase.storage
        .from("coursefiles")
        .createSignedUrl(filePath, 26280);
      if (signedUrlError) {
        console.warn("Signed URL generation failed:", signedUrlError.message);
      }

      const signedLinkUrl = signedUrl?.signedUrl || " ";

      const { error: insertError } = await supabase.from("coursefiles").insert([
        {
          course_id: id,
          user_id,
          name: file.name,
          type: fileExt,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          is_private: true,
          url: fileUrl,
        },
      ]);

      if (insertError) {
        console.error("Insert failed:", insertError.message);
        Alert.alert("DB Insert Failed", insertError.message);
        return;
      }

      const downloadedUri = await downloadAndCachePdf(
        signedLinkUrl,
        file.name,
        id
      );

      // Optional: update local cache/UI
      setFiles((prev) => {
        const updated = [
          ...prev,
          {
            id: Date.now(),
            name: file.name,
            type: fileExt,
            date: new Date().toISOString().split("T")[0],
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            url: downloadedUri,
            unprocessedUrl: fileUrl,
            filePath: filePath,
          },
        ];

        AsyncStorage.setItem(`course-files-${id}`, JSON.stringify(updated));
        return updated;
      });

      showToast(`File uploaded and saved ${file.name}`, "success", 400);
    } catch (err) {
      console.error("Unexpected error:", err.message);
      Alert.alert("Upload Error", err.message || "Something went wrong");
    } finally {
      setUploading(false);
      setUploadProgress(100);
    }
  };

const handleFileDelete = async (fileId, filePath) => {
  try {
    setUploading(true);
    setProgressMode("delete");
    setUploadProgress(0);

    // simulate progress
    let prog = 0;
    const sim = setInterval(() => {
      prog += 20;
      setUploadProgress(prog);
      if (prog >= 90) clearInterval(sim);
    }, 100);

    // delete metadata + storage from Supabase
    await supabase.from("coursefiles").delete().eq("id", fileId);
    await supabase.storage.from("coursefiles").remove([filePath]);

    // ✅ delete all notes from notesTakenDb for this file
    await notesTakenDb.runAsync(
      `DELETE FROM notes WHERE fileId = ? AND courseId = ?`,
      [fileId, id]
    );

    await notesTakenDb.runAsync(
      `DELETE FROM voice_notes WHERE noteId NOT IN (SELECT id FROM notes)`
    );

    // update UI + cache
    setFiles((prev) => {
      const updated = prev.filter((f) => f.id !== fileId);
      AsyncStorage.setItem(`course-files-${id}`, JSON.stringify(updated));
      return updated;
    });

    clearInterval(sim);
    setUploadProgress(100);

    showToast(`File Deleted Successfully`, "info", 400);
  } catch (err) {
    console.error("File delete error:", err);
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
