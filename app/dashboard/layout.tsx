"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Home, Calendar, BookOpen, Brain, Users, Settings, LogOut, Menu, X, Bell, Search } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Planner", href: "/dashboard/planner", icon: Calendar },
  { name: "Study Place", href: "/dashboard/study", icon: BookOpen },
  { name: "Quiz Room", href: "/dashboard/quiz", icon: Brain },
  { name: "Hubs", href: "/dashboard/hubs", icon: Users },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <div className="min-h-screen bg-light dark:bg-dark">
      {/* Mobile sidebar */}
      <Suspense fallback={<div>Loading...</div>}>
        <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-dark-light shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-light-gray dark:border-dark-light">
              <h1 className="text-xl font-bold text-gradient">Hivedemia</h1>
              <button onClick={() => setSidebarOpen(false)} className="text-gray hover:text-primary transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="mt-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary border-r-2 border-primary"
                        : "text-gray dark:text-light-gray hover:bg-light-gray/50 dark:hover:bg-dark/50 hover:text-primary"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </Suspense>

      {/* Desktop sidebar */}
      <Suspense fallback={<div>Loading...</div>}>
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
          <div className="flex flex-col flex-grow bg-white dark:bg-dark-light border-r border-light-gray dark:border-dark-light">
            <div className="flex items-center h-16 px-4 border-b border-light-gray dark:border-dark-light">
              <h1 className="text-xl font-bold text-gradient">Hivedemia</h1>
            </div>
            <nav className="mt-4 flex-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary border-r-2 border-primary"
                        : "text-gray dark:text-light-gray hover:bg-light-gray/50 dark:hover:bg-dark/50 hover:text-primary"
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            <div className="border-t border-light-gray dark:border-dark-light p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">JD</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-dark dark:text-white">John Doe</p>
                  <p className="text-xs text-gray dark:text-light-gray">Student</p>
                </div>
              </div>
              <div className="space-y-1">
                <Link
                  href="/dashboard/settings"
                  className="flex items-center px-2 py-2 text-sm text-gray dark:text-light-gray hover:text-primary transition-colors"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
                <Link
                  href="/"
                  className="flex items-center px-2 py-2 text-sm text-gray dark:text-light-gray hover:text-danger-red transition-colors"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Suspense>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white/80 dark:bg-dark-light/80 backdrop-blur-md border-b border-light-gray dark:border-dark-light">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray hover:text-primary transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1 max-w-lg mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 border border-light-gray dark:border-dark-light rounded-lg bg-light dark:bg-dark text-dark dark:text-white placeholder-gray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="text-gray hover:text-primary transition-colors relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-danger-red rounded-full"></span>
              </button>
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center lg:hidden">
                <span className="text-white text-sm font-medium">JD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
