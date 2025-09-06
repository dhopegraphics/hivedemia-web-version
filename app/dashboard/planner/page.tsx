"use client";

import { useState } from "react";
import {
  Calendar,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  Circle,
  Edit,
  Trash2,
  CalendarDays,
  Target,
  Sparkles,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  subject: string;
  completed: boolean;
  type: "assignment" | "exam" | "study" | "project";
}

export default function PlannerPage() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Complete Math Assignment",
      description: "Solve problems 1-20 from Chapter 5",
      dueDate: "2024-01-15",
      priority: "high",
      subject: "Mathematics",
      completed: false,
      type: "assignment",
    },
    {
      id: "2",
      title: "Chemistry Lab Report",
      description: "Write lab report for acid-base titration experiment",
      dueDate: "2024-01-16",
      priority: "medium",
      subject: "Chemistry",
      completed: false,
      type: "assignment",
    },
    {
      id: "3",
      title: "History Quiz Preparation",
      description: "Review chapters 8-10 for upcoming quiz",
      dueDate: "2024-01-18",
      priority: "medium",
      subject: "History",
      completed: true,
      type: "study",
    },
    {
      id: "4",
      title: "Physics Final Exam",
      description: "Comprehensive exam covering all semester topics",
      dueDate: "2024-01-25",
      priority: "high",
      subject: "Physics",
      completed: false,
      type: "exam",
    },
  ]);

  const [showAddTask, setShowAddTask] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "completed" && task.completed) ||
      (filter === "pending" && !task.completed) ||
      filter === task.priority;
    return matchesSearch && matchesFilter;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-danger-red bg-danger-red/10 border-danger-red/20";
      case "medium":
        return "text-warning bg-warning/10 border-warning/20";
      case "low":
        return "text-success bg-success/10 border-success/20";
      default:
        return "text-gray bg-gray/10 border-gray/20";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "exam":
        return "📝";
      case "assignment":
        return "📋";
      case "study":
        return "📚";
      case "project":
        return "🎯";
      default:
        return "📌";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Enhanced Header with AI Branding */}
      <div className="relative overflow-hidden bg-gradient-to-br from-info-subtle via-white to-warning-subtle rounded-2xl p-8 border border-info-blue/10">
        <div className="absolute inset-0 bg-gradient-to-r from-info-blue/5 to-warning/5"></div>
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-4 mb-6 lg:mb-0">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-info-blue to-info-light rounded-2xl flex items-center justify-center shadow-lg">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-warning rounded-full flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                AI Study Planner
              </h1>
              <p className="text-text-secondary text-lg">
                Intelligent task management and schedule optimization
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-sm text-text-tertiary">Completion Rate</div>
              <div className="text-2xl font-bold text-gradient">
                {Math.round(
                  (tasks.filter((t) => t.completed).length / tasks.length) * 100
                )}
                %
              </div>
            </div>
            <button
              onClick={() => setShowAddTask(true)}
              className="gradient-primary text-white px-6 py-3 rounded-xl font-semibold hover:shadow-glow transition-all duration-300 flex items-center transform hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Task
              <Sparkles className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Filters and Search */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-border-light">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-semibold text-text-primary mr-3 flex items-center">
              <Target className="h-4 w-4 mr-1" />
              Filter:
            </span>
            {["all", "pending", "completed", "high", "medium", "low"].map(
              (filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    filter === filterOption
                      ? "bg-gradient-primary text-white shadow-primary"
                      : "bg-surface hover:bg-surface-hover text-text-secondary hover:text-primary border border-border-light"
                  }`}
                >
                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                </button>
              )
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 border border-border-light rounded-xl bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all w-64"
            />
          </div>
        </div>
      </div>

      {/* Enhanced Tasks Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-success to-success-green rounded-lg flex items-center justify-center mr-3">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            Your Tasks
          </h2>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span className="text-text-secondary">
                Pending: {tasks.filter((t) => !t.completed).length}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-success rounded-full"></div>
              <span className="text-text-secondary">
                Completed: {tasks.filter((t) => t.completed).length}
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTasks.map((task, index) => (
            <div
              key={task.id}
              className={`group bg-white rounded-2xl p-6 shadow-card hover:shadow-card-elevated transition-all duration-500 animate-slide-up border border-border-light hover:border-primary/30 overflow-hidden relative ${
                task.completed ? "opacity-80" : ""
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-start space-x-4 mb-4">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="mt-1 text-primary hover:text-primary-dark transition-colors transform hover:scale-110"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    ) : (
                      <Circle className="h-6 w-6 hover:text-primary" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{getTypeIcon(task.type)}</span>
                      <h3
                        className={`font-bold text-lg ${
                          task.completed
                            ? "text-text-tertiary line-through"
                            : "text-text-primary group-hover:text-primary"
                        } transition-colors`}
                      >
                        {task.title}
                      </h3>
                    </div>
                    <p className="text-text-secondary mb-4 leading-relaxed">
                      {task.description}
                    </p>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="flex items-center space-x-2 bg-surface px-3 py-1 rounded-lg">
                        <CalendarDays className="h-4 w-4 text-text-tertiary" />
                        <span className="text-text-secondary font-medium">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="px-3 py-1 bg-gradient-to-r from-surface to-surface-secondary rounded-lg">
                        <span className="text-text-secondary font-medium">
                          {task.subject}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border-light">
                  <div className="flex items-center space-x-2 text-xs text-text-tertiary">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">
                      {Math.ceil(
                        (new Date(task.dueDate).getTime() -
                          new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{" "}
                      days left
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="text-text-tertiary hover:text-info-blue transition-colors p-2 rounded-lg hover:bg-surface">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-text-tertiary hover:text-danger-red transition-colors p-2 rounded-lg hover:bg-surface"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-br from-surface via-white to-primary-subtle rounded-2xl border border-border-light">
          <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-primary">
            <Calendar className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-text-primary mb-3">
            No tasks found
          </h3>
          <p className="text-text-secondary mb-6 max-w-md mx-auto">
            {searchTerm || filter !== "all"
              ? "Try adjusting your search criteria or filters to find what you're looking for"
              : "Start organizing your study schedule by adding your first task"}
          </p>
          {!searchTerm && filter === "all" && (
            <button
              onClick={() => setShowAddTask(true)}
              className="gradient-primary text-white px-6 py-3 rounded-xl font-semibold hover:shadow-glow transition-all duration-300 flex items-center mx-auto"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Task
            </button>
          )}
        </div>
      )}

      {/* Enhanced Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md animate-fade-in-scale shadow-card-elevated border border-border-light">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mr-4">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-text-primary">
                  Add New Task
                </h3>
                <p className="text-text-secondary">Create a new study task</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary-subtle to-surface p-6 rounded-xl mb-6">
              <p className="text-text-secondary text-center">
                <span className="text-2xl mb-2 block">🚀</span>
                Task creation form with AI suggestions would be implemented
                here...
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddTask(false)}
                className="flex-1 border-2 border-border-light text-text-secondary py-3 px-4 rounded-xl hover:bg-surface transition-all duration-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddTask(false)}
                className="flex-1 gradient-primary text-white py-3 px-4 rounded-xl hover:shadow-glow transition-all duration-300 font-semibold"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
