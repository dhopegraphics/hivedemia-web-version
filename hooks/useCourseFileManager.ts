import { useState } from "react";
import { useFileOperations } from "@/utils/googledrivefunctions/useFileOperations";
import { useLoadFiles } from "@/utils/googledrivefunctions/useLoadFiles";

// Define file interface
interface CourseFile {
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
  url: string;
  unprocessedUrl: string;
  filePath: string;
  googleDriveId?: string;
}

export interface CourseFileManager {
  files: CourseFile[];
  setFiles: (files: CourseFile[]) => void;
  handleFileUpload: () => Promise<void>;
  handleFileDelete: (fileId: string, filePath: string) => Promise<void>;
  uploading: boolean;
  uploadProgress: number;
  progressMode: string;
  isPickingDocument: boolean;
  refreshFiles: () => void;
}

export const useCourseFileManager = (
  courseId: string,
  courseTitle: string,
  onFileCountChange?: (newCount: number) => void
): CourseFileManager => {
  const [files, setFiles] = useState<CourseFile[]>([]);

  // Enhanced setFiles that notifies parent of count changes
  const setFilesWithCallback = (newFiles: CourseFile[]) => {
    setFiles(newFiles);
    if (onFileCountChange) {
      onFileCountChange(newFiles.length);
    }
  };

  // Use file operations hook
  const fileOps = useFileOperations({
    id: courseId,
    setFiles: setFilesWithCallback,
    courseTitle,
  });

  // Use load files hook
  useLoadFiles({
    id: courseId,
    setFiles: setFilesWithCallback,
  });

  // Manual refresh function
  const refreshFiles = () => {
    // Force reload by clearing cache and reloading
    if (typeof window !== "undefined") {
      localStorage.removeItem(`course-files-${courseId}`);
    }
    // The useLoadFiles hook will automatically reload
  };

  return {
    files,
    setFiles: setFilesWithCallback,
    refreshFiles,
    ...fileOps,
  };
};
