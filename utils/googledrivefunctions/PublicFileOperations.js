// Google Drive version of PublicFileOperations.js
// Same function names and signatures as the original Supabase version

import { supabase } from "@/backend/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import { Alert } from "react-native";
import { useUserStore } from "../../backend/store/useUserStore";
import { googleDriveAPI } from "./googleDriveAPI";

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

      // Check file size limit (10MB)
      const fileSizeInMB = file.size / (1024 * 1024);
      if (fileSizeInMB > 10) {
        Alert.alert(
          "File Too Large",
          `File size is ${fileSizeInMB.toFixed(
            1
          )}MB. Please select a file smaller than 10MB.`,
          [{ text: "OK" }]
        );
        setUploading(false);
        return;
      }

      const user_id = profile?.user_id;

      // Get username for folder structure
      let username = "user";
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username, full_name, email")
          .eq("id", user_id)
          .single();

        // Use username, or fallback to name, or fallback to email prefix
        if (profileData) {
          username =
            profileData.username ||
            profileData.full_name?.replace(/\s+/g, "_") ||
            profileData.email?.split("@")[0] ||
            "user";
        }
      } catch (profileError) {
        console.warn(
          "Could not fetch user profile, using default username:",
          profileError
        );
      }

      // Simulate progress
      let simulatedProgress = 0;
      const progressInterval = setInterval(() => {
        simulatedProgress += 10;
        setUploadProgress(simulatedProgress);
        if (simulatedProgress >= 50) clearInterval(progressInterval);
      }, 150);

      try {
        // Create unique filename and file path
        const uniqueFileName = `${Date.now()}-${fileName}`;
        const filePath = `${user_id}/${uniqueFileName}`;
        const mimeType = googleDriveAPI.getMimeType(fileName);

        // Upload to Google Drive with structured folder path
        // This will create: Hivedemia/crowdsources-notes/{username}_{userId}/
        const uploadResult = await googleDriveAPI.uploadFile(
          file.uri,
          uniqueFileName,
          mimeType,
          "crowdsources-notes", // Custom path for public notes
          `${username}_${user_id}`, // username + userId for folder structure
          null // No course name for public notes
        );

        if (!uploadResult || !uploadResult.id) {
          throw new Error("Failed to upload file to Google Drive");
        }

        // Update progress
        setUploadProgress(70);

        // Get shareable URLs from Google Drive (upload result should already include them)
        const { downloadUrl, viewUrl } =
          await googleDriveAPI.createShareableLink(uploadResult);
        const fileUrl = downloadUrl || viewUrl || "";

        // Update progress
        setUploadProgress(90);

        // Still use Supabase database for metadata (keeping the same insertion logic)
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
              google_drive_id: uploadResult.id, // Store Google Drive file ID
            },
          ])
          .select("*")
          .single();

        if (insertError) {
          console.error("Insert failed:", insertError.message);
          // Try to clean up uploaded file
          try {
            await googleDriveAPI.deleteFile(uploadResult.id);
          } catch (cleanupError) {
            console.warn("Failed to cleanup uploaded file:", cleanupError);
          }
          Alert.alert("DB Insert Failed", insertError.message);
          return;
        }

        // Update progress
        setUploadProgress(100);

        const insertedNote = {
          ...insertData,
          file_path: insertData.file_path || filePath,
          google_drive_id: uploadResult.id,
        };

        // Update local cache and UI (same as original)
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
      } catch (uploadError) {
        console.error("Google Drive upload failed:", uploadError);
        Alert.alert(
          "Upload Failed",
          uploadError.message || "Failed to upload to Google Drive"
        );
        throw uploadError;
      } finally {
        clearInterval(progressInterval);
      }
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

      // Get the file record from Supabase to get Google Drive ID
      const { data: fileRecord, error: fetchError } = await supabase
        .from("shared_notes")
        .select("google_drive_id, file_path")
        .eq("id", fileId)
        .single();

      if (fetchError) {
        console.warn("Could not fetch file record:", fetchError);
      }

      // Delete from Google Drive
      if (fileRecord?.google_drive_id) {
        try {
          await googleDriveAPI.deleteFile(fileRecord.google_drive_id);
        } catch (driveError) {
          console.warn("Failed to delete from Google Drive:", driveError);
          // Continue with database deletion even if Google Drive deletion fails
        }
      }

      // Delete metadata from Supabase (same as original)
      await supabase.from("shared_notes").delete().eq("id", fileId);

      // Update local cache and UI (same as original)
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
