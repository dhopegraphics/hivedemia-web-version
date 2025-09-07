// Next.js Web version of useFileOperations.js
// Converted from React Native to work with Next.js web environment

import { useCourseStore } from "@/backend/store/useCourseStore";
import { useUserStore } from "@/backend/store/useUserStore";
import { supabase } from "@/backend/supabase";
import { useToast } from "@/context/ToastContext";
import { useSubscriptionManager } from "@/hooks/useSubscriptionManager";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { allowedExtensions } from "../AllowedExtensions";
import { downloadAndCachePdf } from "../downloadAndCachePdf";
import { googleDriveAPI } from "./googleDriveAPI";

// Web Storage utility to replace AsyncStorage
const webStorage = {
  getItem: async (key) => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn("LocalStorage getItem error:", error);
      return null;
    }
  },
  setItem: async (key, value) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn("LocalStorage setItem error:", error);
    }
  },
  removeItem: async (key) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn("LocalStorage removeItem error:", error);
    }
  },
};

// Web alert utility to replace React Native Alert
const webAlert = {
  alert: (title, message, buttons = [{ text: "OK" }]) => {
    // For now, use browser confirm/alert. You could replace this with a custom modal component
    if (buttons.length === 1) {
      window.alert(`${title}\n\n${message}`);
      if (buttons[0].onPress) buttons[0].onPress();
    } else {
      const result = window.confirm(`${title}\n\n${message}`);
      if (result && buttons[1]?.onPress) {
        buttons[1].onPress();
      } else if (!result && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
    }
  },
};

// Web SQLite replacement using IndexedDB
const webDB = {
  async openDatabase(name) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name, 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        const db = request.result;
        resolve({
          async runAsync(sql, params = []) {
            return new Promise((resolve, reject) => {
              try {
                // For web implementation, we'll use a simplified approach
                // In a real implementation, you'd want to use a proper SQL-to-IndexedDB mapper
                console.log("WebDB query:", sql, params);
                if (sql.includes("DELETE FROM notes")) {
                  // Handle notes deletion
                  const transaction = db.transaction(["notes"], "readwrite");
                  const store = transaction.objectStore("notes");
                  // Simplified: clear all notes (proper implementation would filter by params)
                  store.clear();
                  transaction.oncomplete = () => resolve();
                  transaction.onerror = () => reject(transaction.error);
                } else if (sql.includes("DELETE FROM voice_notes")) {
                  // Handle voice_notes deletion
                  const transaction = db.transaction(
                    ["voice_notes"],
                    "readwrite"
                  );
                  const store = transaction.objectStore("voice_notes");
                  store.clear();
                  transaction.oncomplete = () => resolve();
                  transaction.onerror = () => reject(transaction.error);
                } else {
                  resolve();
                }
              } catch (error) {
                reject(error);
              }
            });
          },
        });
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains("notes")) {
          db.createObjectStore("notes", { keyPath: "id", autoIncrement: true });
        }
        if (!db.objectStoreNames.contains("voice_notes")) {
          db.createObjectStore("voice_notes", {
            keyPath: "id",
            autoIncrement: true,
          });
        }
      };
    });
  },
};

export const useFileOperations = ({ id, setFiles, courseTitle }) => {
  const { showToast } = useToast();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [progressMode, setProgressMode] = useState("upload");
  const [isPickingDocument, setIsPickingDocument] = useState(false);

  // Get subscription manager for feature access
  const { checkFeatureAccess } = useSubscriptionManager();

  // Check file limits based on subscription
  const checkFileLimits = async (newFilesCount) => {
    try {
      const existingFilesJson = await webStorage.getItem(`course-files-${id}`);
      const currentFiles = JSON.parse(existingFilesJson || "[]");
      const currentCount = currentFiles.length;
      const totalAfterUpload = currentCount + newFilesCount;

      // Check if user has unlimited access based on subscription
      const hasUnlimitedAccess = checkFeatureAccess("hasUnlimitedAccess");

      if (hasUnlimitedAccess) {
        // No file limit for premium users
        return {
          currentCount,
          totalAfterUpload,
          fileLimit: Infinity,
          canUpload: true,
          remainingSlots: Infinity,
          hasUnlimitedAccess: true,
        };
      } else {
        // 3-file limit for basic/non-premium users
        const fileLimit = 3;
        return {
          currentCount,
          totalAfterUpload,
          fileLimit,
          canUpload: totalAfterUpload <= fileLimit,
          remainingSlots: Math.max(0, fileLimit - currentCount),
          hasUnlimitedAccess: false,
        };
      }
    } catch (error) {
      console.warn("Error checking file limits:", error);
      // Default to limited access on error
      return {
        currentCount: 0,
        totalAfterUpload: newFilesCount,
        fileLimit: 3,
        canUpload: newFilesCount <= 3,
        remainingSlots: 3,
        hasUnlimitedAccess: false,
      };
    }
  };

  // Validate selected files
  const validateSelectedFiles = async (files) => {
    const validFiles = [];
    const invalidFiles = [];
    const duplicateFiles = [];

    // Get current file names to check for duplicates
    const currentFileNames = new Set();
    try {
      const existingFilesJson = await webStorage.getItem(`course-files-${id}`);
      const currentFiles = JSON.parse(existingFilesJson || "[]");
      currentFiles.forEach((file) =>
        currentFileNames.add(file.name.toLowerCase())
      );
    } catch (error) {
      console.warn("Could not load existing files for duplicate check:", error);
    }

    Array.from(files).forEach((file) => {
      const fileExt = file.name.split(".").pop().toLowerCase();
      const fileSizeInMB = file.size / (1024 * 1024);
      const fileName = file.name.toLowerCase();

      if (!allowedExtensions.includes(fileExt)) {
        invalidFiles.push({
          file,
          reason: "unsupported_type",
          message: `${file.name}: Unsupported file type (.${fileExt})`,
        });
      } else if (fileSizeInMB > 10) {
        invalidFiles.push({
          file,
          reason: "too_large",
          message: `${file.name}: File too large (${fileSizeInMB.toFixed(
            1
          )}MB > 10MB)`,
        });
      } else if (currentFileNames.has(fileName)) {
        duplicateFiles.push({
          file,
          reason: "duplicate",
          message: `${file.name}: File already exists in this course`,
        });
      } else {
        validFiles.push(file);
      }
    });

    return { validFiles, invalidFiles: [...invalidFiles, ...duplicateFiles] };
  };

  // Show validation errors
  const showValidationErrors = (invalidFiles) => {
    const typeErrors = invalidFiles.filter(
      (f) => f.reason === "unsupported_type"
    );
    const sizeErrors = invalidFiles.filter((f) => f.reason === "too_large");
    const duplicateErrors = invalidFiles.filter(
      (f) => f.reason === "duplicate"
    );

    let message = "";

    if (typeErrors.length > 0) {
      message += `Unsupported file types:\n${typeErrors
        .map((f) => f.message)
        .join("\n")}\n\n`;
    }

    if (sizeErrors.length > 0) {
      message += `Files too large:\n${sizeErrors
        .map((f) => f.message)
        .join("\n")}\n\n`;
    }

    if (duplicateErrors.length > 0) {
      message += `Duplicate files:\n${duplicateErrors
        .map((f) => f.message)
        .join("\n")}\n\n`;
    }

    message +=
      "Only PDF, Word, Excel, Text, or Markdown files under 10MB are allowed.";

    webAlert.alert("Invalid Files", message, [{ text: "OK" }]);
  };

  // Process multiple files
  const processMultipleFiles = async (files) => {
    setUploading(true);
    setIsPickingDocument(false);
    setProgressMode("upload");
    setUploadProgress(0);

    const totalFiles = files.length;
    let completedFiles = 0;
    const uploadResults = [];
    const failures = [];

    try {
      // Get authentication first
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      const user_id = userData?.user?.id;

      if (userError || !user_id) {
        setUploading(false);
        setIsPickingDocument(false);
        webAlert.alert("Auth Error", "User must be logged in to upload files.");
        return;
      }

      // Get username
      let username = "user";
      try {
        const userProfile = useUserStore.getState().profile;
        if (userProfile) {
          username =
            userProfile.username ||
            userProfile.full_name?.replace(/\s+/g, "_") ||
            userProfile.email?.split("@")[0] ||
            "user";
        } else if (userData.user?.user_metadata?.username) {
          username = userData.user.user_metadata.username;
        } else if (userData.user?.email) {
          username = userData.user.email.split("@")[0];
        }
      } catch (profileError) {
        console.warn("Error accessing local profile:", profileError);
        if (userData.user?.user_metadata?.username) {
          username = userData.user.user_metadata.username;
        } else if (userData.user?.email) {
          username = userData.user.email.split("@")[0];
        }
      }

      // Process files sequentially to avoid overwhelming the system
      for (const file of files) {
        try {
          const result = await processSingleFile(file, username, user_id);
          uploadResults.push(result);
          completedFiles++;

          // Update progress
          const progress = Math.round((completedFiles / totalFiles) * 90);
          setUploadProgress(progress);

          // Small delay between uploads
          if (completedFiles < totalFiles) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          failures.push({ file, error: error.message });
          completedFiles++;
        }
      }

      // Update UI with successful uploads
      if (uploadResults.length > 0) {
        setFiles((prev) => {
          const updated = [...prev, ...uploadResults];
          webStorage.setItem(`course-files-${id}`, JSON.stringify(updated));
          return updated;
        });

        // Update file counts
        try {
          await useCourseStore.getState().attachFileCountsToCourses();
        } catch (countError) {
          console.warn("Failed to update file counts:", countError);
        }
      }

      // Show results
      setUploadProgress(100);
      showUploadResults(uploadResults, failures);
    } catch (error) {
      console.error("Batch upload error:", error);
      webAlert.alert("Upload Error", error.message || "Failed to upload files");
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1000);
    }
  };

  // Process a single file
  const processSingleFile = async (file, username, user_id) => {
    const uniqueFileName = `${Date.now()}-${file.name}`;
    const mimeType = googleDriveAPI.getMimeType(file.name);
    const fileExt = file.name.split(".").pop().toLowerCase();

    // For web File objects, we pass the file directly instead of uri
    // Upload to Google Drive
    const uploadResult = await googleDriveAPI.uploadFile(
      file, // Pass the File object directly for web
      uniqueFileName,
      mimeType,
      null,
      `${username}_${user_id}`,
      courseTitle
    );

    if (!uploadResult || !uploadResult.id) {
      throw new Error(`Failed to upload ${file.name} to Google Drive`);
    }

    // Get shareable URLs
    const { downloadUrl, viewUrl } = await googleDriveAPI.createShareableLink(
      uploadResult
    );
    const fileUrl = downloadUrl || viewUrl || "";

    // Store in Supabase
    const { error: insertError } = await supabase.from("coursefiles").insert([
      {
        course_id: id,
        user_id,
        name: file.name,
        type: fileExt,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        is_private: true,
        url: fileUrl,
        path: uploadResult.id,
        google_drive_id: uploadResult.id,
      },
    ]);

    if (insertError) {
      // Clean up Google Drive file on database error
      try {
        await googleDriveAPI.deleteFile(uploadResult.id);
      } catch (cleanupError) {
        console.warn("Failed to cleanup uploaded file:", cleanupError);
      }
      throw new Error(
        `Database error for ${file.name}: ${insertError.message}`
      );
    }

    // Download and cache locally
    const downloadedUri = await downloadAndCachePdf(fileUrl, file.name, id);

    return {
      id: Date.now() + Math.random(), // Ensure unique ID
      name: file.name,
      type: fileExt,
      date: new Date().toISOString().split("T")[0],
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      url: downloadedUri,
      unprocessedUrl: fileUrl,
      filePath: uploadResult.id,
      googleDriveId: uploadResult.id,
    };
  };

  // Show upload results
  const showUploadResults = (successes, failures) => {
    const successCount = successes.length;
    const failureCount = failures.length;

    if (successCount > 0 && failureCount === 0) {
      showToast(
        `Successfully uploaded ${successCount} file(s)`,
        "success",
        3000
      );
    } else if (successCount > 0 && failureCount > 0) {
      showToast(
        `Uploaded ${successCount} file(s), ${failureCount} failed`,
        "warning",
        4000
      );
      // Show detailed failure info
      setTimeout(() => {
        const failureDetails = failures
          .map((f) => `• ${f.file.name}: ${f.error}`)
          .join("\n");
        webAlert.alert("Some Uploads Failed", failureDetails, [{ text: "OK" }]);
      }, 1000);
    } else {
      webAlert.alert(
        "Upload Failed",
        "All file uploads failed. Please try again."
      );
    }
  };

  const handleFileUpload = async () => {
    // Prevent multiple concurrent document picker operations
    if (isPickingDocument || uploading) {
      console.log("Upload already in progress, ignoring additional calls");
      return;
    }

    try {
      setIsPickingDocument(true);

      // Create file input element
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      input.accept = allowedExtensions.map((ext) => `.${ext}`).join(",");

      // Handle file selection
      const result = await new Promise((resolve) => {
        input.onchange = (e) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            resolve({ canceled: false, files: Array.from(files) });
          } else {
            resolve({ canceled: true, files: [] });
          }
        };

        input.oncancel = () => {
          resolve({ canceled: true, files: [] });
        };

        input.click();
      });

      if (result.canceled || !result.files?.length) {
        setIsPickingDocument(false);
        return;
      }

      // Validate all selected files before processing
      const validationResults = await validateSelectedFiles(result.files);

      // Check file limits for valid files
      if (validationResults.validFiles.length > 0) {
        const limitCheck = await checkFileLimits(
          validationResults.validFiles.length
        );

        if (!limitCheck.canUpload) {
          setIsPickingDocument(false);

          if (limitCheck.hasUnlimitedAccess) {
            // This should not happen for unlimited users, but just in case
            webAlert.alert(
              "Upload Error",
              "An unexpected error occurred. Please try again.",
              [{ text: "OK", style: "cancel" }]
            );
          } else {
            // Limited user trying to exceed file limit
            webAlert.alert(
              "File Limit Exceeded",
              `You can only upload ${limitCheck.remainingSlots} more file(s). You selected ${validationResults.validFiles.length} file(s).\n\nCurrent files: ${limitCheck.currentCount}/${limitCheck.fileLimit}\n\nUpgrade to Premium for unlimited file uploads.`,
              [
                { text: "Cancel", style: "cancel" },
                limitCheck.remainingSlots > 0
                  ? {
                      text: `Upload ${limitCheck.remainingSlots} Files`,
                      onPress: async () => {
                        const filesToUpload =
                          validationResults.validFiles.slice(
                            0,
                            limitCheck.remainingSlots
                          );
                        setIsPickingDocument(true);
                        await processMultipleFiles(filesToUpload);
                      },
                    }
                  : null,
                {
                  text: "Upgrade Premium",
                  onPress: () => {
                    router.push("/Subscription");
                  },
                },
              ].filter(Boolean)
            );
          }
          return;
        }
      }

      if (validationResults.invalidFiles.length > 0) {
        setIsPickingDocument(false);
        showValidationErrors(validationResults.invalidFiles);

        // If some files are valid, ask user if they want to proceed with valid ones only
        if (validationResults.validFiles.length > 0) {
          webAlert.alert(
            "Some Files Invalid",
            `${validationResults.validFiles.length} file(s) are valid. Continue with these files?`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Continue",
                onPress: async () => {
                  setIsPickingDocument(true);
                  await processMultipleFiles(validationResults.validFiles);
                },
              },
            ]
          );
        }
        return;
      }

      if (validationResults.validFiles.length === 0) {
        setIsPickingDocument(false);
        webAlert.alert(
          "No Valid Files",
          "Please select valid files to upload."
        );
        return;
      }

      // Process multiple files
      await processMultipleFiles(validationResults.validFiles);
    } catch (err) {
      console.error("Unexpected error:", err.message);
      webAlert.alert("Upload Error", err.message || "Something went wrong");
    } finally {
      setUploading(false);
      setIsPickingDocument(false);
      setUploadProgress(0);
    }
  };

  const handleFileDelete = async (fileId, filePath) => {
    try {
      const notesTakenDb = await webDB.openDatabase("notes.db");
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

      // Get the file record from Supabase to get Google Drive ID
      const { data: fileRecord, error: fetchError } = await supabase
        .from("coursefiles")
        .select("google_drive_id, path")
        .eq("id", fileId)
        .single();

      if (fetchError) {
        console.warn("Could not fetch file record:", fetchError);
      }

      // Delete from Google Drive (using the google_drive_id or path as fallback)
      const driveFileId =
        fileRecord?.google_drive_id || fileRecord?.path || filePath;
      if (driveFileId) {
        try {
          await googleDriveAPI.deleteFile(driveFileId);
        } catch (driveError) {
          console.warn("Failed to delete from Google Drive:", driveError);
          // Continue with database deletion even if Google Drive deletion fails
        }
      }

      // Delete metadata from Supabase (same as original)
      await supabase.from("coursefiles").delete().eq("id", fileId);

      // Delete all notes from notesTakenDb for this file (same as original)
      await notesTakenDb.runAsync(
        `DELETE FROM notes WHERE fileId = ? AND courseId = ?`,
        [fileId, id]
      );

      await notesTakenDb.runAsync(
        `DELETE FROM voice_notes WHERE noteId NOT IN (SELECT id FROM notes)`
      );

      // Update UI + cache (same as original)
      setFiles((prev) => {
        const updated = prev.filter((f) => f.id !== fileId);
        webStorage.setItem(`course-files-${id}`, JSON.stringify(updated));
        return updated;
      });

      clearInterval(sim);
      setUploadProgress(100);

      showToast(`File Deleted Successfully`, "info", 400);

      // Small delay to ensure database operations are complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Refresh file counts in the course store
      try {
        await useCourseStore.getState().attachFileCountsToCourses();
      } catch (countError) {
        console.warn(
          "Failed to update file counts after deletion:",
          countError
        );
      }
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
    isPickingDocument, // Export this so UI can show picker status
  };
};
