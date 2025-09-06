import { useState } from "react";
import {
  ArrowLeft,
  Upload,
  FileText,
  Calendar,
  User,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import { Course } from "@/types/StudyPlaceTypes";
import { getIconComponent } from "@/utils/studyplace/helpers";

interface CourseDetailProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUploadFiles: (files: FileList) => void;
}

export default function CourseDetail({
  course,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onUploadFiles,
}: CourseDetailProps) {
  const [isDragging, setIsDragging] = useState(false);
  const IconComponent = getIconComponent(course.icon);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onUploadFiles(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onUploadFiles(files);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-surface-light p-6 border-b border-border-light">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-text-secondary" />
              </button>
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg"
                style={{ backgroundColor: course.color }}
              >
                <IconComponent className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">
                  {course.title}
                </h1>
                <p className="text-primary font-medium">{course.code}</p>
                {course.professor && (
                  <div className="flex items-center space-x-1 text-text-secondary mt-1">
                    <User className="h-4 w-4" />
                    <span>{course.professor}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={onEdit}
                className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
              >
                <Edit className="h-5 w-5" />
              </button>
              <button
                onClick={onDelete}
                className="p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
          {course.description && (
            <p className="text-text-secondary mt-4 max-w-2xl">
              {course.description}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-surface-light rounded-xl p-4 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-text-primary">
                {course.documentsCount}
              </p>
              <p className="text-sm text-text-secondary">Documents</p>
            </div>
            <div className="bg-surface-light rounded-xl p-4 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm font-medium text-text-primary">
                Last Updated
              </p>
              <p className="text-sm text-text-secondary">
                {course.lastUpdated}
              </p>
            </div>
            <div className="bg-surface-light rounded-xl p-4 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
                <Upload className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-text-primary">Ready for</p>
              <p className="text-sm text-text-secondary">Upload</p>
            </div>
          </div>

          {/* File Upload Area */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Upload Files
            </h2>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-surface-light"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Drag and drop files here
              </h3>
              <p className="text-text-secondary mb-4">
                or click to browse from your computer
              </p>
              <label className="inline-flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors cursor-pointer">
                <Plus className="h-4 w-4" />
                <span>Choose Files</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                />
              </label>
            </div>
          </div>

          {/* Recent Files */}
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Recent Files
            </h2>
            {course.files && course.files.length > 0 ? (
              <div className="space-y-3">
                {course.files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-4 bg-surface-light rounded-xl hover:bg-border-light transition-colors"
                  >
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium text-text-primary">
                        {file.name}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                    <div className="text-sm text-text-tertiary">
                      {new Date().toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-secondary">
                <FileText className="h-12 w-12 mx-auto mb-2 text-text-tertiary" />
                <p>No files uploaded yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
