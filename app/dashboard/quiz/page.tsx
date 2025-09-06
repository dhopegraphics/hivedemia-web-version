"use client";

import { useState } from "react";
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
  Sparkles,
  Target,
} from "lucide-react";

interface Quiz {
  id: string;
  title: string;
  subject: string;
  difficulty: "easy" | "medium" | "hard";
  questions: number;
  duration: number;
  completed: boolean;
  score?: number;
  type: "practice" | "assessment" | "ai-generated";
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
  ]);

  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");

  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesDifficulty =
      selectedDifficulty === "all" || quiz.difficulty === selectedDifficulty;
    const matchesSubject =
      selectedSubject === "all" || quiz.subject === selectedSubject;
    return matchesDifficulty && matchesSubject;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "text-success bg-success/10 border-success/20";
      case "medium":
        return "text-warning bg-warning/10 border-warning/20";
      case "hard":
        return "text-danger-red bg-danger-red/10 border-danger-red/20";
      default:
        return "text-gray bg-gray/10 border-gray/20";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ai-generated":
        return "🤖";
      case "assessment":
        return "📝";
      case "practice":
        return "🎯";
      default:
        return "📋";
    }
  };

  const completedQuizzes = quizzes.filter((q) => q.completed);
  const averageScore =
    completedQuizzes.length > 0
      ? Math.round(
          completedQuizzes.reduce((sum, q) => sum + (q.score || 0), 0) /
            completedQuizzes.length
        )
      : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Enhanced Header with AI Branding */}
      <div className="relative overflow-hidden bg-gradient-to-br from-secondary-subtle via-white to-info-subtle rounded-2xl p-8 border border-secondary/10">
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-info-blue/5"></div>
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-4 mb-6 lg:mb-0">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-secondary rounded-2xl flex items-center justify-center shadow-secondary">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                AI Quiz Laboratory
              </h1>
              <p className="text-text-secondary text-lg">
                Smart assessments powered by artificial intelligence
              </p>
            </div>
          </div>
          <button className="gradient-primary text-white px-6 py-3 rounded-xl font-semibold hover:shadow-glow transition-all duration-300 flex items-center transform hover:scale-105">
            <Brain className="h-5 w-5 mr-2" />
            Generate AI Quiz
            <Sparkles className="h-4 w-4 ml-2" />
          </button>
        </div>
      </div>

      {/* Enhanced Stats Overview */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-warning to-warning-light rounded-lg flex items-center justify-center mr-3">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          Performance Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="group bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border-light hover:border-success/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">
                Completed
              </h3>
              <div className="w-10 h-10 bg-gradient-to-br from-success to-success-green rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gradient mb-1">
              {completedQuizzes.length}
            </div>
            <div className="text-xs text-text-secondary">+2 this week</div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border-light hover:border-warning/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">
                Average Score
              </h3>
              <div className="w-10 h-10 bg-gradient-to-br from-warning to-warning-light rounded-lg flex items-center justify-center">
                <Trophy className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gradient-warm mb-1">
              {averageScore}%
            </div>
            <div className="text-xs text-text-secondary">Above target</div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border-light hover:border-primary/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">
                Study Streak
              </h3>
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gradient mb-1">7 days</div>
            <div className="text-xs text-text-secondary">Personal best!</div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border-light hover:border-secondary/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">
                Global Rank
              </h3>
              <div className="w-10 h-10 bg-gradient-to-br from-secondary to-secondary-light rounded-lg flex items-center justify-center">
                <Award className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gradient mb-1">#12</div>
            <div className="text-xs text-text-secondary">Top 5%</div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-border-light">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-semibold text-text-primary mr-3 flex items-center">
              <Target className="h-4 w-4 mr-1" />
              Difficulty:
            </span>
            {["all", "easy", "medium", "hard"].map((difficulty) => (
              <button
                key={difficulty}
                onClick={() => setSelectedDifficulty(difficulty)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedDifficulty === difficulty
                    ? "bg-gradient-primary text-white shadow-primary"
                    : "bg-surface hover:bg-surface-hover text-text-secondary hover:text-primary border border-border-light"
                }`}
              >
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-semibold text-text-primary mr-3 flex items-center">
              <BookOpen className="h-4 w-4 mr-1" />
              Subject:
            </span>
            {["all", "Mathematics", "Chemistry", "History", "Physics"].map(
              (subject) => (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    selectedSubject === subject
                      ? "bg-gradient-secondary text-white shadow-secondary"
                      : "bg-surface hover:bg-surface-hover text-text-secondary hover:text-secondary border border-border-light"
                  }`}
                >
                  {subject}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Quiz Grid */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center mr-3">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          Available Quizzes
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredQuizzes.map((quiz, index) => (
            <div
              key={quiz.id}
              className="group bg-white rounded-2xl p-6 shadow-card hover:shadow-card-elevated transition-all duration-500 animate-slide-up border border-border-light hover:border-primary/30 overflow-hidden relative"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="text-3xl p-2 bg-gradient-to-br from-surface to-surface-secondary rounded-xl">
                      {getTypeIcon(quiz.type)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-text-primary mb-1 group-hover:text-primary transition-colors">
                        {quiz.title}
                      </h3>
                      <p className="text-text-secondary font-medium">
                        {quiz.subject}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getDifficultyColor(
                        quiz.difficulty
                      )}`}
                    >
                      {quiz.difficulty}
                    </span>
                    {quiz.completed && quiz.score && (
                      <div className="flex items-center space-x-1 bg-warning/10 px-2 py-1 rounded-full">
                        <Star className="h-4 w-4 text-warning fill-current" />
                        <span className="text-sm font-bold text-warning">
                          {quiz.score}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-6 text-sm text-text-secondary mb-6">
                  <div className="flex items-center space-x-2 bg-surface px-3 py-1 rounded-lg">
                    <BookOpen className="h-4 w-4" />
                    <span className="font-medium">
                      {quiz.questions} questions
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 bg-surface px-3 py-1 rounded-lg">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">{quiz.duration} min</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border-light">
                  <div className="text-xs text-text-tertiary font-medium">
                    {quiz.completed ? "✅ Completed" : "⏳ Not started"}
                  </div>
                  <button className="group/btn gradient-primary text-white px-6 py-3 rounded-xl font-semibold hover:shadow-glow transition-all duration-300 flex items-center transform hover:scale-105">
                    <Play className="h-4 w-4 mr-2" />
                    {quiz.completed ? "Retake Quiz" : "Start Quiz"}
                    <ChevronRight className="h-4 w-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced AI Quiz Generator */}
      <div className="bg-gradient-to-br from-primary-subtle via-white to-secondary-subtle rounded-2xl p-8 border border-primary/20 shadow-card-elevated">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-primary">
              <Brain className="h-7 w-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-text-primary mb-2 flex items-center">
                AI Quiz Generator
                <Sparkles className="h-5 w-5 ml-2 text-primary" />
              </h3>
              <p className="text-text-secondary">
                Generate personalized quizzes based on your study materials and
                performance analytics
              </p>
            </div>
          </div>
          <button className="gradient-primary text-white px-8 py-4 rounded-xl font-semibold hover:shadow-glow transition-all duration-300 flex items-center transform hover:scale-105">
            <Zap className="h-5 w-5 mr-2" />
            Generate Quiz
            <Sparkles className="h-4 w-4 ml-2" />
          </button>
        </div>
      </div>

      {/* Enhanced Recent Performance */}
      <div className="bg-white rounded-2xl p-8 shadow-card border border-border-light">
        <h3 className="text-2xl font-bold text-text-primary mb-6 flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-success to-success-green rounded-lg flex items-center justify-center mr-3">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          Recent Performance
        </h3>
        <div className="space-y-4">
          {completedQuizzes.slice(0, 3).map((quiz) => (
            <div
              key={quiz.id}
              className="group flex items-center justify-between p-4 bg-gradient-to-r from-surface to-white rounded-xl border border-border-light hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex items-center space-x-4">
                <div className="text-2xl p-2 bg-gradient-to-br from-primary-subtle to-surface rounded-lg">
                  {getTypeIcon(quiz.type)}
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary group-hover:text-primary transition-colors">
                    {quiz.title}
                  </h4>
                  <p className="text-sm text-text-secondary">{quiz.subject}</p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <div className="text-2xl font-bold text-gradient">
                    {quiz.score}%
                  </div>
                  <div className="text-xs text-text-tertiary">
                    {quiz.questions} questions
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full shadow-lg ${
                    (quiz.score || 0) >= 90
                      ? "bg-gradient-to-br from-success to-success-green"
                      : (quiz.score || 0) >= 70
                      ? "bg-gradient-to-br from-warning to-warning-light"
                      : "bg-gradient-to-br from-error to-danger-red"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
