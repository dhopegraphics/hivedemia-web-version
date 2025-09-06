import { Check, FileText, Calendar, Loader2 } from "lucide-react";
import { Course } from "@/types/StudyPlaceTypes";
import { getIconComponent } from "@/utils/studyplace/helpers";

interface CourseCardProps {
  course: Course;
  index: number;
  isSelectionMode: boolean;
  isSelected: boolean;
  isUploading: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export default function CourseCard({
  course,
  index,
  isSelectionMode,
  isSelected,
  isUploading,
  onClick,
  onContextMenu,
}: CourseCardProps) {
  const IconComponent = getIconComponent(course.icon);

  return (
    <div
      className={`group relative bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border-2 cursor-pointer animate-fade-in ${
        isSelectionMode
          ? isSelected
            ? "border-primary shadow-primary"
            : "border-border-light hover:border-primary/30"
          : "border-border-light hover:border-primary/30"
      }`}
      style={{ animationDelay: `${index * 0.1}s` }}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {/* Selection Checkbox */}
      {isSelectionMode && (
        <div className="absolute top-4 right-4 z-10">
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              isSelected
                ? "bg-primary border-primary"
                : "border-border bg-white"
            }`}
          >
            {isSelected && <Check className="h-4 w-4 text-white" />}
          </div>
        </div>
      )}

      {/* Course Icon */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg"
        style={{ backgroundColor: course.color }}
      >
        <IconComponent className="h-7 w-7" />
      </div>

      {/* Course Info */}
      <div className="space-y-2 mb-4">
        <h3 className="font-bold text-text-primary text-lg leading-tight group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        <p className="text-primary font-medium text-sm">{course.code}</p>
        {course.professor && (
          <p className="text-text-secondary text-sm">{course.professor}</p>
        )}
      </div>

      {/* Course Stats */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-1 text-text-secondary">
          <FileText className="h-4 w-4" />
          <span>{course.documentsCount} files</span>
        </div>
        <div className="flex items-center space-x-1 text-text-tertiary">
          <Calendar className="h-4 w-4" />
          <span>{course.lastUpdated}</span>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-primary mx-auto mb-2 animate-spin" />
            <p className="text-sm text-text-secondary">Uploading files...</p>
          </div>
        </div>
      )}
    </div>
  );
}
