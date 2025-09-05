"use client"

import { useState, useEffect } from "react"
import {
  Play,
  Pause,
  Square,
  Clock,
  BookOpen,
  Brain,
  Target,
  Timer,
  Coffee,
  Zap,
  Settings,
  TrendingUp,
} from "lucide-react"

export default function StudyPlacePage() {
  const [isStudying, setIsStudying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [studyMode, setStudyMode] = useState("pomodoro") // pomodoro, focus, break
  const [currentSession, setCurrentSession] = useState(1)
  const [totalSessions, setTotalSessions] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isStudying && !isPaused) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isStudying, isPaused])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  const startStudy = () => {
    setIsStudying(true)
    setIsPaused(false)
    if (timeElapsed === 0) {
      setTotalSessions((prev) => prev + 1)
    }
  }

  const pauseStudy = () => {
    setIsPaused(true)
  }

  const stopStudy = () => {
    setIsStudying(false)
    setIsPaused(false)
    setTimeElapsed(0)
  }

  const studyModes = [
    {
      id: "pomodoro",
      name: "Pomodoro",
      description: "25 min focus + 5 min break",
      icon: <Timer className="h-5 w-5" />,
      duration: 25 * 60,
      color: "from-primary to-primary-light",
    },
    {
      id: "focus",
      name: "Deep Focus",
      description: "90 min intensive study",
      icon: <Brain className="h-5 w-5" />,
      duration: 90 * 60,
      color: "from-secondary to-purple-400",
    },
    {
      id: "break",
      name: "Active Break",
      description: "15 min relaxation",
      icon: <Coffee className="h-5 w-5" />,
      duration: 15 * 60,
      color: "from-warning to-yellow-400",
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white mb-2">Study Place</h1>
          <p className="text-gray dark:text-light-gray">Focus on your learning with AI-powered study sessions</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-2">
          <div className="text-right">
            <div className="text-sm text-gray dark:text-light-gray">Today's Progress</div>
            <div className="text-lg font-semibold text-primary">{totalSessions} sessions</div>
          </div>
        </div>
      </div>

      {/* Study Timer */}
      <div className="bg-white dark:bg-dark-light rounded-xl p-8 shadow-card text-center">
        <div className="mb-8">
          <div className="text-6xl font-bold text-dark dark:text-white mb-4">{formatTime(timeElapsed)}</div>
          <div className="text-lg text-gray dark:text-light-gray">
            {isStudying ? (isPaused ? "Paused" : "Studying") : "Ready to start"}
          </div>
        </div>

        <div className="flex justify-center space-x-4 mb-8">
          {!isStudying ? (
            <button
              onClick={startStudy}
              className="gradient-primary text-white px-8 py-4 rounded-xl font-semibold hover:shadow-glow transition-all duration-300 flex items-center"
            >
              <Play className="h-5 w-5 mr-2" />
              Start Study Session
            </button>
          ) : (
            <>
              <button
                onClick={isPaused ? startStudy : pauseStudy}
                className="bg-secondary text-white px-6 py-3 rounded-lg font-medium hover:bg-secondary/90 transition-colors flex items-center"
              >
                {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                {isPaused ? "Resume" : "Pause"}
              </button>
              <button
                onClick={stopStudy}
                className="bg-danger-red text-white px-6 py-3 rounded-lg font-medium hover:bg-danger-red/90 transition-colors flex items-center"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop
              </button>
            </>
          )}
        </div>

        {/* Progress Bar */}
        {isStudying && (
          <div className="w-full bg-light-gray dark:bg-dark rounded-full h-2 mb-4">
            <div
              className="gradient-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min((timeElapsed / (studyModes.find((m) => m.id === studyMode)?.duration || 1500)) * 100, 100)}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Study Modes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {studyModes.map((mode, index) => (
          <div
            key={mode.id}
            className={`bg-white dark:bg-dark-light rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer animate-slide-up ${
              studyMode === mode.id ? "ring-2 ring-primary" : ""
            }`}
            style={{ animationDelay: `${index * 0.1}s` }}
            onClick={() => setStudyMode(mode.id)}
          >
            <div
              className={`w-12 h-12 bg-gradient-to-r ${mode.color} rounded-lg flex items-center justify-center text-white mb-4`}
            >
              {mode.icon}
            </div>
            <h3 className="text-lg font-semibold text-dark dark:text-white mb-2">{mode.name}</h3>
            <p className="text-gray dark:text-light-gray text-sm">{mode.description}</p>
          </div>
        ))}
      </div>

      {/* Study Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-dark-light rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray dark:text-light-gray">Today</h3>
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-dark dark:text-white">2.5h</div>
        </div>

        <div className="bg-white dark:bg-dark-light rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray dark:text-light-gray">This Week</h3>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <div className="text-2xl font-bold text-dark dark:text-white">18.2h</div>
        </div>

        <div className="bg-white dark:bg-dark-light rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray dark:text-light-gray">Sessions</h3>
            <Target className="h-4 w-4 text-warning" />
          </div>
          <div className="text-2xl font-bold text-dark dark:text-white">{totalSessions}</div>
        </div>

        <div className="bg-white dark:bg-dark-light rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray dark:text-light-gray">Focus Score</h3>
            <Zap className="h-4 w-4 text-secondary" />
          </div>
          <div className="text-2xl font-bold text-dark dark:text-white">94%</div>
        </div>
      </div>

      {/* AI Study Assistant */}
      <div className="bg-white dark:bg-dark-light rounded-xl p-6 shadow-card">
        <h3 className="text-lg font-semibold text-dark dark:text-white mb-4 flex items-center">
          <Brain className="h-5 w-5 mr-2 text-primary" />
          AI Study Assistant
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-r from-primary/10 to-transparent rounded-lg border-l-4 border-primary">
            <h4 className="font-medium text-dark dark:text-white mb-2">💡 Study Tip</h4>
            <p className="text-sm text-gray dark:text-light-gray">
              Your focus peaks around 2 PM. Consider scheduling challenging subjects during this time.
            </p>
          </div>
          <div className="p-4 bg-gradient-to-r from-secondary/10 to-transparent rounded-lg border-l-4 border-secondary">
            <h4 className="font-medium text-dark dark:text-white mb-2">📊 Progress Update</h4>
            <p className="text-sm text-gray dark:text-light-gray">
              You've improved your study consistency by 25% this week. Keep it up!
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-dark-light rounded-xl p-6 shadow-card">
        <h3 className="text-lg font-semibold text-dark dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Study Notes", icon: <BookOpen className="h-5 w-5" />, color: "text-primary" },
            { name: "Practice Quiz", icon: <Brain className="h-5 w-5" />, color: "text-secondary" },
            { name: "Set Goals", icon: <Target className="h-5 w-5" />, color: "text-warning" },
            { name: "Settings", icon: <Settings className="h-5 w-5" />, color: "text-info-blue" },
          ].map((action, index) => (
            <button
              key={index}
              className="flex flex-col items-center p-4 rounded-lg border border-light-gray dark:border-dark-light hover:bg-light dark:hover:bg-dark transition-colors"
            >
              <div className={`${action.color} mb-2`}>{action.icon}</div>
              <span className="text-sm font-medium text-dark dark:text-white">{action.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
