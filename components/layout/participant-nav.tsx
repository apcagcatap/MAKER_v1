"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Home, Target, Award, User, Info, MessageSquare } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function ParticipantNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const navItems = [
    { href: "/participant/quests", icon: Target, label: "Quests" },
    { href: "/participant/skills", icon: Award, label: "Skills" },
    { href: "/participant/forums", icon: MessageSquare, label: "Forums" },
    { href: "/participant/about", icon: Info, label: "About" },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-gradient-nav-dark shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/participant" className="flex items-center gap-2 text-2xl font-bold text-white">
              <Image src="/hismarty.png" alt="MAKER Owl" width={40} height={40} className="object-contain" />
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
                      isActive ? "bg-brand-blue text-white" : "text-on-blue hover:bg-brand-blue-hover hover:text-white"
                    }`}
                  >
                    {Icon && <Icon className="w-5 h-5" />}
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/participant/account"
              className="flex items-center gap-2 px-4 py-2 text-on-blue hover:text-white transition-colors"
            >
              <span className="font-medium">Account</span>
              <div className="w-8 h-8 bg-gradient-avatar rounded-full flex items-center justify-center text-white font-bold">
                <User className="w-5 h-5" />
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-on-blue hover:text-white transition-colors"
            >
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
