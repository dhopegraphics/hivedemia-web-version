"use client";

import { useState, useEffect } from "react";
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
  CheckCircle,
} from "lucide-react";

export default function StudyPlacePage() {
  const [isStudying, setIsStudying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [studyMode, setStudyMode] = useState("pomodoro"); // pomodoro, focus, break
  const [totalSessions, setTotalSessions] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStudying && !isPaused) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStudying, isPaused]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const startStudy = () => {
    setIsStudying(true);
    setIsPaused(false);
    if (timeElapsed === 0) {
      setTotalSessions((prev) => prev + 1);
    }
  };

  const pauseStudy = () => {
    setIsPaused(true);
  };

  const stopStudy = () => {
    setIsStudying(false);
    setIsPaused(false);
    setTimeElapsed(0);
  };

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
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Enhanced Header with AI Branding */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-subtle via-white to-secondary-subtle rounded-2xl p-8 border border-primary/10">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5"></div>
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-4 mb-6 lg:mb-0">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-primary">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-warning rounded-full flex items-center justify-center">
                <Zap className="h-3 w-3 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                AI Study Assistant
              </h1>
              <p className="text-text-secondary text-lg">
                Personalized learning sessions powered by artificial
                intelligence
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-sm text-text-tertiary">
                Today&apos;s Focus
              </div>
              <div className="text-2xl font-bold text-gradient">
                {totalSessions} sessions
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-text-tertiary">Streak</div>
              <div className="text-2xl font-bold text-gradient">7 days</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Study Timer */}
      <div className="bg-white rounded-2xl p-8 shadow-card-elevated border border-border-light text-center overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-secondary/3"></div>
        <div className="relative">
          <div className="mb-8">
            <div className="text-7xl font-bold text-gradient mb-4 tracking-tight">
              {formatTime(timeElapsed)}
            </div>
            <div className="text-xl text-text-secondary font-medium">
              {isStudying
                ? isPaused
                  ? "⏸️ Paused"
                  : "🎯 In Focus Mode"
                : "✨ Ready to Begin"}
            </div>
          </div>

          <div className="flex justify-center space-x-4 mb-8">
            {!isStudying ? (
              <button
                onClick={startStudy}
                className="group relative gradient-primary text-white px-10 py-4 rounded-xl font-semibold hover:shadow-glow transition-all duration-300 flex items-center transform hover:scale-105"
              >
                <Play className="h-5 w-5 mr-3" />
                Start AI Session
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 bg-white transition-opacity"></div>
              </button>
            ) : (
              <>
                <button
                  onClick={isPaused ? startStudy : pauseStudy}
                  className="bg-secondary/90 hover:bg-secondary text-white px-8 py-3 rounded-xl font-medium transition-all duration-300 flex items-center transform hover:scale-105 shadow-secondary"
                >
                  {isPaused ? (
                    <Play className="h-4 w-4 mr-2" />
                  ) : (
                    <Pause className="h-4 w-4 mr-2" />
                  )}
                  {isPaused ? "Resume" : "Pause"}
                </button>
                <button
                  onClick={stopStudy}
                  className="bg-gradient-to-r from-error to-danger-red text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 flex items-center transform hover:scale-105"
                >
                  <Square className="h-4 w-4 mr-2" />
                  End Session
                </button>
              </>
            )}
          </div>

          {/* Enhanced Progress Bar */}
          {isStudying && (
            <div className="relative w-full bg-surface rounded-full h-3 mb-6 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-surface-secondary to-surface"></div>
              <div
                className="gradient-primary h-3 rounded-full transition-all duration-500 relative overflow-hidden"
                style={{
                  width: `${Math.min(
                    (timeElapsed /
                      (studyModes.find((m) => m.id === studyMode)?.duration ||
                        1500)) *
                      100,
                    100
                  )}%`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-pulse"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Study Modes */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center">
          <div className="w-10 h-10 bg-gradient-secondary rounded-lg flex items-center justify-center mr-3">
            <Target className="h-5 w-5 text-white" />
          </div>
          AI Study Modes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {studyModes.map((mode, index) => (
            <div
              key={mode.id}
              className={`group relative bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-500 cursor-pointer animate-slide-up border-2 overflow-hidden ${
                studyMode === mode.id
                  ? "border-primary shadow-primary"
                  : "border-border-light hover:border-primary/30"
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => setStudyMode(mode.id)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div
                  className={`w-14 h-14 bg-gradient-to-r ${mode.color} rounded-2xl flex items-center justify-center text-white mb-4 transform group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                >
                  {mode.icon}
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2 group-hover:text-primary transition-colors">
                  {mode.name}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {mode.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-text-tertiary font-medium">
                    Duration: {Math.floor(mode.duration / 60)}min
                  </span>
                  {studyMode === mode.id && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Study Analytics */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-info-blue to-secondary rounded-lg flex items-center justify-center mr-3">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          Performance Analytics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border-light hover:border-primary/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">
                Today
              </h3>
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gradient mb-1">2.5h</div>
            <div className="text-xs text-text-secondary">
              +15% from yesterday
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border-light hover:border-success/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">
                This Week
              </h3>
              <div className="w-10 h-10 bg-gradient-to-br from-success to-success-green rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gradient-warm mb-1">
              18.2h
            </div>
            <div className="text-xs text-text-secondary">Goal: 20h</div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border-light hover:border-warning/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">
                Sessions
              </h3>
              <div className="w-10 h-10 bg-gradient-to-br from-warning to-warning-light rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gradient mb-1">
              {totalSessions}
            </div>
            <div className="text-xs text-text-secondary">Avg: 45min</div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border-light hover:border-secondary/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">
                AI Score
              </h3>
              <div className="w-10 h-10 bg-gradient-to-br from-secondary to-secondary-light rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gradient mb-1">94%</div>
            <div className="text-xs text-text-secondary">Excellent focus</div>
          </div>
        </div>
      </div>

      {/* Enhanced AI Study Assistant */}
      <div className="bg-gradient-to-br from-white via-primary-subtle/30 to-secondary-subtle/30 rounded-2xl p-8 shadow-card-elevated border border-primary/10">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mr-4 shadow-primary">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-text-primary">
              AI Learning Coach
            </h3>
            <p className="text-text-secondary">
              Personalized insights and recommendations
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="group bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-primary/20 hover:border-primary/40 transition-all duration-300">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-warning to-warning-light rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg">💡</span>
              </div>
              <div>
                <h4 className="font-semibold text-text-primary mb-2">
                  Smart Insight
                </h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Your focus peaks around 2 PM. Consider scheduling challenging
                  subjects during this time for optimal learning.
                </p>
              </div>
            </div>
          </div>
          <div className="group bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-secondary/20 hover:border-secondary/40 transition-all duration-300">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-secondary to-secondary-light rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg">📊</span>
              </div>
              <div>
                <h4 className="font-semibold text-text-primary mb-2">
                  Progress Update
                </h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  You&apos;ve improved your study consistency by 25% this week.
                  Excellent progress!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Actions */}
      <div className="bg-white rounded-2xl p-8 shadow-card border border-border-light">
        <h3 className="text-2xl font-bold text-text-primary mb-6 flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-info-blue to-info-light rounded-lg flex items-center justify-center mr-3">
            <Zap className="h-5 w-5 text-white" />
          </div>
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              name: "Study Notes",
              icon: <BookOpen className="h-6 w-6" />,
              color: "from-primary to-primary-light",
              hoverColor: "hover:shadow-primary",
            },
            {
              name: "Practice Quiz",
              icon: <Brain className="h-6 w-6" />,
              color: "from-secondary to-secondary-light",
              hoverColor: "hover:shadow-secondary",
            },
            {
              name: "Set Goals",
              icon: <Target className="h-6 w-6" />,
              color: "from-warning to-warning-light",
              hoverColor: "hover:shadow-lg",
            },
            {
              name: "Settings",
              icon: <Settings className="h-6 w-6" />,
              color: "from-info-blue to-info-light",
              hoverColor: "hover:shadow-lg",
            },
          ].map((action, index) => (
            <button
              key={index}
              className={`group flex flex-col items-center p-6 rounded-xl border border-border-light hover:border-primary/30 bg-gradient-to-br from-surface to-white transition-all duration-300 transform hover:scale-105 ${action.hoverColor}`}
            >
              <div
                className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center text-white mb-3 shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
              >
                {action.icon}
              </div>
              <span className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                {action.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
