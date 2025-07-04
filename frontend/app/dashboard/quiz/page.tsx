"use client"

import { useState } from "react"
import {
  Brain,
  Play,
  Trophy,
  Clock,
  BookOpen,
  ChevronRight,
  Star,
  TrendingUp,
  Award,
  Zap,
  CheckCircle,
} from "lucide-react"

interface Quiz {
  id: string
  title: string
  subject: string
  difficulty: "easy" | "medium" | "hard"
  questions: number
  duration: number
  completed: boolean
  score?: number
  type: "practice" | "assessment" | "ai-generated"
}

export default function QuizRoomPage() {
  const [quizzes] = useState<Quiz[]>([
    {
      id: "1",
      title: "Algebra Fundamentals",
      subject: "Mathematics",
      difficulty: "medium",
      questions: 15,
      duration: 20,
      completed: true,
      score: 87,
      type: "practice",
    },
    {
      id: "2",
      title: "Chemical Bonding",
      subject: "Chemistry",
      difficulty: "hard",
      questions: 20,
      duration: 30,
      completed: false,
      type: "assessment",
    },
    {
      id: "3",
      title: "World War II Timeline",
      subject: "History",
      difficulty: "easy",
      questions: 10,
      duration: 15,
      completed: true,
      score: 95,
      type: "practice",
    },
    {
      id: "4",
      title: "AI-Generated Physics Quiz",
      subject: "Physics",
      difficulty: "medium",
      questions: 12,
      duration: 25,
      completed: false,
      type: "ai-generated",
    },
  ])

  const [selectedDifficulty, setSelectedDifficulty] = useState("all")
  const [selectedSubject, setSelectedSubject] = useState("all")

  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesDifficulty = selectedDifficulty === "all" || quiz.difficulty === selectedDifficulty
    const matchesSubject = selectedSubject === "all" || quiz.subject === selectedSubject
    return matchesDifficulty && matchesSubject
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "text-success bg-success/10 border-success/20"
      case "medium":
        return "text-warning bg-warning/10 border-warning/20"
      case "hard":
        return "text-danger-red bg-danger-red/10 border-danger-red/20"
      default:
        return "text-gray bg-gray/10 border-gray/20"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ai-generated":
        return "🤖"
      case "assessment":
        return "📝"
      case "practice":
        return "🎯"
      default:
        return "📋"
    }
  }

  const completedQuizzes = quizzes.filter((q) => q.completed)
  const averageScore =
    completedQuizzes.length > 0
      ? Math.round(completedQuizzes.reduce((sum, q) => sum + (q.score || 0), 0) / completedQuizzes.length)
      : 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white mb-2">Quiz Room</h1>
          <p className="text-gray dark:text-light-gray">
            Test your knowledge with AI-generated quizzes and assessments
          </p>
        </div>
        <button className="mt-4 sm:mt-0 gradient-primary text-white px-4 py-2 rounded-lg font-medium hover:shadow-glow transition-all duration-300 flex items-center">
          <Brain className="h-4 w-4 mr-2" />
          Generate AI Quiz
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-dark-light rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray dark:text-light-gray">Completed</h3>
            <CheckCircle className="h-4 w-4 text-success" />
          </div>
          <div className="text-2xl font-bold text-dark dark:text-white">{completedQuizzes.length}</div>
        </div>

        <div className="bg-white dark:bg-dark-light rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray dark:text-light-gray">Average Score</h3>
            <Trophy className="h-4 w-4 text-warning" />
          </div>
          <div className="text-2xl font-bold text-dark dark:text-white">{averageScore}%</div>
        </div>

        <div className="bg-white dark:bg-dark-light rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray dark:text-light-gray">Study Streak</h3>
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-dark dark:text-white">7 days</div>
        </div>

        <div className="bg-white dark:bg-dark-light rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray dark:text-light-gray">Rank</h3>
            <Award className="h-4 w-4 text-secondary" />
          </div>
          <div className="text-2xl font-bold text-dark dark:text-white">#12</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-dark-light rounded-xl p-6 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray dark:text-light-gray mr-2">Difficulty:</span>
            {["all", "easy", "medium", "hard"].map((difficulty) => (
              <button
                key={difficulty}
                onClick={() => setSelectedDifficulty(difficulty)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedDifficulty === difficulty
                    ? "bg-primary text-white"
                    : "bg-light-gray/50 dark:bg-dark/50 text-gray dark:text-light-gray hover:bg-primary/10 hover:text-primary"
                }`}
              >
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray dark:text-light-gray mr-2">Subject:</span>
            {["all", "Mathematics", "Chemistry", "History", "Physics"].map((subject) => (
              <button
                key={subject}
                onClick={() => setSelectedSubject(subject)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedSubject === subject
                    ? "bg-secondary text-white"
                    : "bg-light-gray/50 dark:bg-dark/50 text-gray dark:text-light-gray hover:bg-secondary/10 hover:text-secondary"
                }`}
              >
                {subject}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quiz Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredQuizzes.map((quiz, index) => (
          <div
            key={quiz.id}
            className="bg-white dark:bg-dark-light rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{getTypeIcon(quiz.type)}</div>
                <div>
                  <h3 className="text-lg font-semibold text-dark dark:text-white mb-1">{quiz.title}</h3>
                  <p className="text-sm text-gray dark:text-light-gray">{quiz.subject}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(quiz.difficulty)}`}
                >
                  {quiz.difficulty}
                </span>
                {quiz.completed && quiz.score && (
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-warning fill-current" />
                    <span className="text-sm font-medium text-dark dark:text-white">{quiz.score}%</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-6 text-sm text-gray dark:text-light-gray mb-6">
              <div className="flex items-center space-x-1">
                <BookOpen className="h-4 w-4" />
                <span>{quiz.questions} questions</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{quiz.duration} min</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-gray dark:text-light-gray">
                {quiz.completed ? "Completed" : "Not started"}
              </div>
              <button className="gradient-primary text-white px-4 py-2 rounded-lg font-medium hover:shadow-glow transition-all duration-300 flex items-center">
                <Play className="h-4 w-4 mr-2" />
                {quiz.completed ? "Retake" : "Start"}
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* AI Quiz Generator */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 border border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-dark dark:text-white mb-2 flex items-center">
              <Brain className="h-5 w-5 mr-2 text-primary" />
              AI Quiz Generator
            </h3>
            <p className="text-gray dark:text-light-gray">
              Generate personalized quizzes based on your study materials and performance
            </p>
          </div>
          <button className="gradient-primary text-white px-6 py-3 rounded-lg font-medium hover:shadow-glow transition-all duration-300 flex items-center">
            <Zap className="h-4 w-4 mr-2" />
            Generate Quiz
          </button>
        </div>
      </div>

      {/* Recent Performance */}
      <div className="bg-white dark:bg-dark-light rounded-xl p-6 shadow-card">
        <h3 className="text-lg font-semibold text-dark dark:text-white mb-6 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-success" />
          Recent Performance
        </h3>
        <div className="space-y-4">
          {completedQuizzes.slice(0, 3).map((quiz, index) => (
            <div key={quiz.id} className="flex items-center justify-between p-4 bg-light dark:bg-dark rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-lg">{getTypeIcon(quiz.type)}</div>
                <div>
                  <h4 className="font-medium text-dark dark:text-white">{quiz.title}</h4>
                  <p className="text-sm text-gray dark:text-light-gray">{quiz.subject}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-lg font-semibold text-dark dark:text-white">{quiz.score}%</div>
                  <div className="text-xs text-gray dark:text-light-gray">{quiz.questions} questions</div>
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${
                    (quiz.score || 0) >= 90 ? "bg-success" : (quiz.score || 0) >= 70 ? "bg-warning" : "bg-danger-red"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
