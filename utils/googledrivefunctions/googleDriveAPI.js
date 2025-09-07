// Google Drive API Utilities
// Proxy-based uploads via Google Apps Script or backend

import { googleDriveAuth } from "./googleDriveAuth";
import { GOOGLE_DRIVE_CONFIG, MIME_TYPES } from "./googleDriveConfig";

// Web-compatible file reading utility
class WebFileSystem {
  static async readAsStringAsync(file, options = {}) {
    return new Promise((resolve, reject) => {
      if (typeof file === "string") {
        // If it's already a base64 string or data URL, extract the base64 part
        if (file.startsWith("data:")) {
          const base64Data = file.split(",")[1];
          resolve(base64Data);
          return;
        }
        // If it's a URL, fetch it
        fetch(file)
          .then((response) => response.blob())
          .then((blob) => this.blobToBase64(blob))
          .then(resolve)
          .catch(reject);
        return;
      }

      // If it's a File or Blob object
      if (file instanceof File || file instanceof Blob) {
        this.blobToBase64(file).then(resolve).catch(reject);
        return;
      }

      reject(new Error("Unsupported file type"));
    });
  }

  static blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        // Extract base64 part from data URL
        const base64Data = dataUrl.split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // For compatibility with expo-file-system API
  static EncodingType = {
    Base64: "base64",
  };
}

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
          "Google Apps Script URL is not configured. Please set NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL in your environment."
        );
      }

      // Read file as base64
      const base64Data = await WebFileSystem.readAsStringAsync(fileUri, {
        encoding: WebFileSystem.EncodingType.Base64,
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

      console.log(`Uploading ${fileName} to Google Drive...`);

      // Upload via Google Apps Script proxy with better error handling
      const response = await fetch(GOOGLE_DRIVE_CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(uploadData),
      });

      // Enhanced error handling for CORS and other issues
      if (!response.ok) {
        let errorText;
        try {
          errorText = await response.text();
        } catch (textError) {
          errorText = `HTTP ${response.status} - ${response.statusText}`;
        }

        // Check for CORS issues
        if (response.status === 0 || errorText.includes("CORS")) {
          throw new Error(
            `CORS Error: ${errorText}\n\nPlease check:\n1. Google Apps Script is deployed with "Anyone" access\n2. Script includes proper CORS headers\n3. URL is correct in environment variables`
          );
        }

        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error(`Invalid response from server: ${parseError.message}`);
      }

      if (result.error) {
        throw new Error(`Upload failed: ${result.error}`);
      }

      console.log(`Successfully uploaded ${fileName} to Google Drive`);
      return result;
    } catch (error) {
      console.error("Error uploading file to Google Drive:", error);

      // Enhanced error reporting
      if (error.message.includes("Failed to fetch")) {
        throw new Error(
          `Network error: Failed to connect to Google Apps Script.\n\nPossible causes:\n1. CORS policy blocking the request\n2. Google Apps Script URL is incorrect\n3. Script is not deployed properly\n4. Network connectivity issues\n\nPlease check the deployment guide and ensure your Google Apps Script is set up correctly.`
        );
      }

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
