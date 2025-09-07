"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
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
  ChevronLeft,
  ChevronRight,
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
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [manualToggle, setManualToggle] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const pathname = usePathname();
  const { logout, session } = useAuthStore();

  // Auto-collapse sidebar when on settings page, only if user hasn't manually toggled
  useEffect(() => {
    if (manualToggle) return; // Don't auto-manage if user has manually toggled

    const isSettingsPage = pathname === "/dashboard/settings";

    if (isSettingsPage) {
      setSidebarExpanded(false);
    } else {
      setSidebarExpanded(true);
    }
  }, [pathname, manualToggle]);

  const toggleSidebar = () => {
    const newState = !sidebarExpanded;
    setSidebarExpanded(newState);
    setManualToggle(true); // Mark as manually toggled
  };

  const handleLogout = async () => {
    try {
      console.log("🔄 Starting logout from dashboard...");

      // Call logout function
      await logout();

      // Wait a moment for state to propagate
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log("✅ Logout successful, redirecting to login...");

      // Force redirect to login page
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect even if logout fails
      window.location.href = "/auth/login";
    }
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const proceedLogout = async () => {
    await handleLogout();
    setShowLogoutConfirm(false);
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
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-card-elevated">
                <div className="flex items-center justify-between p-4 border-b border-border-light">
                  <div className="flex items-center">
                    <Image
                      src="/images/var-2-primary.png"
                      alt="Hivedemia"
                      width={120}
                      height={40}
                      className="h-8 w-auto"
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSidebarOpen(false);
                    }}
                    className="text-text-tertiary hover:text-primary transition-colors p-1 rounded-lg hover:bg-surface"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <nav className="mt-4 px-2">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center px-3 py-3 mb-1 text-sm font-medium transition-all duration-200 rounded-lg ${
                          isActive
                            ? "bg-primary text-white shadow-sm"
                            : "text-text-secondary hover:bg-surface hover:text-primary"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSidebarOpen(false);
                        }}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          )}
        </Suspense>

        {/* Desktop sidebar */}
        <Suspense fallback={<div>Loading...</div>}>
          <div
            className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ease-in-out ${
              sidebarExpanded ? "lg:w-64" : "lg:w-16"
            }`}
          >
            <div className="flex flex-col flex-grow bg-white border-r border-border-light shadow-sm relative">
              {/* Header */}
              <div className="flex items-center justify-between h-16 px-4 border-b border-border-light">
                {sidebarExpanded ? (
                  <div className="flex items-center transition-opacity duration-200">
                    <Image
                      src="/images/var-2-primary.png"
                      alt="Hivedemia"
                      width={120}
                      height={40}
                      className="h-8 w-auto"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Image
                      src="/images/icon.png"
                      alt="Hivedemia"
                      width={32}
                      height={32}
                      className="h-8 w-8"
                    />
                  </div>
                )}

                {/* Toggle Button */}
                <button
                  onClick={toggleSidebar}
                  className="p-1.5 rounded-lg hover:bg-surface transition-all duration-200 text-text-tertiary hover:text-primary group"
                  title={
                    sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"
                  }
                >
                  {sidebarExpanded ? (
                    <ChevronLeft className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  ) : (
                    <ChevronRight className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  )}
                </button>
              </div>

              {/* Navigation */}
              <nav className="mt-4 flex-1 px-2">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-3 py-3 mb-1 text-sm font-medium transition-all duration-200 rounded-lg group relative ${
                        isActive
                          ? "bg-primary text-white shadow-sm"
                          : "text-text-secondary hover:bg-surface hover:text-primary"
                      }`}
                      title={!sidebarExpanded ? item.name : undefined}
                    >
                      <item.icon
                        className={`h-5 w-5 flex-shrink-0 ${
                          sidebarExpanded ? "mr-3" : "mx-auto"
                        } transition-all duration-200`}
                      />
                      <span
                        className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
                          sidebarExpanded
                            ? "opacity-100 w-auto"
                            : "opacity-0 w-0"
                        }`}
                      >
                        {item.name}
                      </span>

                      {/* Tooltip for collapsed state */}
                      {!sidebarExpanded && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                          {item.name}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* User Section */}
              <div className="border-t border-border-light p-3 bg-surface/50">
                {sidebarExpanded ? (
                  <>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-white text-sm font-medium">
                          {userInitials}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {userName}
                        </p>
                        <p className="text-xs text-text-tertiary">Student</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Link
                        href="/dashboard/settings"
                        className={`flex items-center px-2 py-2 text-sm rounded-lg transition-all duration-200 ${
                          pathname === "/dashboard/settings"
                            ? "bg-primary text-white"
                            : "text-text-secondary hover:text-primary hover:bg-surface"
                        }`}
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
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center shadow-sm mx-auto">
                      <span className="text-white text-sm font-medium">
                        {userInitials}
                      </span>
                    </div>

                    <Link
                      href="/dashboard/settings"
                      className={`flex items-center justify-center p-2 text-sm rounded-lg transition-all duration-200 group relative ${
                        pathname === "/dashboard/settings"
                          ? "bg-primary text-white"
                          : "text-text-secondary hover:text-primary hover:bg-surface"
                      }`}
                      title="Settings"
                    >
                      <Settings className="h-4 w-4" />
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        Settings
                      </div>
                    </Link>

                    <button
                      onClick={confirmLogout}
                      className="w-full flex items-center justify-center p-2 text-sm text-text-secondary hover:text-danger-red hover:bg-error-subtle transition-all duration-200 rounded-lg group relative"
                      title="Sign Out"
                    >
                      <LogOut className="h-4 w-4" />
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        Sign Out
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Suspense>

        {/* Main content */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            sidebarExpanded ? "lg:pl-64" : "lg:pl-16"
          }`}
        >
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
