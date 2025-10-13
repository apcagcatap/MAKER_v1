"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Target, Users, Award, MessageSquare, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function FacilitatorNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const navItems = [
    { href: "/facilitator", icon: Home, label: "Home" },
    { href: "/facilitator/quests", icon: Target, label: "Active Quests" },
    { href: "/facilitator/participants", icon: Users, label: "Participants" },
    { href: "/facilitator/skills", icon: Award, label: "Skills" },
    { href: "/facilitator/forums", icon: MessageSquare, label: "Forums" },
  ]

  return (
    <nav className="relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/facilitator" className="text-2xl font-bold text-white">
              MAKER
            </Link>
            <div className="flex gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      isActive ? "bg-blue-600 text-white" : "text-blue-100 hover:bg-blue-700 hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-blue-100 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
