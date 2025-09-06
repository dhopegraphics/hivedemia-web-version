import { BookOpen, Plus } from "lucide-react";

interface EmptyStateProps {
  onCreateCourse: () => void;
}

export default function EmptyState({ onCreateCourse }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 bg-surface-light rounded-full flex items-center justify-center mx-auto mb-6">
        <BookOpen className="h-12 w-12 text-text-tertiary" />
      </div>
      <h3 className="text-xl font-semibold text-text-primary mb-2">
        No courses yet
      </h3>
      <p className="text-text-secondary mb-8 max-w-md mx-auto">
        Start your learning journey by creating your first course. Upload
        documents, organize your study materials, and track your progress.
      </p>
      <button
        onClick={onCreateCourse}
        className="inline-flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-4 w-4" />
        <span>Create Your First Course</span>
      </button>
    </div>
  );
}
