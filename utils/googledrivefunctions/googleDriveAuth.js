// Google Drive Authentication Manager
// Simple proxy-based authentication

import { GOOGLE_DRIVE_CONFIG } from "./googleDriveConfig";

class GoogleDriveAuthManager {
  constructor() {
    // No authentication needed for proxy approach
  }

  // Check if proxy URL is configured
  isConfigured() {
    return (
      GOOGLE_DRIVE_CONFIG.APPS_SCRIPT_URL &&
      GOOGLE_DRIVE_CONFIG.APPS_SCRIPT_URL !== "YOUR_APPS_SCRIPT_URL_HERE"
    );
  }

  // Get headers for requests (simple)
  getAuthHeaders() {
    return {
      "Content-Type": "application/json",
    };
  }

  // Get upload headers
  getUploadAuthHeaders(contentType = "multipart/form-data") {
    return {
      "Content-Type": contentType,
    };
  }
}

// Export singleton instance
export const googleDriveAuth = new GoogleDriveAuthManager();
