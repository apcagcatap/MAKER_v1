"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, User } from "lucide-react"
import Link from "next/link"

interface UserEntry {
  id: string
  display_name: string | null
  avatar_url: string | null
  role: string
}

interface UserSearchSidebarProps {
  users: UserEntry[]
  currentProfileId: string
}

const roleColors: Record<string, string> = {
  facilitator: "bg-[#004A98] text-white",
  participant: "bg-emerald-600 text-white",
}

export function UserSearchSidebar({ users, currentProfileId }: UserSearchSidebarProps) {
  const [search, setSearch] = useState("")

  const visibleUsers = useMemo(() => {
    return users.filter((u) => u.role === "facilitator" || u.role === "participant")
  }, [users])

  const filtered = useMemo(() => {
    if (!search.trim()) return visibleUsers
    const q = search.toLowerCase()
    return visibleUsers.filter(
      (u) => u.display_name?.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
    )
  }, [search, visibleUsers])

  return (
    <Card className="bg-white border-gray-200 shadow-lg rounded-2xl sticky top-8">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-[#1E1E1E] flex items-center gap-2">
          <User className="w-5 h-5 text-[#004A98]" />
          Users
        </CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 bg-gray-50 border-gray-200 text-[#1E1E1E] placeholder:text-gray-400 focus:border-[#004A98] focus:ring-[#004A98]/20 rounded-lg"
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="max-h-[500px] overflow-y-auto space-y-1 -mx-1 px-1">
          {filtered.length > 0 ? (
            filtered.map((u) => {
              const isActive = u.id === currentProfileId
              return (
                <Link
                  key={u.id}
                  href={`/profile/${encodeURIComponent(u.display_name || "")}`}
                  className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      u.display_name?.[0]?.toUpperCase() || "?"
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate ${isActive ? "text-[#004A98]" : "text-[#1E1E1E]"}`}>
                      {u.display_name || "Unknown"}
                    </p>
                    <Badge variant="outline" className={`${roleColors[u.role] || "bg-gray-500 text-white"} text-[10px] px-1.5 py-0 h-4 border-0`}>
                      {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                    </Badge>
                  </div>
                </Link>
              )
            })
          ) : (
            <p className="text-gray-400 text-sm text-center py-6">No users found.</p>
          )}
        </div>
        <p className="text-xs text-gray-400 text-center mt-3 pt-3 border-t border-gray-100">
          {filtered.length} of {visibleUsers.length} users
        </p>
      </CardContent>
    </Card>
  )
}
