// Google Drive API Configuration
// Using Google Apps Script as a proxy for uploads

export const GOOGLE_DRIVE_CONFIG = {
  // Google Apps Script Web App URL (you'll create this)
  APPS_SCRIPT_URL:
    process.env.EXPO_PUBLIC_GOOGLE_APPS_SCRIPT_URL ||
    "YOUR_APPS_SCRIPT_URL_HERE",

  // Alternative: Direct API with your own backend
  BACKEND_UPLOAD_URL: process.env.EXPO_PUBLIC_BACKEND_UPLOAD_URL || "",

  // Google Drive folder structure
  FOLDERS: {
    ROOT_FOLDER: "Hivedemia", // Main app folder
    COURSE_FILES: "coursefiles", // User course files
    PUBLIC_NOTES: "crowdsources-notes", // Public shared notes
  },

  // Folder creation settings
  FOLDER_SETTINGS: {
    CREATE_USER_FOLDERS: true, // Create individual user folders
    CREATE_COURSE_FOLDERS: true, // Create course-specific folders
    FOLDER_PERMISSIONS: "reader", // Default sharing permission for folders
  },

  // File settings
  MAX_FILE_SIZE: 1024 * 1024 * 10, // 10MB max file size
  TIMEOUT: 60000, // 60 seconds timeout (uploads can take longer)
};

// MIME type mappings
export const MIME_TYPES = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain",
  md: "text/markdown",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
};
