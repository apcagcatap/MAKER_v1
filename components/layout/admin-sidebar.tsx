"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Users,
  Shield,
  LogOut,
  Trophy,
  BarChart3,
  MessageSquare
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard", match: (p: string) => p === "/admin" },
  { href: "/admin/users", icon: Users, label: "User Management", match: (p: string) => p.startsWith("/admin/users") },
  { href: "/admin/analytics", icon: BarChart3, label: "Analytics & Reports", match: (p: string) => p.startsWith("/admin/analytics") },
  { href: "/admin/quests", icon: Trophy, label: "Quest Management", match: (p: string) => p.startsWith("/admin/quests") },
  { href: "/admin/forums", icon: MessageSquare, label: "Forums", match: (p: string) => p.startsWith("/admin/forums") },
]

export function AdminSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <Sidebar collapsible="icon" className="admin-sidebar-theme border-r-0">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-3 py-4">
          <SidebarTrigger className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ED262A] text-white">
              <Shield className="size-5" />
            </div>
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate text-base font-bold">MAKER</span>
              <span className="truncate text-xs text-sidebar-foreground/60">Admin Panel</span>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup className="py-4">
          <SidebarGroupLabel className="text-xs uppercase tracking-wider mb-2">
            Platform
          </SidebarGroupLabel>
          <SidebarMenu className="gap-2">
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  size="lg"
                  isActive={pathname ? item.match(pathname) : false}
                  tooltip={item.label}
                >
                  <a href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="pb-4">
        <SidebarSeparator className="mb-2" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={handleSignOut} tooltip="Sign Out">
              <LogOut />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}