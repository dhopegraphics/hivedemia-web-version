// Google Drive version of downloadAndCachePdf.js
// Downloads files from Google Drive and caches them locally

import * as FileSystem from "expo-file-system";
import { googleDriveAPI } from "./googleDriveAPI";

/**
 * Downloads a file from Google Drive and caches it locally
 * @param {string} googleDriveUrl - The Google Drive download URL
 * @param {string} fileName - Name of the file
 * @param {string} courseId - Course ID for organizing cache
 * @returns {Promise<string>} - Local file URI
 */
export const downloadAndCachePdf = async (
  googleDriveUrl,
  fileName,
  courseId
) => {
  try {
    if (!googleDriveUrl || !fileName) {
      throw new Error("Invalid parameters for file download");
    }

    // Create cache directory structure
    const cacheDir = `${FileSystem.documentDirectory}courseFiles/${courseId}/`;
    const localPath = `${cacheDir}${fileName}`;

    // Check if file already exists in cache
    const fileInfo = await FileSystem.getInfoAsync(localPath);
    if (fileInfo.exists) {
      return localPath;
    }

    // Ensure cache directory exists
    await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });

    // Download file from Google Drive
    const downloadResult = await FileSystem.downloadAsync(
      googleDriveUrl,
      localPath,
      {
        headers: {
          // Add any necessary headers for Google Drive access
          "User-Agent": "HivedemiaApp/1.0",
        },
      }
    );

    if (downloadResult.status !== 200) {
      throw new Error(`Download failed with status: ${downloadResult.status}`);
    }

    return downloadResult.uri;
  } catch (error) {
    console.error("Error downloading and caching file:", error);

    // Fallback: return the original Google Drive URL if caching fails
    console.warn(`Falling back to direct Google Drive URL for: ${fileName}`);
    return googleDriveUrl;
  }
};

/**
 * Get cached file if it exists, otherwise download and cache
 * @param {string} googleDriveId - Google Drive file ID
 * @param {string} fileName - Name of the file
 * @param {string} courseId - Course ID for organizing cache
 * @returns {Promise<string>} - Local file URI or Google Drive URL
 */
export const getCachedOrDownload = async (
  googleDriveId,
  fileName,
  courseId
) => {
  try {
    // Check cache first
    const cacheDir = `${FileSystem.documentDirectory}courseFiles/${courseId}/`;
    const localPath = `${cacheDir}${fileName}`;

    const fileInfo = await FileSystem.getInfoAsync(localPath);
    if (fileInfo.exists) {
      return localPath;
    }

    // Get download URL from Google Drive
    const { downloadUrl } = await googleDriveAPI.getFileDownloadUrl(
      googleDriveId
    );

    if (!downloadUrl) {
      throw new Error("Could not get download URL from Google Drive");
    }

    // Download and cache
    return await downloadAndCachePdf(downloadUrl, fileName, courseId);
  } catch (error) {
    console.error("Error getting cached file or downloading:", error);

    // Final fallback: try to get view URL from Google Drive
    try {
      const { viewUrl } = await googleDriveAPI.getFileDownloadUrl(
        googleDriveId
      );
      return viewUrl || null;
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
      return null;
    }
  }
};

/**
 * Clear cache for a specific course
 * @param {string} courseId - Course ID
 * @returns {Promise<boolean>} - Success status
 */
export const clearCourseCache = async (courseId) => {
  try {
    const cacheDir = `${FileSystem.documentDirectory}courseFiles/${courseId}/`;
    const dirInfo = await FileSystem.getInfoAsync(cacheDir);

    if (dirInfo.exists) {
      await FileSystem.deleteAsync(cacheDir, { idempotent: true });
    }

    return true;
  } catch (error) {
    console.error("Error clearing course cache:", error);
    return false;
  }
};

/**
 * Clear all file cache
 * @returns {Promise<boolean>} - Success status
 */
export const clearAllCache = async () => {
  try {
    const cacheDir = `${FileSystem.documentDirectory}courseFiles/`;
    const dirInfo = await FileSystem.getInfoAsync(cacheDir);

    if (dirInfo.exists) {
      await FileSystem.deleteAsync(cacheDir, { idempotent: true });
    }

    return true;
  } catch (error) {
    console.error("Error clearing all cache:", error);
    return false;
  }
};

/**
 * Get cache size for a course
 * @param {string} courseId - Course ID
 * @returns {Promise<number>} - Cache size in bytes
 */
export const getCacheSize = async (courseId) => {
  try {
    const cacheDir = `${FileSystem.documentDirectory}courseFiles/${courseId}/`;
    const dirInfo = await FileSystem.getInfoAsync(cacheDir);

    if (!dirInfo.exists) {
      return 0;
    }

    const files = await FileSystem.readDirectoryAsync(cacheDir);
    let totalSize = 0;

    for (const file of files) {
      const filePath = `${cacheDir}${file}`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        totalSize += fileInfo.size || 0;
      }
    }

    return totalSize;
  } catch (error) {
    console.error("Error calculating cache size:", error);
    return 0;
  }
};
