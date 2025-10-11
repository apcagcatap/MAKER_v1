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
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            {user.display_name?.[0] || "U"}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{user.display_name || "Unknown"}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
      <td className="px-6 py-4 text-gray-900">Level {user.level}</td>
      <td className="px-6 py-4 text-gray-900">{user.xp} XP</td>
      <td className="px-6 py-4 text-gray-500 text-sm">{new Date(user.created_at).toLocaleDateString()}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Button onClick={onEdit} variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
          </Button>
          <Button onClick={onDelete} variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
}
