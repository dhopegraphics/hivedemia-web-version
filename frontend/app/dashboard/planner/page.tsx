"use client"

import { useState } from "react"
import { Calendar, Plus, Search, Clock, CheckCircle2, Circle, Edit, Trash2, CalendarDays } from "lucide-react"

interface Task {
  id: string
  title: string
  description: string
  dueDate: string
  priority: "high" | "medium" | "low"
  subject: string
  completed: boolean
  type: "assignment" | "exam" | "study" | "project"
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
  ])

  const [showAddTask, setShowAddTask] = useState(false)
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const toggleTask = (id: string) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter =
      filter === "all" ||
      (filter === "completed" && task.completed) ||
      (filter === "pending" && !task.completed) ||
      filter === task.priority
    return matchesSearch && matchesFilter
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-danger-red bg-danger-red/10 border-danger-red/20"
      case "medium":
        return "text-warning bg-warning/10 border-warning/20"
      case "low":
        return "text-success bg-success/10 border-success/20"
      default:
        return "text-gray bg-gray/10 border-gray/20"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "exam":
        return "📝"
      case "assignment":
        return "📋"
      case "study":
        return "📚"
      case "project":
        return "🎯"
      default:
        return "📌"
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white mb-2">Study Planner</h1>
          <p className="text-gray dark:text-light-gray">Organize your tasks and manage your study schedule</p>
        </div>
        <button
          onClick={() => setShowAddTask(true)}
          className="mt-4 sm:mt-0 gradient-primary text-white px-4 py-2 rounded-lg font-medium hover:shadow-glow transition-all duration-300 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-dark-light rounded-xl p-6 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-wrap gap-2">
            {["all", "pending", "completed", "high", "medium", "low"].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === filterOption
                    ? "bg-primary text-white"
                    : "bg-light-gray/50 dark:bg-dark/50 text-gray dark:text-light-gray hover:bg-primary/10 hover:text-primary"
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-light-gray dark:border-dark-light rounded-lg bg-light dark:bg-dark text-dark dark:text-white placeholder-gray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTasks.map((task, index) => (
          <div
            key={task.id}
            className={`bg-white dark:bg-dark-light rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 animate-slide-up ${
              task.completed ? "opacity-75" : ""
            }`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3">
                <button
                  onClick={() => toggleTask(task.id)}
                  className="mt-1 text-primary hover:text-primary-dark transition-colors"
                >
                  {task.completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                </button>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{getTypeIcon(task.type)}</span>
                    <h3
                      className={`font-semibold ${
                        task.completed ? "text-gray dark:text-light-gray line-through" : "text-dark dark:text-white"
                      }`}
                    >
                      {task.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray dark:text-light-gray mb-3">{task.description}</p>
                  <div className="flex items-center space-x-4 text-xs">
                    <span className="flex items-center text-gray dark:text-light-gray">
                      <CalendarDays className="h-3 w-3 mr-1" />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                    <span className="text-gray dark:text-light-gray">{task.subject}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}
                >
                  {task.priority}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-light-gray dark:border-dark-light">
              <div className="flex items-center space-x-2 text-xs text-gray dark:text-light-gray">
                <Clock className="h-3 w-3" />
                <span>
                  {Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                  left
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button className="text-gray hover:text-primary transition-colors">
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-gray hover:text-danger-red transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray mx-auto mb-4" />
          <h3 className="text-lg font-medium text-dark dark:text-white mb-2">No tasks found</h3>
          <p className="text-gray dark:text-light-gray">
            {searchTerm || filter !== "all"
              ? "Try adjusting your search or filters"
              : "Add your first task to get started"}
          </p>
        </div>
      )}

      {/* Add Task Modal (placeholder) */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-light rounded-xl p-6 w-full max-w-md animate-fade-in-scale">
            <h3 className="text-lg font-semibold text-dark dark:text-white mb-4">Add New Task</h3>
            <p className="text-gray dark:text-light-gray mb-4">Task creation form would go here...</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddTask(false)}
                className="flex-1 border border-light-gray dark:border-dark-light text-gray dark:text-light-gray py-2 px-4 rounded-lg hover:bg-light-gray/50 dark:hover:bg-dark/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddTask(false)}
                className="flex-1 gradient-primary text-white py-2 px-4 rounded-lg hover:shadow-glow transition-all duration-300"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
