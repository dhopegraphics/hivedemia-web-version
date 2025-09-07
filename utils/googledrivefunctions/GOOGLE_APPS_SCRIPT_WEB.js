/**
 * Google Apps Script for Google Drive File Upload Proxy - WEB VERSION
 * This version includes proper CORS headers for web applications
 *
 * Deploy this as a web app to handle file uploads from your Next.js web app
 *
 * Instructions:
 * 1. Go to script.google.com
 * 2. Create a new project
 * 3. Paste this code
 * 4. Deploy as web app with:
 *    - Execute as: Me (your account)
 *    - Who has access: Anyone (for CORS to work properly)
 * 5. Copy the web app URL to your NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL environment variable
 */

// Handle preflight OPTIONS requests for CORS
function doOptions(e) {
  return handleCORS();
}

// Handle POST requests
function doPost(e) {
  try {
    // Handle CORS for the actual request
    const corsResponse = handleCORS();

    // Parse the request
    const data = JSON.parse(e.postData.contents);

    // Handle different actions
    let result;
    switch (data.action) {
      case "deleteFile":
        result = deleteFile(data.fileId);
        break;
      case "deleteFolder":
        result = deleteFolder(data.folderStructure);
        break;
      case "getShareableLink":
        result = getShareableLink(data.fileId);
        break;
      default:
        // Default action is upload
        result = uploadFile(data);
        break;
    }

    // Add CORS headers to the result
    return addCORSHeaders(result);
  } catch (error) {
    console.error("doPost error:", error);
    const errorResponse = ContentService.createTextOutput(
      JSON.stringify({
        error: error.toString(),
        success: false,
      })
    ).setMimeType(ContentService.MimeType.JSON);

    return addCORSHeaders(errorResponse);
  }
}

// Handle GET requests (for testing)
function doGet(e) {
  const testResponse = ContentService.createTextOutput(
    JSON.stringify({
      message: "Google Drive API Proxy is running",
      timestamp: new Date().toISOString(),
      success: true,
    })
  ).setMimeType(ContentService.MimeType.JSON);

  return addCORSHeaders(testResponse);
}

// Add CORS headers to any response
function addCORSHeaders(response) {
  return response
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    .setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    )
    .setHeader("Access-Control-Max-Age", "86400"); // Cache preflight for 24 hours
}

// Handle CORS preflight requests
function handleCORS() {
  return ContentService.createTextOutput("")
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    .setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    )
    .setHeader("Access-Control-Max-Age", "86400");
}

function uploadFile(data) {
  try {
    const { fileName, mimeType, fileData, folderStructure, createFolders } =
      data;

    if (!fileName || !fileData) {
      throw new Error("Missing required fields: fileName or fileData");
    }

    console.log(`Starting upload for: ${fileName}`);

    // Decode base64 data
    const blob = Utilities.newBlob(
      Utilities.base64Decode(fileData),
      mimeType,
      fileName
    );

    // Create or find the target folder
    let targetFolder;
    if (folderStructure && createFolders) {
      targetFolder = createFolderStructure(folderStructure);
    } else {
      // Fallback to root folder
      targetFolder = DriveApp.getRootFolder();
    }

    // Upload file to the target folder
    const file = targetFolder.createFile(blob);

    // Make file publicly readable
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Create download URLs
    const fileId = file.getId();
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const viewUrl = `https://drive.google.com/file/d/${fileId}/view`;

    // Get file info
    const result = {
      success: true,
      id: fileId,
      name: file.getName(),
      size: file.getSize(),
      downloadUrl: downloadUrl,
      viewUrl: viewUrl,
      webViewLink: viewUrl,
      webContentLink: downloadUrl,
      fileName: file.getName(),
      fileSize: file.getSize(),
      mimeType: file.getBlob().getContentType(),
      folderId: targetFolder.getId(),
      folderPath: folderStructure ? folderStructure.join("/") : "root",
      uploadedAt: new Date().toISOString(),
    };

    console.log(
      `File uploaded successfully: ${fileName} to ${
        folderStructure ? folderStructure.join("/") : "root"
      }`
    );

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(
      ContentService.MimeType.JSON
    );
  } catch (error) {
    console.error("Upload error:", error);
    return ContentService.createTextOutput(
      JSON.stringify({
        error: error.toString(),
        success: false,
        timestamp: new Date().toISOString(),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function deleteFile(fileId) {
  try {
    if (!fileId) {
      throw new Error("File ID is required for deletion");
    }

    console.log(`Attempting to delete file: ${fileId}`);

    const file = DriveApp.getFileById(fileId);
    file.setTrashed(true);

    console.log(`File deleted successfully: ${fileId}`);

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        message: "File deleted successfully",
        fileId: fileId,
        timestamp: new Date().toISOString(),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error("Delete error:", error);

    // If file not found, consider it successfully deleted
    if (
      error.toString().includes("not found") ||
      error.toString().includes("Not Found")
    ) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          message: "File not found (already deleted)",
          fileId: fileId,
          timestamp: new Date().toISOString(),
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(
      JSON.stringify({
        error: error.toString(),
        success: false,
        fileId: fileId,
        timestamp: new Date().toISOString(),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function deleteFolder(folderStructure) {
  try {
    if (
      !folderStructure ||
      !Array.isArray(folderStructure) ||
      folderStructure.length === 0
    ) {
      throw new Error("Folder structure is required for folder deletion");
    }

    console.log(`Attempting to delete folder: ${folderStructure.join("/")}`);

    // Navigate to the target folder
    let currentFolder = DriveApp.getRootFolder();
    let folderPath = [];

    for (let i = 0; i < folderStructure.length; i++) {
      const folderName = folderStructure[i];
      folderPath.push(folderName);

      const folders = currentFolder.getFoldersByName(folderName);
      if (folders.hasNext()) {
        currentFolder = folders.next();
      } else {
        // Folder doesn't exist, consider it already deleted
        return ContentService.createTextOutput(
          JSON.stringify({
            success: true,
            message: `Folder not found (already deleted): ${folderPath.join(
              "/"
            )}`,
            folderPath: folderPath.join("/"),
            timestamp: new Date().toISOString(),
          })
        ).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // Check if folder is empty or only contains empty subfolders
    const files = currentFolder.getFiles();
    const subfolders = currentFolder.getFolders();

    let hasFiles = files.hasNext();
    let hasNonEmptySubfolders = false;

    // Check if any subfolders have content
    while (subfolders.hasNext() && !hasNonEmptySubfolders) {
      const subfolder = subfolders.next();
      const subFiles = subfolder.getFiles();
      const subSubfolders = subfolder.getFolders();
      if (subFiles.hasNext() || subSubfolders.hasNext()) {
        hasNonEmptySubfolders = true;
      }
    }

    if (!hasFiles && !hasNonEmptySubfolders) {
      // Safe to delete the folder
      currentFolder.setTrashed(true);
      console.log(`Folder deleted successfully: ${folderPath.join("/")}`);

      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          message: `Folder deleted successfully: ${folderPath.join("/")}`,
          folderPath: folderPath.join("/"),
          timestamp: new Date().toISOString(),
        })
      ).setMimeType(ContentService.MimeType.JSON);
    } else {
      // Folder has content, don't delete
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          message: `Folder not deleted (contains files): ${folderPath.join(
            "/"
          )}`,
          folderPath: folderPath.join("/"),
          timestamp: new Date().toISOString(),
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    console.error("Delete folder error:", error);

    return ContentService.createTextOutput(
      JSON.stringify({
        error: error.toString(),
        success: false,
        folderStructure: folderStructure,
        timestamp: new Date().toISOString(),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function getShareableLink(fileId) {
  try {
    if (!fileId) {
      throw new Error("File ID is required");
    }

    console.log(`Getting shareable link for: ${fileId}`);

    const file = DriveApp.getFileById(fileId);

    // Make sure file is publicly readable
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const viewUrl = `https://drive.google.com/file/d/${fileId}/view`;

    const result = {
      success: true,
      downloadUrl: downloadUrl,
      viewUrl: viewUrl,
      webViewLink: viewUrl,
      webContentLink: downloadUrl,
      fileName: file.getName(),
      fileSize: file.getSize(),
      fileId: fileId,
      timestamp: new Date().toISOString(),
    };

    console.log(`Shareable link created for: ${file.getName()}`);

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(
      ContentService.MimeType.JSON
    );
  } catch (error) {
    console.error("Get shareable link error:", error);

    return ContentService.createTextOutput(
      JSON.stringify({
        error: error.toString(),
        success: false,
        fileId: fileId,
        timestamp: new Date().toISOString(),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function createFolderStructure(folderNames) {
  try {
    let currentFolder = DriveApp.getRootFolder();

    for (let i = 0; i < folderNames.length; i++) {
      const folderName = folderNames[i];
      let foundFolder = null;

      // Search for existing folder
      const folders = currentFolder.getFoldersByName(folderName);
      if (folders.hasNext()) {
        foundFolder = folders.next();
        console.log(`Found existing folder: ${folderName}`);
      } else {
        // Create new folder
        foundFolder = currentFolder.createFolder(folderName);
        console.log(`Created new folder: ${folderName}`);
      }

      currentFolder = foundFolder;
    }

    console.log(`Folder structure ready: ${folderNames.join("/")}`);
    return currentFolder;
  } catch (error) {
    console.error("Error creating folder structure:", error);
    throw new Error(`Failed to create folder structure: ${error.toString()}`);
  }
}

// Test function to verify the script is working (accessible via GET request)
function testConnection() {
  return {
    message: "Google Drive API Proxy is working correctly",
    timestamp: new Date().toISOString(),
    version: "2.0.0-web",
    features: ["upload", "delete", "shareableLinks", "folderStructure", "CORS"],
    success: true,
  };
}

// Test folder creation function
function testFolderCreation() {
  const testStructure = [
    "Hivedemia",
    "Test",
    "WebVersion",
    new Date().getTime().toString(),
  ];

  try {
    const folder = createFolderStructure(testStructure);
    console.log("Test folder created successfully!");
    console.log("Folder name:", folder.getName());
    console.log("Folder ID:", folder.getId());
    console.log("Full path:", testStructure.join("/"));

    return {
      success: true,
      folderName: folder.getName(),
      folderId: folder.getId(),
      fullPath: testStructure.join("/"),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Test folder creation failed:", error);
    throw error;
  }
}
