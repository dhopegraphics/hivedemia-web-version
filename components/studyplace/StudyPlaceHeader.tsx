import { Search, Brain, Plus } from "lucide-react";

interface StudyPlaceHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateCourse: () => void;
}

export default function StudyPlaceHeader({
  searchQuery,
  onSearchChange,
  onCreateCourse,
}: StudyPlaceHeaderProps) {
  return (
    <div className="bg-white shadow-sm border-b border-border-light sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-sm">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gradient">Study Hive</h1>
            </div>
          </div>
          <div className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-white text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div>
            <button
              onClick={onCreateCourse}
              className="inline-flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Course</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
