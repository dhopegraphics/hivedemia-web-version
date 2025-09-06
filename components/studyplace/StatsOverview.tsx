import { BookOpen, FileText } from "lucide-react";

interface StatsOverviewProps {
  totalCourses: number;
  totalDocuments: number;
}

export default function StatsOverview({
  totalCourses,
  totalDocuments,
}: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="bg-white rounded-xl p-6 shadow-card border border-border-light">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-tertiary text-sm font-medium">
              Total Courses
            </p>
            <p className="text-3xl font-bold text-text-primary">
              {totalCourses}
            </p>
          </div>
          <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-card border border-border-light">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-tertiary text-sm font-medium">
              Total Documents
            </p>
            <p className="text-3xl font-bold text-text-primary">
              {totalDocuments}
            </p>
          </div>
          <div className="w-12 h-12 bg-gradient-secondary rounded-xl flex items-center justify-center">
            <FileText className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
