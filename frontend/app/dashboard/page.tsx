import { BookOpen, Calendar, Brain, Users, TrendingUp, Clock, Award, ArrowRight, Plus } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 border border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark dark:text-white mb-2">Welcome back, John! 👋</h1>
            <p className="text-gray dark:text-light-gray">
              You have 3 upcoming tasks and 2 quiz sessions scheduled for today.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white dark:bg-dark-light rounded-lg p-4 shadow-card">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">85%</div>
                <div className="text-sm text-gray dark:text-light-gray">Study Progress</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Planner",
            description: "Manage tasks & schedule",
            icon: <Calendar className="h-6 w-6" />,
            href: "/dashboard/planner",
            color: "from-primary to-primary-light",
            count: "5 tasks",
          },
          {
            title: "Study Place",
            description: "Focus on learning",
            icon: <BookOpen className="h-6 w-6" />,
            href: "/dashboard/study",
            color: "from-secondary to-purple-400",
            count: "2 sessions",
          },
          {
            title: "Quiz Room",
            description: "Test your knowledge",
            icon: <Brain className="h-6 w-6" />,
            href: "/dashboard/quiz",
            color: "from-info-blue to-blue-400",
            count: "3 available",
          },
          {
            title: "Hubs",
            description: "Collaborate & compete",
            icon: <Users className="h-6 w-6" />,
            href: "/dashboard/hubs",
            color: "from-warning to-yellow-400",
            count: "2 new",
          },
        ].map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className="group bg-white dark:bg-dark-light rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div
              className={`w-12 h-12 bg-gradient-to-r ${item.color} rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}
            >
              {item.icon}
            </div>
            <h3 className="text-lg font-semibold text-dark dark:text-white mb-2">{item.title}</h3>
            <p className="text-gray dark:text-light-gray text-sm mb-3">{item.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-primary font-medium">{item.count}</span>
              <ArrowRight className="h-4 w-4 text-gray group-hover:text-primary transition-colors" />
            </div>
          </Link>
        ))}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-dark-light rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark dark:text-white">Study Streak</h3>
            <TrendingUp className="h-5 w-5 text-success" />
          </div>
          <div className="text-3xl font-bold text-primary mb-2">12 days</div>
          <p className="text-sm text-gray dark:text-light-gray">Keep it up! 🔥</p>
        </div>

        <div className="bg-white dark:bg-dark-light rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark dark:text-white">Time Studied</h3>
            <Clock className="h-5 w-5 text-info-blue" />
          </div>
          <div className="text-3xl font-bold text-secondary mb-2">4.5h</div>
          <p className="text-sm text-gray dark:text-light-gray">This week</p>
        </div>

        <div className="bg-white dark:bg-dark-light rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark dark:text-white">Quiz Score</h3>
            <Award className="h-5 w-5 text-warning" />
          </div>
          <div className="text-3xl font-bold text-warning mb-2">92%</div>
          <p className="text-sm text-gray dark:text-light-gray">Average</p>
        </div>
      </div>

      {/* Recent Activity & Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <div className="bg-white dark:bg-dark-light rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-dark dark:text-white">Upcoming Tasks</h3>
            <Link
              href="/dashboard/planner"
              className="text-primary hover:text-primary-dark text-sm font-medium transition-colors"
            >
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {[
              {
                title: "Complete Math Assignment",
                due: "Due in 2 hours",
                priority: "high",
                subject: "Mathematics",
              },
              {
                title: "Review Chemistry Notes",
                due: "Due tomorrow",
                priority: "medium",
                subject: "Chemistry",
              },
              {
                title: "Prepare for History Quiz",
                due: "Due in 3 days",
                priority: "low",
                subject: "History",
              },
            ].map((task, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-light dark:bg-dark rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      task.priority === "high"
                        ? "bg-danger-red"
                        : task.priority === "medium"
                          ? "bg-warning"
                          : "bg-success"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-dark dark:text-white">{task.title}</p>
                    <p className="text-xs text-gray dark:text-light-gray">{task.subject}</p>
                  </div>
                </div>
                <span className="text-xs text-gray dark:text-light-gray">{task.due}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 flex items-center justify-center py-2 border-2 border-dashed border-light-gray dark:border-dark-light rounded-lg text-gray dark:text-light-gray hover:border-primary hover:text-primary transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Add New Task
          </button>
        </div>

        {/* AI Recommendations */}
        <div className="bg-white dark:bg-dark-light rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-dark dark:text-white">AI Recommendations</h3>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-primary/10 to-transparent rounded-lg border-l-4 border-primary">
              <h4 className="font-medium text-dark dark:text-white mb-2">📚 Study Suggestion</h4>
              <p className="text-sm text-gray dark:text-light-gray">
                Based on your quiz performance, consider reviewing Chapter 5 of your Chemistry textbook.
              </p>
            </div>
            <div className="p-4 bg-gradient-to-r from-secondary/10 to-transparent rounded-lg border-l-4 border-secondary">
              <h4 className="font-medium text-dark dark:text-white mb-2">⏰ Schedule Optimization</h4>
              <p className="text-sm text-gray dark:text-light-gray">
                Your most productive study time is 2-4 PM. Consider scheduling important tasks during this window.
              </p>
            </div>
            <div className="p-4 bg-gradient-to-r from-info-blue/10 to-transparent rounded-lg border-l-4 border-info-blue">
              <h4 className="font-medium text-dark dark:text-white mb-2">🎯 Goal Tracking</h4>
              <p className="text-sm text-gray dark:text-light-gray">
                You're 80% towards your weekly study goal. Just 1 more hour to go!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
