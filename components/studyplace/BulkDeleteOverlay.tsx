import { AlertTriangle, Loader2 } from "lucide-react";

interface BulkDeleteOverlayProps {
  isVisible: boolean;
  selectedCount: number;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function BulkDeleteOverlay({
  isVisible,
  selectedCount,
  isDeleting,
  onConfirm,
  onCancel,
}: BulkDeleteOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-scale-in">
        {/* Icon */}
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-text-primary mb-2">
            Delete Courses
          </h2>
          <p className="text-text-secondary">
            Are you sure you want to delete {selectedCount} selected course
            {selectedCount > 1 ? "s" : ""}? This action cannot be undone and
            will remove all associated files and data.
          </p>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 border border-border text-text-secondary rounded-xl hover:bg-surface-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-red-500 text-white px-4 py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete {selectedCount > 1 ? "Courses" : "Course"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
