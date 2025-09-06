"use client";

import {
  BookOpen,
  Calendar,
  Brain,
  Users,
  TrendingUp,
  Clock,
  Award,
  ArrowRight,
  Plus,
  Target,
  Trophy,
  CheckCircle,
  Lightbulb,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/backend/store/authStore";

export default function DashboardPage() {
  const { session } = useAuthStore();

  // Get user name from session, fallback to 'Student'
  const userName = session?.user?.email?.split("@")[0] || "Student";

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Welcome Header Section */}
      <div className="bg-gradient-to-br from-primary/5 via-white to-secondary/5 rounded-2xl p-8 border border-primary/10 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center shadow-primary/20 shadow-lg">
                <span className="text-white font-bold text-lg">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-text-primary">
                  Welcome back, {userName}! 👋
                </h1>
                <p className="text-text-secondary text-lg">
                  Ready to supercharge your learning today?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full">
                <Target className="h-4 w-4" />
                <span className="font-medium">3 tasks due today</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/10 text-secondary rounded-full">
                <Brain className="h-4 w-4" />
                <span className="font-medium">2 AI quizzes ready</span>
              </div>
            </div>
          </div>

          {/* Progress Ring */}
          <div className="flex-shrink-0">
            <div className="relative w-24 h-24">
              <svg
                className="w-24 h-24 transform -rotate-90"
                viewBox="0 0 36 36"
              >
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="85, 100"
                  className="text-primary"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="0, 100"
                  className="text-surface-secondary"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xl font-bold text-primary">85%</div>
                  <div className="text-xs text-text-tertiary">Progress</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Smart Planner",
            description: "AI-powered task management",
            icon: <Calendar className="h-7 w-7" />,
            href: "/dashboard/planner",
            gradient: "from-primary via-primary-light to-success",
            count: "5 tasks today",
            badge: "urgent",
            bgColor: "bg-primary/5",
            borderColor: "border-primary/20",
          },
          {
            title: "Study Space",
            description: "Focus time & productivity",
            icon: <BookOpen className="h-7 w-7" />,
            href: "/dashboard/study",
            gradient: "from-secondary via-purple-400 to-pink-400",
            count: "2.5h today",
            badge: "active",
            bgColor: "bg-secondary/5",
            borderColor: "border-secondary/20",
          },
          {
            title: "AI Quiz Hub",
            description: "Smart knowledge testing",
            icon: <Brain className="h-7 w-7" />,
            href: "/dashboard/quiz",
            gradient: "from-info-blue via-blue-400 to-cyan-400",
            count: "3 new quizzes",
            badge: "new",
            bgColor: "bg-info-blue/5",
            borderColor: "border-info-blue/20",
          },
          {
            title: "Learning Hubs",
            description: "Collaborate & compete",
            icon: <Users className="h-7 w-7" />,
            href: "/dashboard/hubs",
            gradient: "from-warning via-orange-400 to-red-400",
            count: "4 competitions",
            badge: "hot",
            bgColor: "bg-warning/5",
            borderColor: "border-warning/20",
          },
        ].map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className={`group relative bg-white rounded-2xl p-6 border ${item.borderColor} shadow-sm hover:shadow-lg transition-all duration-300 animate-slide-up hover:scale-105 hover-lift`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Background Pattern */}
            <div
              className={`absolute inset-0 ${item.bgColor} rounded-2xl opacity-50`}
            />

            {/* Content */}
            <div className="relative z-10">
              {/* Icon & Badge */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-14 h-14 bg-gradient-to-r ${item.gradient} rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}
                >
                  {item.icon}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      item.badge === "urgent"
                        ? "bg-danger-red/10 text-danger-red"
                        : item.badge === "active"
                        ? "bg-success/10 text-success"
                        : item.badge === "new"
                        ? "bg-info-blue/10 text-info-blue"
                        : "bg-warning/10 text-warning"
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>
              </div>

              {/* Text Content */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-text-primary group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-text-secondary line-clamp-2">
                  {item.description}
                </p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-medium text-text-tertiary">
                    {item.count}
                  </span>
                  <ArrowRight className="h-4 w-4 text-text-tertiary group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            title: "Study Streak",
            value: "12",
            unit: "days",
            change: "+2 from last week",
            icon: <TrendingUp className="h-6 w-6" />,
            color: "text-success",
            bgColor: "bg-success/10",
            trend: "up",
          },
          {
            title: "Focus Time",
            value: "4.5",
            unit: "hours",
            change: "This week",
            icon: <Clock className="h-6 w-6" />,
            color: "text-info-blue",
            bgColor: "bg-info-blue/10",
            trend: "stable",
          },
          {
            title: "Quiz Average",
            value: "92",
            unit: "%",
            change: "+5% improvement",
            icon: <Award className="h-6 w-6" />,
            color: "text-warning",
            bgColor: "bg-warning/10",
            trend: "up",
          },
          {
            title: "Rank Position",
            value: "#8",
            unit: "in class",
            change: "↑3 positions",
            icon: <Trophy className="h-6 w-6" />,
            color: "text-secondary",
            bgColor: "bg-secondary/10",
            trend: "up",
          },
        ].map((metric, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in hover-lift"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-12 h-12 ${metric.bgColor} rounded-xl flex items-center justify-center`}
              >
                <span className={metric.color}>{metric.icon}</span>
              </div>
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  metric.trend === "up"
                    ? "bg-success/10 text-success"
                    : "bg-gray-100 text-text-tertiary"
                }`}
              >
                {metric.trend === "up" ? "↗️" : "📊"}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-text-secondary">
                {metric.title}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-text-primary">
                  {metric.value}
                </span>
                <span className="text-sm text-text-tertiary">
                  {metric.unit}
                </span>
              </div>
              <p className="text-xs text-text-tertiary">{metric.change}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Today's Agenda */}
        <div className="xl:col-span-2 space-y-6">
          {/* Upcoming Tasks */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">
                    Today&apos;s Tasks
                  </h3>
                  <p className="text-sm text-text-secondary">
                    3 tasks • 2 overdue
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/planner"
                className="flex items-center gap-1 text-primary hover:text-primary-dark text-sm font-medium transition-colors group"
              >
                View all
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="space-y-3">
              {[
                {
                  title: "Complete Advanced Calculus Assignment",
                  subject: "Mathematics",
                  due: "Due in 2 hours",
                  priority: "high",
                  progress: 60,
                  type: "assignment",
                },
                {
                  title: "Review Organic Chemistry Notes",
                  subject: "Chemistry",
                  due: "Due tomorrow",
                  priority: "medium",
                  progress: 30,
                  type: "study",
                },
                {
                  title: "Prepare History Presentation",
                  subject: "History",
                  due: "Due in 3 days",
                  priority: "low",
                  progress: 0,
                  type: "project",
                },
              ].map((task, index) => (
                <div
                  key={index}
                  className="group flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-primary/20 hover:bg-primary/5 transition-all duration-200"
                >
                  {/* Priority & Type Indicator */}
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        task.priority === "high"
                          ? "bg-danger-red"
                          : task.priority === "medium"
                          ? "bg-warning"
                          : "bg-success"
                      }`}
                    />
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${
                        task.type === "assignment"
                          ? "bg-primary/10 text-primary"
                          : task.type === "study"
                          ? "bg-info-blue/10 text-info-blue"
                          : "bg-secondary/10 text-secondary"
                      }`}
                    >
                      {task.type === "assignment"
                        ? "📝"
                        : task.type === "study"
                        ? "📚"
                        : "📊"}
                    </div>
                  </div>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-text-primary group-hover:text-primary transition-colors line-clamp-1">
                          {task.title}
                        </h4>
                        <p className="text-sm text-text-secondary">
                          {task.subject}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          task.due.includes("hour")
                            ? "bg-danger-red/10 text-danger-red"
                            : task.due.includes("tomorrow")
                            ? "bg-warning/10 text-warning"
                            : "bg-gray-100 text-text-tertiary"
                        }`}
                      >
                        {task.due}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-tertiary">Progress</span>
                        <span className="text-text-secondary font-medium">
                          {task.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            task.progress > 75
                              ? "bg-success"
                              : task.progress > 50
                              ? "bg-warning"
                              : task.progress > 25
                              ? "bg-info-blue"
                              : "bg-gray-300"
                          }`}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Task Button */}
            <button className="w-full mt-4 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 hover:border-primary hover:bg-primary/5 rounded-xl text-text-secondary hover:text-primary transition-all duration-200 group">
              <Plus className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Add new task</span>
            </button>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-info-blue/10 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-info-blue" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">
                    Recent Activity
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Your learning journey
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  action: "Completed",
                  item: "Physics Quiz #5",
                  score: "94%",
                  time: "2 hours ago",
                  type: "quiz",
                },
                {
                  action: "Studied",
                  item: "Calculus Chapter 12",
                  duration: "45 min",
                  time: "Yesterday",
                  type: "study",
                },
                {
                  action: "Joined",
                  item: "Math Competition",
                  participants: "156",
                  time: "2 days ago",
                  type: "competition",
                },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${
                      activity.type === "quiz"
                        ? "bg-success/10 text-success"
                        : activity.type === "study"
                        ? "bg-primary/10 text-primary"
                        : "bg-warning/10 text-warning"
                    }`}
                  >
                    {activity.type === "quiz"
                      ? "🎯"
                      : activity.type === "study"
                      ? "📖"
                      : "🏆"}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">
                      {activity.action}{" "}
                      <span className="text-primary">{activity.item}</span>
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {activity.time}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-text-secondary">
                      {activity.score ||
                        activity.duration ||
                        activity.participants}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Assistant Sidebar */}
        <div className="space-y-6">
          {/* AI Recommendations */}
          <div className="bg-gradient-to-br from-primary/5 via-white to-secondary/5 rounded-2xl p-6 border border-primary/10 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center shadow-primary/20 shadow-lg">
                <Lightbulb className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  AI Insights
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-sm text-text-secondary">
                    Personalized for you
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  type: "study",
                  title: "Optimize Study Schedule",
                  description:
                    "Your peak learning time is 2-4 PM. Consider moving important subjects to this window.",
                  action: "Reschedule",
                  gradient: "from-primary/10 to-primary/5",
                  border: "border-primary/20",
                },
                {
                  type: "review",
                  title: "Review Reminder",
                  description:
                    "Chemistry concepts from last week need review. Quiz score suggests knowledge gaps.",
                  action: "Review Now",
                  gradient: "from-warning/10 to-warning/5",
                  border: "border-warning/20",
                },
                {
                  type: "achievement",
                  title: "Goal Progress",
                  description:
                    "You're 80% towards your weekly study goal. Just 1 more focused session!",
                  action: "Start Session",
                  gradient: "from-success/10 to-success/5",
                  border: "border-success/20",
                },
              ].map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 bg-gradient-to-r ${insight.gradient} rounded-xl border ${insight.border} group hover:shadow-sm transition-all duration-200`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/50 flex items-center justify-center text-lg flex-shrink-0">
                      {insight.type === "study"
                        ? "📅"
                        : insight.type === "review"
                        ? "🔄"
                        : "🎯"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-text-primary mb-1">
                        {insight.title}
                      </h4>
                      <p className="text-sm text-text-secondary mb-3 line-clamp-2">
                        {insight.description}
                      </p>
                      <button className="text-sm font-medium text-primary hover:text-primary-dark transition-colors">
                        {insight.action} →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              This Week
            </h3>
            <div className="space-y-4">
              {[
                {
                  label: "Study Sessions",
                  value: "12",
                  icon: "📚",
                  change: "+3",
                },
                {
                  label: "Quizzes Completed",
                  value: "8",
                  icon: "🎯",
                  change: "+2",
                },
                {
                  label: "Hours Focused",
                  value: "18.5",
                  icon: "⏱️",
                  change: "+4.5",
                },
                {
                  label: "Rank Movement",
                  value: "#8",
                  icon: "🏆",
                  change: "↑3",
                },
              ].map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{stat.icon}</span>
                    <span className="text-sm text-text-secondary">
                      {stat.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">
                      {stat.value}
                    </span>
                    <span className="text-xs text-success font-medium">
                      {stat.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
