import { useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { Course, CourseFormData } from "@/types/StudyPlaceTypes";
import { COURSE_ICONS, COURSE_COLORS } from "@/utils/studyplace/constants";
import { getIconComponent } from "@/utils/studyplace/helpers";

interface CourseFormProps {
  course?: Course;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: CourseFormData) => Promise<void>;
}

export default function CourseForm({
  course,
  isOpen,
  onClose,
  onSubmit,
}: CourseFormProps) {
  const [formData, setFormData] = useState<CourseFormData>({
    title: course?.title || "",
    code: course?.code || "",
    professor: course?.professor || "",
    description: course?.description || "",
    icon: course?.icon || "BookOpen",
    color: course?.color || COURSE_COLORS[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "Course title is required";
    if (!formData.code.trim()) newErrors.code = "Course code is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Error submitting course:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CourseFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-primary">
            {course ? "Edit Course" : "Create New Course"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-light rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Title */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Course Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                errors.title ? "border-red-500" : "border-border"
              }`}
              placeholder="e.g., Introduction to Computer Science"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Course Code */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Course Code *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => handleInputChange("code", e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                errors.code ? "border-red-500" : "border-border"
              }`}
              placeholder="e.g., CS101"
            />
            {errors.code && (
              <p className="text-red-500 text-sm mt-1">{errors.code}</p>
            )}
          </div>

          {/* Professor */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Professor (Optional)
            </label>
            <input
              type="text"
              value={formData.professor}
              onChange={(e) => handleInputChange("professor", e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="e.g., Dr. Jane Smith"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
              placeholder="Brief description of the course..."
              rows={3}
            />
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Course Icon
            </label>
            <div className="grid grid-cols-6 gap-2 mb-3">
              {COURSE_ICONS.map((iconName) => {
                const IconComponent = getIconComponent(iconName);
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, icon: iconName }))
                    }
                    className={`p-3 rounded-lg border-2 transition-all hover:bg-surface-light ${
                      formData.icon === iconName
                        ? "border-primary bg-primary/10"
                        : "border-border"
                    }`}
                  >
                    <IconComponent className="h-5 w-5 text-text-primary mx-auto" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Course Color
            </label>
            <div className="grid grid-cols-8 gap-2">
              {COURSE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    formData.color === color
                      ? "border-text-primary scale-110"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Preview
            </label>
            <div className="flex items-center space-x-3 p-4 bg-surface-light rounded-xl">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: formData.color }}
              >
                {(() => {
                  const IconComponent = getIconComponent(formData.icon);
                  return <IconComponent className="h-6 w-6" />;
                })()}
              </div>
              <div>
                <h3 className="font-medium text-text-primary">
                  {formData.title || "Course Title"}
                </h3>
                <p className="text-sm text-primary">
                  {formData.code || "COURSE"}
                </p>
                {formData.professor && (
                  <p className="text-xs text-text-secondary">
                    {formData.professor}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-border text-text-secondary rounded-xl hover:bg-surface-light transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-primary text-white px-4 py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>{course ? "Update Course" : "Create Course"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
