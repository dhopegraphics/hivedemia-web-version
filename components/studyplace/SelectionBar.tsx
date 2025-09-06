import { Trash2, X } from "lucide-react";

interface SelectionBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onBulkDelete: () => void;
  onExitSelection: () => void;
}

export default function SelectionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onBulkDelete,
  onExitSelection,
}: SelectionBarProps) {
  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-primary font-medium">
            {selectedCount} course{selectedCount !== 1 ? "s" : ""} selected
          </span>
          <button
            onClick={onSelectAll}
            className="text-primary hover:text-primary-dark transition-colors text-sm font-medium"
          >
            {selectedCount === totalCount ? "Deselect All" : "Select All"}
          </button>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onBulkDelete}
            disabled={selectedCount === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Selected</span>
          </button>
          <button
            onClick={onExitSelection}
            className="p-2 text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
