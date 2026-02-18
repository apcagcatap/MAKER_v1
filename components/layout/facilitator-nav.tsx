"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Target, Users, Award, MessageSquare, LogOut, Menu, X, User, Settings, Info, ChevronDown, ShieldCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { createPortal } from "react-dom"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function FacilitatorNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [displayName, setDisplayName] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("profiles").select("display_name").eq("id", user.id).single().then(({ data }) => {
          setDisplayName(data?.display_name || null)
        })
      }
    })
  }, [])

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [mobileMenuOpen])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    setMobileMenuOpen(false)
  }

  const navItems = [
    { href: "/facilitator", icon: Home, label: "Home" },
    { href: "/facilitator/quests", icon: Target, label: "Quests" },
    { href: "/facilitator/participants", icon: Users, label: "Participants" },
    { href: "/facilitator/skills", icon: Award, label: "Skills" },
    { href: "/facilitator/forums", icon: MessageSquare, label: "Forums" },
    { href: "/facilitator/verify", icon: ShieldCheck, label: "Verify" },
  ]

  return (
    <>
      {/* HEADER: Background is transparent unless menu is open */}
      <nav className={`relative z-50 transition-colors duration-200 ${
        mobileMenuOpen ? "bg-[#1e3a8a]" : "bg-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/facilitator" className="text-2xl font-bold text-white tracking-tight">
              MAKER
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
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
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 text-blue-100 hover:text-white transition-colors outline-none cursor-pointer">
                  <span className="font-medium">Account</span>
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href={displayName ? `/profile/${encodeURIComponent(displayName)}` : "/facilitator"} className="flex items-center gap-2 cursor-pointer">
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/facilitator" className="flex items-center gap-2 cursor-pointer">
                      <Info className="w-4 h-4" />
                      About
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/facilitator" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-white outline-none"
            >
              {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>
      </nav>

      {/* PORTAL MENU */}
      {mounted && mobileMenuOpen && createPortal(
        <div className="fixed inset-0 z-[99999] lg:hidden pointer-events-none">
          {/* Backdrop - Darker to match image_2d057e.png */}
          <div 
            className="fixed inset-0 bg-black/40 pointer-events-auto" 
            onClick={() => setMobileMenuOpen(false)} 
          />
          
          {/* Menu Drawer */}
          <div className="fixed top-16 left-0 right-0 bg-[#1e3a8a] shadow-2xl pointer-events-auto border-t border-blue-800/50">
            <div className="p-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-lg font-semibold text-base transition-colors ${
                      isActive 
                        ? "bg-[#2563eb] text-white" 
                        : "text-blue-100 hover:bg-blue-800"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
              
              <div className="pt-2 mt-2 border-t border-blue-800/50">
                <Link
                  href={displayName ? `/profile/${encodeURIComponent(displayName)}` : "/facilitator"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 px-4 py-3 rounded-lg font-semibold text-base text-blue-100 hover:bg-blue-800"
                >
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </Link>
                <Link
                  href="/facilitator"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 px-4 py-3 rounded-lg font-semibold text-base text-blue-100 hover:bg-blue-800"
                >
                  <Info className="w-5 h-5" />
                  <span>About</span>
                </Link>
                <Link
                  href="/facilitator"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 px-4 py-3 rounded-lg font-semibold text-base text-blue-100 hover:bg-blue-800"
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-lg font-semibold text-base text-red-300 hover:bg-blue-800"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}