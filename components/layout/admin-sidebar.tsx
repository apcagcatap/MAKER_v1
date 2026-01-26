"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Users,
  Shield,
  Settings,
  FileText,
  LogOut,
  BookOpen,
  Trophy
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
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"

export function AdminSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <SidebarTrigger />
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">MAKER Admin</span>
              <span className="truncate text-xs">System Administration</span>
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === "/admin"}
                tooltip="Dashboard"
              >
                <a href="/admin">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={pathname?.startsWith("/admin/users")}
                tooltip="Users"
              >
                <a href="/admin/users">
                  <Users />
                  <span>User Management</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={pathname?.startsWith("/admin/quests")}
                tooltip="Quests"
              >
                <a href="/admin/quests">
                  <Trophy />
                  <span>Quests</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={pathname?.startsWith("/admin/skills")}
                tooltip="Skills"
              >
                <a href="/admin/skills">
                  <BookOpen />
                  <span>Skills</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={pathname?.startsWith("/admin/content")}
                tooltip="Content"
              >
                <a href="/admin/content">
                  <FileText />
                  <span>Content</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={pathname?.startsWith("/admin/settings")}
                tooltip="Settings"
              >
                <a href="/admin/settings">
                  <Settings />
                  <span>Settings</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip="Sign Out">
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