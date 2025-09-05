// Google Drive API Utilities
// Proxy-based uploads via Google Apps Script or backend

import * as FileSystem from "expo-file-system";
import { googleDriveAuth } from "./googleDriveAuth";
import { GOOGLE_DRIVE_CONFIG, MIME_TYPES } from "./googleDriveConfig";

class GoogleDriveAPI {
  // Upload file to Google Drive via proxy with structured folders
  async uploadFile(
    fileUri,
    fileName,
    mimeType,
    folderPath = null,
    userId = null,
    courseName = null
  ) {
    try {
      // Check if proxy is configured
      if (!googleDriveAuth.isConfigured()) {
        throw new Error(
          "Google Apps Script URL is not configured. Please set EXPO_PUBLIC_GOOGLE_APPS_SCRIPT_URL in your environment."
        );
      }

      // Read file as base64
      const base64Data = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Build folder structure path
      const folderStructure = this.buildFolderPath(
        folderPath,
        userId,
        courseName
      );

      // Prepare form data for proxy upload
      const uploadData = {
        fileName: fileName,
        mimeType: mimeType,
        fileData: base64Data,
        folderStructure: folderStructure, // Send full folder structure
        createFolders: true, // Flag to create folders if they don't exist
      };

      // Upload via Google Apps Script proxy
      const response = await fetch(GOOGLE_DRIVE_CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(uploadData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(`Upload failed: ${result.error}`);
      }

      return result;
    } catch (error) {
      console.error("Error uploading file to Google Drive:", error);
      throw error;
    }
  }

  // Build hierarchical folder path
  buildFolderPath(customPath, userId, courseName) {
    const folders = [];

    // Start with root folder
    folders.push(GOOGLE_DRIVE_CONFIG.FOLDERS.ROOT_FOLDER);

    if (customPath) {
      // Use custom path (e.g., "crowdsources-notes" or "coursefiles")
      folders.push(customPath);
    } else {
      // Default: coursefiles structure
      folders.push(GOOGLE_DRIVE_CONFIG.FOLDERS.COURSE_FILES);
    }

    // Add user folder if userId is provided (userId now contains username_userId)
    if (userId) {
      folders.push(userId); // userId already contains username_userId format
    }

    // Add course folder if courseName is provided (only for course files)
    if (courseName && customPath !== "crowdsources-notes") {
      // Clean course name for folder (remove special characters)
      const cleanCourseName = this.sanitizeFolderName(courseName);
      folders.push(cleanCourseName);
    }

    return folders;
  }

  // Sanitize folder name (remove special characters)
  sanitizeFolderName(name) {
    return name
      .replace(/[<>:"/\\|?*]/g, "") // Remove invalid characters
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .substring(0, 100); // Limit length
  }

  // Get shareable link (for files that don't already have links)
  async createShareableLink(fileId) {
    try {
      // First check if the upload result already includes shareable links
      if (typeof fileId === "object" && fileId.downloadUrl) {
        return {
          downloadUrl: fileId.downloadUrl || fileId.webContentLink,
          viewUrl: fileId.viewUrl || fileId.webViewLink,
          fileName: fileId.fileName || fileId.name,
          fileSize: fileId.fileSize || fileId.size,
        };
      }

      // If we only have the file ID, request the shareable links
      const linkData = {
        action: "getShareableLink",
        fileId: fileId,
      };

      const response = await fetch(GOOGLE_DRIVE_CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(linkData),
      });

      if (!response.ok) {
        throw new Error(`Failed to get shareable link: ${response.status}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(`Failed to get shareable link: ${result.error}`);
      }

      return {
        downloadUrl: result.downloadUrl || result.viewUrl,
        viewUrl: result.viewUrl,
        fileName: result.fileName,
        fileSize: result.fileSize,
      };
    } catch (error) {
      console.error("Error creating shareable link:", error);
      throw error;
    }
  }

  // Delete file from Google Drive
  async deleteFile(fileId) {
    try {
      const deleteData = {
        action: "deleteFile",
        fileId: fileId,
      };

      const response = await fetch(GOOGLE_DRIVE_CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deleteData),
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`File deletion failed: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  }

  // Delete course folder from Google Drive
  async deleteFolder(folderStructure) {
    try {
      if (
        !folderStructure ||
        !Array.isArray(folderStructure) ||
        folderStructure.length === 0
      ) {
        console.warn("No folder structure provided for deletion");
        return true;
      }

      const deleteData = {
        action: "deleteFolder",
        folderStructure: folderStructure,
      };

      const response = await fetch(GOOGLE_DRIVE_CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deleteData),
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`Folder deletion failed: ${response.status}`);
      }

      const result = await response.json();

      return true;
    } catch (error) {
      console.error("Error deleting folder:", error);
      // Don't throw error for folder deletion failures, just log them
      return false;
    }
  }

  // Get file download URLs (for existing files)
  async getFileDownloadUrl(fileId) {
    try {
      const linkData = {
        action: "getShareableLink",
        fileId: fileId,
      };

      const response = await fetch(GOOGLE_DRIVE_CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(linkData),
      });

      if (!response.ok) {
        throw new Error(`Failed to get file URL: ${response.status}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(`Failed to get file URL: ${result.error}`);
      }

      return {
        downloadUrl: result.downloadUrl || result.viewUrl,
        viewUrl: result.viewUrl,
      };
    } catch (error) {
      console.error("Error getting file URL:", error);
      throw error;
    }
  }

  // Get MIME type from file extension
  getMimeType(fileName) {
    const extension = fileName.split(".").pop()?.toLowerCase();
    return MIME_TYPES[extension] || "application/octet-stream";
  }
}

// Export singleton instance
export const googleDriveAPI = new GoogleDriveAPI();
