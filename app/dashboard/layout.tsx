"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import {
  Home,
  Calendar,
  BookOpen,
  Brain,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
} from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuthStore } from "@/backend/store/authStore";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Planner", href: "/dashboard/planner", icon: Calendar },
  { name: "Study Place", href: "/dashboard/study", icon: BookOpen },
  { name: "Quiz Room", href: "/dashboard/quiz", icon: Brain },
  { name: "Hubs", href: "/dashboard/hubs", icon: Users },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const pathname = usePathname();
  const { logout, session } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    // The AuthGuard will handle the redirect to login page
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const proceedLogout = async () => {
    setShowLogoutConfirm(false);
    await handleLogout();
  };

  // Get user info from session
  const userName = session?.user?.email?.split("@")[0] || "User";
  const userInitials =
    userName
      .split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <AuthGuard requireAuth={true} redirectTo="/auth/login">
      <div className="min-h-screen bg-surface">
        {/* Mobile sidebar */}
        <Suspense fallback={<div>Loading...</div>}>
          <div
            className={`fixed inset-0 z-50 lg:hidden ${
              sidebarOpen ? "block" : "hidden"
            }`}
          >
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-card-elevated">
              <div className="flex items-center justify-between p-4 border-b border-border-light">
                <h1 className="text-xl font-bold text-gradient">Hivedemia</h1>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-text-tertiary hover:text-primary transition-colors p-1 rounded-lg hover:bg-surface"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="mt-4">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-primary-subtle text-primary border-r-3 border-primary shadow-sm"
                          : "text-text-secondary hover:bg-surface hover:text-primary"
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </Suspense>

        {/* Desktop sidebar */}
        <Suspense fallback={<div>Loading...</div>}>
          <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
            <div className="flex flex-col flex-grow bg-white border-r border-border-light shadow-sm">
              <div className="flex items-center h-16 px-4 border-b border-border-light">
                <h1 className="text-xl font-bold text-gradient">Hivedemia</h1>
              </div>
              <nav className="mt-4 flex-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 hover-lift ${
                        isActive
                          ? "bg-primary-subtle text-primary border-r-3 border-primary shadow-sm"
                          : "text-text-secondary hover:bg-surface hover:text-primary"
                      }`}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-border-light p-4 bg-surface/50">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-white text-sm font-medium">
                      {userInitials}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {userName}
                    </p>
                    <p className="text-xs text-text-tertiary">Student</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center px-2 py-2 text-sm text-text-secondary hover:text-primary hover:bg-surface transition-all duration-200 rounded-lg"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    onClick={confirmLogout}
                    className="w-full flex items-center px-2 py-2 text-sm text-text-secondary hover:text-danger-red hover:bg-error-subtle transition-all duration-200 rounded-lg"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Suspense>

        {/* Main content */}
        <div className="lg:pl-64">
          {/* Top bar */}
          <div className="sticky top-0 z-40 glass-effect border-b border-border-light">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-text-tertiary hover:text-primary transition-colors p-2 rounded-lg hover:bg-surface"
              >
                <Menu className="h-6 w-6" />
              </button>

              <div className="flex-1 max-w-lg mx-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-white text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all focus-ring"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button className="text-text-tertiary hover:text-primary transition-colors relative p-2 rounded-lg hover:bg-surface">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-danger-red rounded-full animate-pulse"></span>
                </button>
                <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center lg:hidden shadow-sm">
                  <span className="text-white text-sm font-medium">
                    {userInitials}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm"
              onClick={cancelLogout}
            />
            <div className="relative bg-white rounded-xl shadow-card-elevated max-w-sm w-full mx-4 p-6 surface-elevated animate-fade-in-scale">
              <div className="text-center">
                <div className="w-12 h-12 bg-error-subtle rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogOut className="h-6 w-6 text-danger-red" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Sign Out Confirmation
                </h3>
                <p className="text-text-secondary mb-6">
                  Are you sure you want to sign out of your account? You&apos;ll
                  need to sign in again to access your dashboard.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={cancelLogout}
                    className="flex-1 px-4 py-2 border border-border text-text-secondary rounded-lg hover:bg-surface transition-all duration-200 hover-lift"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={proceedLogout}
                    className="flex-1 px-4 py-2 bg-danger-red text-white rounded-lg hover:bg-danger-red/90 hover:shadow-sm transition-all duration-200 hover-lift"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
