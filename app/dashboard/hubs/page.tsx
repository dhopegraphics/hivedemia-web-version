"use client";

import { useState } from "react";
import {
  Users,
  Trophy,
  Clock,
  Upload,
  Download,
  Star,
  Play,
  BookOpen,
  FileText,
  ImageIcon,
  Video,
  Zap,
  Target,
  Award,
  Sparkles,
  Brain,
  TrendingUp,
} from "lucide-react";

export default function HubsPage() {
  const [activeTab, setActiveTab] = useState("competitions");

  const competitions = [
    {
      id: "1",
      title: "Math Championship",
      description: "Weekly mathematics competition for all levels",
      participants: 156,
      timeLeft: "2 days",
      prize: "Gold Badge",
      difficulty: "Medium",
      status: "active",
    },
    {
      id: "2",
      title: "Science Quiz Battle",
      description: "Test your knowledge in physics, chemistry, and biology",
      participants: 89,
      timeLeft: "5 hours",
      prize: "Premium Access",
      difficulty: "Hard",
      status: "ending-soon",
    },
    {
      id: "3",
      title: "History Trivia",
      description: "Explore world history through engaging questions",
      participants: 234,
      timeLeft: "1 week",
      prize: "Silver Badge",
      difficulty: "Easy",
      status: "active",
    },
  ];

  const games = [
    {
      id: "1",
      title: "Word Master",
      description: "Build vocabulary while having fun",
      players: 1247,
      rating: 4.8,
      category: "Language",
      image: "🎯",
    },
    {
      id: "2",
      title: "Formula Rush",
      description: "Speed through mathematical equations",
      players: 892,
      rating: 4.6,
      category: "Mathematics",
      image: "⚡",
    },
    {
      id: "3",
      title: "Element Explorer",
      description: "Discover the periodic table interactively",
      players: 567,
      rating: 4.9,
      category: "Chemistry",
      image: "🧪",
    },
  ];

  const publicNotes = [
    {
      id: "1",
      title: "Calculus Study Guide",
      author: "Sarah Chen",
      subject: "Mathematics",
      downloads: 1234,
      rating: 4.9,
      type: "pdf",
      size: "2.4 MB",
    },
    {
      id: "2",
      title: "Organic Chemistry Notes",
      author: "Mike Johnson",
      subject: "Chemistry",
      downloads: 856,
      rating: 4.7,
      type: "pdf",
      size: "3.1 MB",
    },
    {
      id: "3",
      title: "World War II Timeline",
      author: "Emma Davis",
      subject: "History",
      downloads: 642,
      rating: 4.8,
      type: "image",
      size: "1.8 MB",
    },
  ];

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-5 w-5 text-danger-red" />;
      case "image":
        return <ImageIcon className="h-5 w-5 text-primary" />;
      case "video":
        return <Video className="h-5 w-5 text-secondary" />;
      default:
        return <BookOpen className="h-5 w-5 text-gray" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ending-soon":
        return "text-danger-red bg-danger-red/10 border-danger-red/20";
      case "active":
        return "text-success bg-success/10 border-success/20";
      default:
        return "text-gray bg-gray/10 border-gray/20";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Enhanced Header with AI Branding */}
      <div className="relative overflow-hidden bg-gradient-to-br from-secondary-subtle via-white to-warning-subtle rounded-2xl p-8 border border-secondary/10">
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-warning/5"></div>
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-4 mb-6 lg:mb-0">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-secondary rounded-2xl flex items-center justify-center shadow-secondary">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                Community Hubs
              </h1>
              <p className="text-text-secondary text-lg">
                Compete, collaborate, and share knowledge with the AI learning
                community
              </p>
            </div>
          </div>
          <button className="gradient-primary text-white px-6 py-3 rounded-xl font-semibold hover:shadow-glow transition-all duration-300 flex items-center transform hover:scale-105">
            <Upload className="h-5 w-5 mr-2" />
            Share Knowledge
            <Sparkles className="h-4 w-4 ml-2" />
          </button>
        </div>
      </div>

      {/* Enhanced Tab Navigation */}
      <div className="bg-white rounded-2xl p-2 shadow-card border border-border-light">
        <div className="flex space-x-1">
          {[
            {
              id: "competitions",
              name: "Competitions & Games",
              icon: <Trophy className="h-5 w-5" />,
            },
            {
              id: "exam-mode",
              name: "Exam Mode",
              icon: <Clock className="h-5 w-5" />,
            },
            {
              id: "public-notes",
              name: "Knowledge Sharing",
              icon: <BookOpen className="h-5 w-5" />,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-gradient-primary text-white shadow-primary"
                  : "text-text-secondary hover:bg-surface hover:text-primary"
              }`}
            >
              {tab.icon}
              <span className="ml-2 hidden sm:inline">{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Competitions & Games Tab */}
      {activeTab === "competitions" && (
        <div className="space-y-8">
          {/* Enhanced Active Competitions */}
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-warning to-warning-light rounded-lg flex items-center justify-center mr-3">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              Live Competitions
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {competitions.map((competition, index) => (
                <div
                  key={competition.id}
                  className="group bg-white rounded-2xl p-6 shadow-card hover:shadow-card-elevated transition-all duration-500 animate-slide-up border border-border-light hover:border-warning/30 overflow-hidden relative"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-warning/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-text-primary mb-2 group-hover:text-warning transition-colors">
                          {competition.title}
                        </h3>
                        <p className="text-text-secondary leading-relaxed">
                          {competition.description}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStatusColor(
                          competition.status
                        )}`}
                      >
                        {competition.status === "ending-soon"
                          ? "🔥 Ending Soon"
                          : "✨ Active"}
                      </span>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between bg-surface px-3 py-2 rounded-lg">
                        <span className="text-text-secondary flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          Participants
                        </span>
                        <span className="font-bold text-text-primary">
                          {competition.participants}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-surface px-3 py-2 rounded-lg">
                        <span className="text-text-secondary flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          Time Left
                        </span>
                        <span className="font-bold text-primary">
                          {competition.timeLeft}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-surface px-3 py-2 rounded-lg">
                        <span className="text-text-secondary flex items-center">
                          <Award className="h-4 w-4 mr-2" />
                          Prize
                        </span>
                        <span className="font-bold text-gradient">
                          {competition.prize}
                        </span>
                      </div>
                    </div>

                    <button className="w-full gradient-primary text-white py-3 px-4 rounded-xl font-semibold hover:shadow-glow transition-all duration-300 flex items-center justify-center transform hover:scale-105">
                      <Play className="h-5 w-5 mr-2" />
                      Join Competition
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Educational Games */}
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center">
              <div className="w-10 h-10 bg-gradient-secondary rounded-lg flex items-center justify-center mr-3">
                <Zap className="h-5 w-5 text-white" />
              </div>
              AI Learning Games
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {games.map((game, index) => (
                <div
                  key={game.id}
                  className="group bg-white rounded-2xl p-6 shadow-card hover:shadow-card-elevated transition-all duration-500 animate-slide-up border border-border-light hover:border-secondary/30 overflow-hidden relative"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-surface to-surface-secondary rounded-2xl flex items-center justify-center text-2xl">
                        {game.image}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-text-primary mb-1 group-hover:text-secondary transition-colors">
                          {game.title}
                        </h3>
                        <p className="text-text-secondary mb-3 leading-relaxed">
                          {game.description}
                        </p>
                        <span className="inline-block px-3 py-1 bg-gradient-to-r from-primary/10 to-secondary/10 text-primary text-xs font-semibold rounded-full border border-primary/20">
                          {game.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-2 bg-surface px-3 py-2 rounded-lg">
                        <Users className="h-4 w-4 text-text-tertiary" />
                        <span className="text-sm font-medium text-text-secondary">
                          {game.players.toLocaleString()} players
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 bg-warning/10 px-3 py-2 rounded-lg">
                        <Star className="h-4 w-4 text-warning fill-current" />
                        <span className="text-sm font-bold text-warning">
                          {game.rating}
                        </span>
                      </div>
                    </div>

                    <button className="w-full bg-gradient-secondary text-white py-3 px-4 rounded-xl font-semibold hover:shadow-secondary transition-all duration-300 flex items-center justify-center transform hover:scale-105">
                      <Play className="h-5 w-5 mr-2" />
                      Play Game
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Exam Mode Tab */}
      {activeTab === "exam-mode" && (
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-error-subtle via-white to-warning-subtle rounded-2xl p-10 border border-error/20 text-center shadow-card-elevated">
            <div className="w-20 h-20 bg-gradient-to-br from-error to-danger-red rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Clock className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              AI Exam Mode
            </h2>
            <p className="text-text-secondary mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
              Enter a strict timed environment that simulates real exam
              conditions with AI monitoring. No distractions, no interruptions -
              just you and your knowledge.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="group bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border-light">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">
                  AI Focus Mode
                </h3>
                <p className="text-text-secondary">
                  Distraction-free interface with intelligent monitoring
                </p>
              </div>
              <div className="group bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border-light">
                <div className="w-12 h-12 bg-gradient-to-br from-warning to-warning-light rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-text-primary mb-2 group-hover:text-warning transition-colors">
                  Smart Timing
                </h3>
                <p className="text-text-secondary">
                  Real exam time limits with adaptive pacing
                </p>
              </div>
              <div className="group bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border-light">
                <div className="w-12 h-12 bg-gradient-to-br from-success to-success-green rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-text-primary mb-2 group-hover:text-success transition-colors">
                  AI Analytics
                </h3>
                <p className="text-text-secondary">
                  Detailed performance insights and recommendations
                </p>
              </div>
            </div>
            <button className="gradient-primary text-white px-10 py-4 rounded-xl font-bold hover:shadow-glow transition-all duration-300 flex items-center mx-auto transform hover:scale-105">
              <Clock className="h-6 w-6 mr-3" />
              Enter AI Exam Mode
              <Brain className="h-5 w-5 ml-2" />
            </button>
          </div>

          {/* Enhanced Recent Exam Sessions */}
          <div className="bg-white rounded-2xl p-8 shadow-card border border-border-light">
            <h3 className="text-2xl font-bold text-text-primary mb-6 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-info-blue to-info-light rounded-lg flex items-center justify-center mr-3">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              Recent Exam Sessions
            </h3>
            <div className="space-y-4">
              {[
                {
                  subject: "Mathematics",
                  score: 92,
                  duration: "2h 30m",
                  date: "2 days ago",
                },
                {
                  subject: "Chemistry",
                  score: 87,
                  duration: "1h 45m",
                  date: "1 week ago",
                },
                {
                  subject: "Physics",
                  score: 95,
                  duration: "2h 15m",
                  date: "2 weeks ago",
                },
              ].map((session, index) => (
                <div
                  key={index}
                  className="group flex items-center justify-between p-4 bg-gradient-to-r from-surface to-white rounded-xl border border-border-light hover:border-primary/30 transition-all duration-300"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-text-primary group-hover:text-primary transition-colors">
                        {session.subject}
                      </h4>
                      <p className="text-text-secondary">{session.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gradient">
                      {session.score}%
                    </div>
                    <div className="text-text-tertiary">{session.duration}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Knowledge Sharing Tab */}
      {activeTab === "public-notes" && (
        <div className="space-y-8">
          <div className="bg-white rounded-2xl p-8 shadow-card border border-border-light">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-text-primary mb-2 flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center mr-3">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  Knowledge Sharing Hub
                </h2>
                <p className="text-text-secondary">
                  Discover and share study resources with the AI learning
                  community
                </p>
              </div>
              <div className="flex space-x-3 mt-6 lg:mt-0">
                <select className="px-4 py-3 border border-border-light rounded-xl bg-surface text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all">
                  <option>All Subjects</option>
                  <option>Mathematics</option>
                  <option>Chemistry</option>
                  <option>Physics</option>
                  <option>History</option>
                </select>
                <select className="px-4 py-3 border border-border-light rounded-xl bg-surface text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all">
                  <option>Most Downloaded</option>
                  <option>Highest Rated</option>
                  <option>Recently Added</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {publicNotes.map((note, index) => (
                <div
                  key={note.id}
                  className="group border border-border-light rounded-2xl p-6 hover:border-primary/30 hover:shadow-card-hover transition-all duration-300 animate-slide-up bg-gradient-to-br from-white to-surface"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 p-3 bg-gradient-to-br from-surface to-surface-secondary rounded-xl">
                      {getFileIcon(note.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-text-primary mb-1 group-hover:text-primary transition-colors">
                        {note.title}
                      </h3>
                      <p className="text-text-secondary mb-3">
                        by {note.author}
                      </p>
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex items-center space-x-1 bg-primary/10 px-2 py-1 rounded-lg">
                          <Download className="h-4 w-4 text-primary" />
                          <span className="text-primary font-medium text-sm">
                            {note.downloads.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 bg-warning/10 px-2 py-1 rounded-lg">
                          <Star className="h-4 w-4 text-warning fill-current" />
                          <span className="text-warning font-medium text-sm">
                            {note.rating}
                          </span>
                        </div>
                        <span className="text-text-tertiary text-sm">
                          {note.size}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="inline-block px-3 py-1 bg-gradient-to-r from-secondary/10 to-info-blue/10 text-secondary text-xs font-semibold rounded-full border border-secondary/20">
                          {note.subject}
                        </span>
                        <button className="gradient-primary text-white px-4 py-2 rounded-lg font-medium hover:shadow-glow transition-all duration-300 flex items-center transform hover:scale-105">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Upload Section */}
          <div className="bg-gradient-to-br from-primary-subtle via-white to-secondary-subtle rounded-2xl p-8 border border-primary/20 shadow-card-elevated">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-primary">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-text-primary mb-3 flex items-center justify-center">
                Share Your Knowledge
                <Sparkles className="h-5 w-5 ml-2 text-primary" />
              </h3>
              <p className="text-text-secondary mb-6 max-w-md mx-auto">
                Upload your study notes and help other students succeed in their
                learning journey
              </p>
              <button className="gradient-primary text-white px-8 py-3 rounded-xl font-semibold hover:shadow-glow transition-all duration-300 transform hover:scale-105">
                Upload Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
