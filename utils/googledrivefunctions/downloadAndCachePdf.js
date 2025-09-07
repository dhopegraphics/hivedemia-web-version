// Web-compatible file download and caching system
// Converted from React Native file system to IndexedDB for browsers

// IndexedDB-based file cache for web browsers
class WebFileCache {
  constructor() {
    this.dbName = "HivedemiaFileCache";
    this.dbVersion = 1;
    this.storeName = "cachedFiles";
    this.db = null;
  }

  async initDB() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error("Failed to open IndexedDB:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: "id" });

          // Create indexes for better querying
          store.createIndex("courseId", "courseId", { unique: false });
          store.createIndex("fileName", "fileName", { unique: false });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }
      };
    });
  }

  async getCachedFile(fileId, courseId) {
    try {
      await this.initDB();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], "readonly");
        const store = transaction.objectStore(this.storeName);
        const request = store.get(fileId);

        request.onsuccess = () => {
          const result = request.result;
          if (result && result.courseId === courseId) {
            resolve(result);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          console.error("Error getting cached file:", request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error("Error accessing cached file:", error);
      return null;
    }
  }

  async setCachedFile(fileId, courseId, fileName, blob, originalUrl) {
    try {
      await this.initDB();

      return new Promise((resolve, reject) => {
        // Create blob URL for the cached file
        const blobUrl = URL.createObjectURL(blob);

        const fileData = {
          id: fileId,
          courseId: courseId,
          fileName: fileName,
          blob: blob,
          blobUrl: blobUrl,
          originalUrl: originalUrl,
          timestamp: Date.now(),
          size: blob.size,
        };

        const transaction = this.db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.put(fileData);

        request.onsuccess = () => {
          console.log(`File cached successfully: ${fileName}`);
          resolve(blobUrl);
        };

        request.onerror = () => {
          // Clean up blob URL on error
          URL.revokeObjectURL(blobUrl);
          console.error("Error caching file:", request.error);
          reject(request.error);
        };

        transaction.onerror = () => {
          URL.revokeObjectURL(blobUrl);
          console.error("Transaction error:", transaction.error);
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error("Error setting cached file:", error);
      throw error;
    }
  }

  async clearCourseCache(courseId) {
    try {
      await this.initDB();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const index = store.index("courseId");
        const request = index.openCursor(IDBKeyRange.only(courseId));

        const filesToDelete = [];

        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            filesToDelete.push(cursor.value);
            cursor.delete(); // Delete the record
            cursor.continue();
          } else {
            // All records deleted, now clean up blob URLs
            filesToDelete.forEach((file) => {
              if (file.blobUrl) {
                URL.revokeObjectURL(file.blobUrl);
              }
            });
            console.log(
              `Cleared cache for course: ${courseId}, deleted ${filesToDelete.length} files`
            );
            resolve(filesToDelete.length);
          }
        };

        request.onerror = () => {
          console.error("Error clearing course cache:", request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error("Error clearing course cache:", error);
      throw error;
    }
  }

  async getCachedFiles(courseId) {
    try {
      await this.initDB();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], "readonly");
        const store = transaction.objectStore(this.storeName);
        const index = store.index("courseId");
        const request = index.getAll(courseId);

        request.onsuccess = () => {
          const files = request.result || [];
          resolve(
            files.map((file) => ({
              id: file.id,
              fileName: file.fileName,
              size: file.size,
              timestamp: file.timestamp,
              blobUrl: file.blobUrl,
            }))
          );
        };

        request.onerror = () => {
          console.error("Error getting cached files:", request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error("Error getting cached files:", error);
      return [];
    }
  }

  async getCacheSize(courseId = null) {
    try {
      await this.initDB();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], "readonly");
        const store = transaction.objectStore(this.storeName);

        let request;
        if (courseId) {
          const index = store.index("courseId");
          request = index.getAll(courseId);
        } else {
          request = store.getAll();
        }

        request.onsuccess = () => {
          const files = request.result || [];
          const totalSize = files.reduce(
            (sum, file) => sum + (file.size || 0),
            0
          );
          resolve(totalSize);
        };

        request.onerror = () => {
          console.error("Error calculating cache size:", request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error("Error calculating cache size:", error);
      return 0;
    }
  }

  async clearAllCache() {
    try {
      await this.initDB();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);

        // First get all files to clean up blob URLs
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          const files = getAllRequest.result || [];

          // Clean up all blob URLs
          files.forEach((file) => {
            if (file.blobUrl) {
              URL.revokeObjectURL(file.blobUrl);
            }
          });

          // Clear the store
          const clearRequest = store.clear();

          clearRequest.onsuccess = () => {
            console.log(`Cleared all cache, deleted ${files.length} files`);
            resolve(files.length);
          };

          clearRequest.onerror = () => {
            console.error("Error clearing all cache:", clearRequest.error);
            reject(clearRequest.error);
          };
        };

        getAllRequest.onerror = () => {
          console.error(
            "Error getting all files for cleanup:",
            getAllRequest.error
          );
          reject(getAllRequest.error);
        };
      });
    } catch (error) {
      console.error("Error clearing all cache:", error);
      throw error;
    }
  }
}

// Create a singleton instance
const fileCache = new WebFileCache();

/**
 * Downloads a file from Google Drive and caches it in IndexedDB
 * @param {string} googleDriveUrl - The Google Drive URL to download
 * @param {string} fileName - The name of the file
 * @param {string} courseId - The course ID for organization
 * @returns {Promise<string>} - Returns a blob URL for the cached file
 */
export const downloadAndCachePdf = async (
  googleDriveUrl,
  fileName,
  courseId
) => {
  try {
    if (!googleDriveUrl || !fileName || !courseId) {
      throw new Error(
        "Missing required parameters: googleDriveUrl, fileName, or courseId"
      );
    }

    // Create a unique file ID based on the URL and course
    const fileId = `${courseId}_${fileName}_${btoa(googleDriveUrl).slice(
      0,
      10
    )}`;

    // Check if file is already cached
    const cachedFile = await fileCache.getCachedFile(fileId, courseId);
    if (cachedFile && cachedFile.blobUrl) {
      console.log(`Using cached file: ${fileName}`);
      return cachedFile.blobUrl;
    }

    console.log(`Downloading and caching file: ${fileName}`);

    // Download the file
    const response = await fetch(googleDriveUrl, {
      method: "GET",
      headers: {
        Accept: "*/*",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to download file: ${response.status} ${response.statusText}`
      );
    }

    // Get the blob
    const blob = await response.blob();

    if (!blob || blob.size === 0) {
      throw new Error("Downloaded file is empty or invalid");
    }

    // Cache the file and get blob URL
    const blobUrl = await fileCache.setCachedFile(
      fileId,
      courseId,
      fileName,
      blob,
      googleDriveUrl
    );

    console.log(
      `File downloaded and cached successfully: ${fileName} (${(
        blob.size /
        1024 /
        1024
      ).toFixed(2)} MB)`
    );
    return blobUrl;
  } catch (error) {
    console.error("Error downloading and caching file:", error);

    // Return the original URL as fallback
    console.log("Falling back to original URL:", googleDriveUrl);
    return googleDriveUrl;
  }
};

/**
 * Clears cached files for a specific course
 * @param {string} courseId - The course ID
 * @returns {Promise<number>} - Number of files deleted
 */
export const clearCourseCache = async (courseId) => {
  try {
    return await fileCache.clearCourseCache(courseId);
  } catch (error) {
    console.error("Error clearing course cache:", error);
    return 0;
  }
};

/**
 * Gets all cached files for a course
 * @param {string} courseId - The course ID
 * @returns {Promise<Array>} - Array of cached file info
 */
export const getCachedFiles = async (courseId) => {
  try {
    return await fileCache.getCachedFiles(courseId);
  } catch (error) {
    console.error("Error getting cached files:", error);
    return [];
  }
};

/**
 * Gets the total cache size
 * @param {string} courseId - Optional course ID to get size for specific course
 * @returns {Promise<number>} - Cache size in bytes
 */
export const getCacheSize = async (courseId = null) => {
  try {
    return await fileCache.getCacheSize(courseId);
  } catch (error) {
    console.error("Error getting cache size:", error);
    return 0;
  }
};

/**
 * Clears all cached files
 * @returns {Promise<number>} - Number of files deleted
 */
export const clearAllCache = async () => {
  try {
    return await fileCache.clearAllCache();
  } catch (error) {
    console.error("Error clearing all cache:", error);
    return 0;
  }
};

// Export the cache instance for advanced usage
export { fileCache };

// Default export for backward compatibility
export default downloadAndCachePdf;
