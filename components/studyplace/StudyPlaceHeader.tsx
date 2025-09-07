import { Search, Brain, Plus, Sparkles } from "lucide-react";

interface StudyPlaceHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateCourse: () => void;
  totalCourses?: number;
  activeStudents?: number;
}

export default function StudyPlaceHeader({
  searchQuery,
  onSearchChange,
  onCreateCourse,
}: StudyPlaceHeaderProps) {
  return (
    <div className="sticky top-0  mb-8">
      {/* Enhanced Header with AI Branding */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl p-8 border border-blue-100/50 shadow-lg backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-4 mb-6 lg:mb-0">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Study Hive
              </h1>
              <p className="text-gray-600 text-lg">
                Intelligent learning hub and course management
              </p>
            </div>
          </div>

          {/* Search and Stats Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-6 space-y-4 lg:space-y-0">
            {/* Stats */}

            {/* Search Bar */}
            <div className="relative min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses, topics, or materials..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 shadow-sm"
              />
            </div>

            {/* Create Course Button */}
            <button
              onClick={onCreateCourse}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center transform hover:scale-105 active:scale-95"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Course
              <Sparkles className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
