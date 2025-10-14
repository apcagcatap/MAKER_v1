"use client"

import type { Profile } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"

interface UserTableRowProps {
  user: Profile
  onEdit?: () => void
  onDelete?: () => void
}

export function UserTableRow({ user, onEdit, onDelete }: UserTableRowProps) {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Admin</Badge>
      case "facilitator":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Facilitator</Badge>
      case "participant":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Participant</Badge>
      default:
        return <Badge>{role}</Badge>
    }
  }

  return (
    <tr className="border-b border-border hover:bg-muted transition-colors">
      <td className="px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-avatar rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
            {user.display_name?.[0] || "U"}
          </div>
          <div>
            <div className="font-bold text-card-foreground text-base">{user.display_name || "Unknown"}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-8 py-6">{getRoleBadge(user.role)}</td>
      <td className="px-8 py-6 text-card-foreground font-semibold text-base">Level {user.level}</td>
      <td className="px-8 py-6 text-card-foreground font-semibold text-base">{user.xp} XP</td>
      <td className="px-8 py-6 text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</td>
      <td className="px-8 py-6">
        <div className="flex items-center gap-2">
          <Button onClick={onEdit} variant="ghost" size="sm" className="text-interactive-primary hover:text-interactive-primary-hover hover:bg-blue-50 h-9 px-3">
            <Edit className="w-4 h-4" />
          </Button>
          <Button onClick={onDelete} variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9 px-3">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
}
