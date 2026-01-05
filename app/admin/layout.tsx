"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  ScrollText, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  ListTodo,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Admin-specific styles
import "./admin.css"

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/accounts", icon: Users, label: "Accounts" },
  { href: "/admin/workshops", icon: Calendar, label: "Workshops" },
  { href: "/admin/quest-templates", icon: ScrollText, label: "Quest Templates" },
  { href: "/admin/task-templates", icon: ListTodo, label: "Task Templates" },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <div className="admin-theme min-h-screen flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 text-white flex flex-col transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-blue-700/50">
          {!collapsed && (
            <Link href="/admin" className="flex items-center gap-3">
              <Image
                src="/admin avatar.png"
                alt="Admin Logo"
                width={44}
                height={44}
                className="rounded-lg"
              />
              <span className="text-xl font-bold">MAKER</span>
            </Link>
          )}
          {collapsed && (
            <Image
              src="/admin avatar.png"
              alt="Admin Logo"
              width={40}
              height={40}
              className="rounded-lg mx-auto"
            />
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || 
              (item.href !== "/admin" && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                  isActive 
                    ? "bg-red-600 text-white shadow-lg" 
                    : "text-blue-100 hover:bg-blue-700/50 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-blue-700/50 space-y-1">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-lg w-full text-blue-100 hover:bg-blue-700/50 hover:text-white transition-colors"
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">Logout</span>}
          </button>
          
          {/* Collapse toggle - Desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-full py-2 text-blue-200 hover:text-white transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          collapsed ? "lg:ml-16" : "lg:ml-64"
        )}
      >
        {/* Top bar */}
        <header className="h-16 admin-card border-b border-[var(--admin-border)] flex items-center px-4 lg:px-6 sticky top-0 z-30">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-2 text-[var(--admin-foreground)] hover:bg-[var(--admin-secondary)]"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm admin-text-muted">Admin Panel</span>
            <span className="text-[var(--admin-border)]">/</span>
            <span className="text-sm font-medium text-[var(--admin-foreground)]">
              {navItems.find(item => 
                pathname === item.href || 
                (item.href !== "/admin" && pathname.startsWith(item.href))
              )?.label || "Dashboard"}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
