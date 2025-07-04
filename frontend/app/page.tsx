import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Users,
  Trophy,
  Clock,
  Star,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-light dark:bg-dark">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-dark-light/80 backdrop-blur-md border-b border-light-gray dark:border-dark-light sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gradient">Hivedemia</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-gray dark:text-light-gray hover:text-primary dark:hover:text-primary transition-colors"
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in-scale">
            <h1 className="text-4xl md:text-6xl font-bold text-dark dark:text-white mb-6">
              Transform Your
              <span className="text-gradient block">Learning Journey</span>
            </h1>
            <p className="text-xl text-gray dark:text-light-gray mb-8 max-w-3xl mx-auto">
              Hivedemia combines AI-powered tools with essential student
              features like planners, quizzes, competitions, and collaborative
              learning to boost your academic success.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="gradient-primary text-white px-8 py-4 rounded-lg font-semibold hover:shadow-glow transition-all duration-300 flex items-center justify-center"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="#features"
                className="border-2 border-primary text-primary dark:text-primary px-8 py-4 rounded-lg font-semibold hover:bg-primary hover:text-white transition-all duration-300"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-dark-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-bold text-dark dark:text-white mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-xl text-gray dark:text-light-gray max-w-2xl mx-auto">
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
                className="bg-light dark:bg-dark p-6 rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-primary mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-dark dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray dark:text-light-gray">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshots/Mockups Section */}
      <section className="py-20 bg-light dark:bg-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-dark dark:text-white mb-4">
              See Hivedemia in Action
            </h2>
            <p className="text-xl text-gray dark:text-light-gray">
              Experience the intuitive interface designed for modern students
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-dark-light rounded-xl p-8 shadow-card">
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg h-64 flex items-center justify-center mb-4">
                <div className="text-center">
                  <BookOpen className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-dark dark:text-white">
                    Dashboard Preview
                  </h3>
                </div>
              </div>
              <h4 className="text-xl font-semibold text-dark dark:text-white mb-2">
                Personalized Dashboard
              </h4>
              <p className="text-gray dark:text-light-gray">
                Quick access to all your tools with AI-powered recommendations
                and upcoming tasks.
              </p>
            </div>

            <div className="bg-white dark:bg-dark-light rounded-xl p-8 shadow-card">
              <div className="bg-gradient-to-br from-secondary/10 to-primary/10 rounded-lg h-64 flex items-center justify-center mb-4">
                <div className="text-center">
                  <Brain className="h-16 w-16 text-secondary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-dark dark:text-white">
                    Study Tools
                  </h3>
                </div>
              </div>
              <h4 className="text-xl font-semibold text-dark dark:text-white mb-2">
                AI-Powered Learning
              </h4>
              <p className="text-gray dark:text-light-gray">
                Smart quizzes, study timers, and personalized learning paths to
                maximize your potential.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white dark:bg-dark-light">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-dark dark:text-white mb-4">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl text-gray dark:text-light-gray mb-8">
            Join thousands of students who are already excelling with Hivedemia
          </p>
          <Link
            href="/auth/signup"
            className="gradient-primary text-white px-8 py-4 rounded-lg font-semibold hover:shadow-glow transition-all duration-300 inline-flex items-center animate-bounce-in"
          >
            Start Your Journey Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark dark:bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gradient mb-4">Hivedemia</h3>
            <p className="text-light-gray mb-4">
              Empowering students with AI-driven educational tools
            </p>
            <div className="flex justify-center space-x-6">
              <Link
                href="/privacy"
                className="text-light-gray hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-light-gray hover:text-primary transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/contact"
                className="text-light-gray hover:text-primary transition-colors"
              >
                Contact
              </Link>
            </div>
            <div className="mt-8 pt-8 border-t border-dark-light">
              <p className="text-light-gray">
                © 2024 Hivedemia. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
