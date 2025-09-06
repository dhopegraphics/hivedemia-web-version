"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Users,
  Trophy,
  Clock,
  Star,
} from "lucide-react";
import { useAuthStore } from "@/backend/store/authStore";

export default function LandingPage() {
  const router = useRouter();
  const { session, hydrated } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleAuthNavigation = (path: string) => {
    if (!isMounted || !hydrated) return;

    if (session) {
      // If user is already logged in, redirect to dashboard
      router.push("/dashboard");
    } else {
      // If not logged in, proceed to auth pages
      router.push(path);
    }
  };
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-border-light sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gradient">Hivedemia</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleAuthNavigation("/auth/login")}
                className="text-text-secondary hover:text-primary transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => handleAuthNavigation("/auth/signup")}
                className="gradient-primary text-white px-4 py-2 rounded-lg hover:shadow-primary transition-all duration-300"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32 bg-gradient-to-br from-white via-surface to-primary-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in-scale">
            <h1 className="text-4xl md:text-6xl font-bold text-text-primary mb-6">
              Transform Your
              <span className="text-gradient block">Learning Journey</span>
            </h1>
            <p className="text-xl text-text-secondary mb-8 max-w-3xl mx-auto">
              Hivedemia combines AI-powered tools with essential student
              features like planners, quizzes, competitions, and collaborative
              learning to boost your academic success.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => handleAuthNavigation("/auth/signup")}
                className="gradient-primary text-white px-8 py-4 rounded-xl font-semibold hover:shadow-primary hover:scale-105 transition-all duration-300 flex items-center justify-center"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <Link
                href="#features"
                className="border-2 border-primary bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:bg-primary hover:text-white hover:scale-105 transition-all duration-300"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Comprehensive tools designed to enhance your productivity,
              learning, and collaboration
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <BookOpen className="h-8 w-8" />,
                title: "Smart Planner",
                description:
                  "AI-powered task management and scheduling with calendar integration for exams and deadlines.",
              },
              {
                icon: <Brain className="h-8 w-8" />,
                title: "AI Study Assistant",
                description:
                  "Personalized study recommendations and AI-generated quizzes tailored to your learning style.",
              },
              {
                icon: <Users className="h-8 w-8" />,
                title: "Collaborative Hubs",
                description:
                  "Share notes, participate in study groups, and access public academic resources.",
              },
              {
                icon: <Trophy className="h-8 w-8" />,
                title: "Competitions & Games",
                description:
                  "Engage in academic challenges and gamified learning experiences with peers.",
              },
              {
                icon: <Clock className="h-8 w-8" />,
                title: "Exam Mode",
                description:
                  "Strict timed environment for simulating real exam conditions and practice tests.",
              },
              {
                icon: <Star className="h-8 w-8" />,
                title: "Progress Tracking",
                description:
                  "Monitor your learning progress with detailed analytics and achievement badges.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover hover:scale-105 transition-all duration-300 animate-fade-in surface-elevated hover-lift"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-primary mb-4 p-3 bg-primary-subtle rounded-lg w-fit">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshots/Mockups Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              See Hivedemia in Action
            </h2>
            <p className="text-xl text-text-secondary">
              Experience the intuitive interface designed for modern students
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-card-elevated surface-elevated hover-lift">
              <div className="bg-gradient-to-br from-primary-subtle to-secondary-subtle rounded-xl h-64 flex items-center justify-center mb-4 border border-border-light">
                <div className="text-center">
                  <BookOpen className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-text-primary">
                    Dashboard Preview
                  </h3>
                </div>
              </div>
              <h4 className="text-xl font-semibold text-text-primary mb-2">
                Personalized Dashboard
              </h4>
              <p className="text-text-secondary">
                Quick access to all your tools with AI-powered recommendations
                and upcoming tasks.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-card-elevated surface-elevated hover-lift">
              <div className="bg-gradient-to-br from-secondary-subtle to-primary-subtle rounded-xl h-64 flex items-center justify-center mb-4 border border-border-light">
                <div className="text-center">
                  <Brain className="h-16 w-16 text-secondary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-text-primary">
                    Study Tools
                  </h3>
                </div>
              </div>
              <h4 className="text-xl font-semibold text-text-primary mb-2">
                AI-Powered Learning
              </h4>
              <p className="text-text-secondary">
                Smart quizzes, study timers, and personalized learning paths to
                maximize your potential.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-subtle via-white to-secondary-subtle">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl text-text-secondary mb-8">
            Join thousands of students who are already excelling with Hivedemia
          </p>
          <button
            onClick={() => handleAuthNavigation("/auth/signup")}
            className="gradient-primary text-white px-8 py-4 rounded-xl font-semibold hover:shadow-primary hover:scale-105 transition-all duration-300 inline-flex items-center animate-bounce-in"
          >
            Start Your Journey Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-text-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gradient-warm mb-4">
              Hivedemia
            </h3>
            <p className="text-gray-light mb-4">
              Empowering students with AI-driven educational tools
            </p>
            <div className="flex justify-center space-x-6">
              <Link
                href="/privacy"
                className="text-gray-light hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-gray-light hover:text-primary transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/contact"
                className="text-gray-light hover:text-primary transition-colors"
              >
                Contact
              </Link>
            </div>
            <div className="mt-8 pt-8 border-t border-gray">
              <p className="text-gray-light">
                © 2024 Hivedemia. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
