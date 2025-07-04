"use client"

import { useState } from "react"
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
} from "lucide-react"

export default function HubsPage() {
  const [activeTab, setActiveTab] = useState("competitions")

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
  ]

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
  ]

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
  ]

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-5 w-5 text-danger-red" />
      case "image":
        return <ImageIcon className="h-5 w-5 text-primary" />
      case "video":
        return <Video className="h-5 w-5 text-secondary" />
      default:
        return <BookOpen className="h-5 w-5 text-gray" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ending-soon":
        return "text-danger-red bg-danger-red/10 border-danger-red/20"
      case "active":
        return "text-success bg-success/10 border-success/20"
      default:
        return "text-gray bg-gray/10 border-gray/20"
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white mb-2">Hubs</h1>
          <p className="text-gray dark:text-light-gray">Compete, collaborate, and share knowledge with the community</p>
        </div>
        <button className="mt-4 sm:mt-0 gradient-primary text-white px-4 py-2 rounded-lg font-medium hover:shadow-glow transition-all duration-300 flex items-center">
          <Upload className="h-4 w-4 mr-2" />
          Upload Notes
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-dark-light rounded-xl p-2 shadow-card">
        <div className="flex space-x-1">
          {[
            { id: "competitions", name: "Competitions & Games", icon: <Trophy className="h-4 w-4" /> },
            { id: "exam-mode", name: "Exam Mode", icon: <Clock className="h-4 w-4" /> },
            { id: "public-notes", name: "Public Notes", icon: <BookOpen className="h-4 w-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-white"
                  : "text-gray dark:text-light-gray hover:bg-light-gray/50 dark:hover:bg-dark/50 hover:text-primary"
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
        <div className="space-y-6">
          {/* Active Competitions */}
          <div>
            <h2 className="text-xl font-semibold text-dark dark:text-white mb-4 flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-warning" />
              Active Competitions
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {competitions.map((competition, index) => (
                <div
                  key={competition.id}
                  className="bg-white dark:bg-dark-light rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-dark dark:text-white mb-2">{competition.title}</h3>
                      <p className="text-sm text-gray dark:text-light-gray">{competition.description}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(competition.status)}`}
                    >
                      {competition.status === "ending-soon" ? "Ending Soon" : "Active"}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray dark:text-light-gray">Participants</span>
                      <span className="font-medium text-dark dark:text-white">{competition.participants}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray dark:text-light-gray">Time Left</span>
                      <span className="font-medium text-dark dark:text-white">{competition.timeLeft}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray dark:text-light-gray">Prize</span>
                      <span className="font-medium text-warning">{competition.prize}</span>
                    </div>
                  </div>

                  <button className="w-full gradient-primary text-white py-2 px-4 rounded-lg font-medium hover:shadow-glow transition-all duration-300 flex items-center justify-center">
                    <Play className="h-4 w-4 mr-2" />
                    Join Competition
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Educational Games */}
          <div>
            <h2 className="text-xl font-semibold text-dark dark:text-white mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-secondary" />
              Educational Games
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {games.map((game, index) => (
                <div
                  key={game.id}
                  className="bg-white dark:bg-dark-light rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="text-3xl">{game.image}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-dark dark:text-white mb-1">{game.title}</h3>
                      <p className="text-sm text-gray dark:text-light-gray mb-2">{game.description}</p>
                      <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                        {game.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-gray" />
                      <span className="text-sm text-gray dark:text-light-gray">
                        {game.players.toLocaleString()} players
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-warning fill-current" />
                      <span className="text-sm font-medium text-dark dark:text-white">{game.rating}</span>
                    </div>
                  </div>

                  <button className="w-full bg-secondary text-white py-2 px-4 rounded-lg font-medium hover:bg-secondary/90 transition-colors flex items-center justify-center">
                    <Play className="h-4 w-4 mr-2" />
                    Play Game
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Exam Mode Tab */}
      {activeTab === "exam-mode" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-danger-red/10 to-warning/10 rounded-xl p-8 border border-danger-red/20 text-center">
            <Clock className="h-16 w-16 text-danger-red mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-dark dark:text-white mb-4">Exam Mode</h2>
            <p className="text-gray dark:text-light-gray mb-6 max-w-2xl mx-auto">
              Enter a strict timed environment that simulates real exam conditions. No distractions, no interruptions -
              just you and your knowledge.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-dark-light rounded-lg p-4">
                <Target className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-dark dark:text-white mb-1">Focused Environment</h3>
                <p className="text-sm text-gray dark:text-light-gray">Distraction-free interface</p>
              </div>
              <div className="bg-white dark:bg-dark-light rounded-lg p-4">
                <Clock className="h-8 w-8 text-warning mx-auto mb-2" />
                <h3 className="font-semibold text-dark dark:text-white mb-1">Timed Sessions</h3>
                <p className="text-sm text-gray dark:text-light-gray">Real exam time limits</p>
              </div>
              <div className="bg-white dark:bg-dark-light rounded-lg p-4">
                <Award className="h-8 w-8 text-success mx-auto mb-2" />
                <h3 className="font-semibold text-dark dark:text-white mb-1">Performance Tracking</h3>
                <p className="text-sm text-gray dark:text-light-gray">Detailed analytics</p>
              </div>
            </div>
            <button className="gradient-primary text-white px-8 py-3 rounded-lg font-semibold hover:shadow-glow transition-all duration-300 flex items-center mx-auto">
              <Clock className="h-5 w-5 mr-2" />
              Enter Exam Mode
            </button>
          </div>

          {/* Recent Exam Sessions */}
          <div className="bg-white dark:bg-dark-light rounded-xl p-6 shadow-card">
            <h3 className="text-lg font-semibold text-dark dark:text-white mb-4">Recent Exam Sessions</h3>
            <div className="space-y-4">
              {[
                { subject: "Mathematics", score: 92, duration: "2h 30m", date: "2 days ago" },
                { subject: "Chemistry", score: 87, duration: "1h 45m", date: "1 week ago" },
                { subject: "Physics", score: 95, duration: "2h 15m", date: "2 weeks ago" },
              ].map((session, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-light dark:bg-dark rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-dark dark:text-white">{session.subject}</h4>
                      <p className="text-sm text-gray dark:text-light-gray">{session.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-dark dark:text-white">{session.score}%</div>
                    <div className="text-sm text-gray dark:text-light-gray">{session.duration}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Public Notes Tab */}
      {activeTab === "public-notes" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-dark-light rounded-xl p-6 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h2 className="text-xl font-semibold text-dark dark:text-white mb-4 sm:mb-0">Public Study Resources</h2>
              <div className="flex space-x-2">
                <select className="px-3 py-2 border border-light-gray dark:border-dark-light rounded-lg bg-light dark:bg-dark text-dark dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option>All Subjects</option>
                  <option>Mathematics</option>
                  <option>Chemistry</option>
                  <option>Physics</option>
                  <option>History</option>
                </select>
                <select className="px-3 py-2 border border-light-gray dark:border-dark-light rounded-lg bg-light dark:bg-dark text-dark dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary">
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
                  className="border border-light-gray dark:border-dark-light rounded-lg p-4 hover:bg-light dark:hover:bg-dark transition-colors animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">{getFileIcon(note.type)}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-dark dark:text-white mb-1 truncate">{note.title}</h3>
                      <p className="text-sm text-gray dark:text-light-gray mb-2">
                        by {note.author} • {note.subject}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray dark:text-light-gray mb-3">
                        <div className="flex items-center space-x-1">
                          <Download className="h-3 w-3" />
                          <span>{note.downloads.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-warning fill-current" />
                          <span>{note.rating}</span>
                        </div>
                        <span>{note.size}</span>
                      </div>
                      <button className="text-primary hover:text-primary-dark text-sm font-medium transition-colors flex items-center">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upload Section */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 border border-primary/20">
            <div className="text-center">
              <Upload className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-dark dark:text-white mb-2">Share Your Knowledge</h3>
              <p className="text-gray dark:text-light-gray mb-4">
                Upload your study notes and help other students succeed
              </p>
              <button className="gradient-primary text-white px-6 py-2 rounded-lg font-medium hover:shadow-glow transition-all duration-300">
                Upload Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
