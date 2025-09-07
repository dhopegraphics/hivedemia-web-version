import React from "react";
import { Course } from "@/types/StudyPlaceTypes";
import { useCourseFileManager } from "@/hooks/useCourseFileManager";

interface IntegratedCourseDetailProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onFileCountUpdate?: (courseId: string, newCount: number) => void;
}

export const IntegratedCourseDetail: React.FC<IntegratedCourseDetailProps> = ({
  course,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onFileCountUpdate,
}) => {
  // Use the integrated file manager for this course
  const fileManager = useCourseFileManager(
    course.id,
    course.title,
    (newCount) => {
      // Notify parent component of file count changes
      if (onFileCountUpdate) {
        onFileCountUpdate(course.id, newCount);
      }
    }
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Course Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{course.title}</h2>
            <p className="text-gray-600">Code: {course.code}</p>
            {course.professor && (
              <p className="text-gray-600">Professor: {course.professor}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Course Description */}
        {course.description && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-700">{course.description}</p>
          </div>
        )}

        {/* File Management Section */}
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Course Files ({fileManager.files.length})
            </h3>
            <button
              onClick={fileManager.handleFileUpload}
              disabled={fileManager.uploading || fileManager.isPickingDocument}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {fileManager.uploading
                ? `Uploading... ${fileManager.uploadProgress}%`
                : fileManager.isPickingDocument
                ? "Selecting Files..."
                : "Upload Files"}
            </button>
          </div>

          {/* Upload Progress */}
          {fileManager.uploading && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${fileManager.uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {fileManager.progressMode === "upload"
                  ? "Uploading files..."
                  : "Processing..."}
              </p>
            </div>
          )}

          {/* Files List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fileManager.files.map((file) => (
              <div key={file.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-sm truncate flex-1">
                    {file.name}
                  </h4>
                  <button
                    onClick={() =>
                      fileManager.handleFileDelete(file.id, file.filePath)
                    }
                    className="text-red-600 hover:text-red-800 ml-2"
                    title="Delete file"
                  >
                    🗑️
                  </button>
                </div>
                <p className="text-xs text-gray-600">Type: {file.type}</p>
                <p className="text-xs text-gray-600">Size: {file.size}</p>
                <p className="text-xs text-gray-600">Date: {file.date}</p>
                {file.url && file.url !== "not defined" && (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-xs underline"
                  >
                    View File
                  </a>
                )}
              </div>
            ))}
          </div>

          {fileManager.files.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No files uploaded yet.</p>
              <p className="text-sm">
                Click &quot;Upload Files&quot; to add course materials.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
