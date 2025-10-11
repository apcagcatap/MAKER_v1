"use client"

import type { Quest } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Trophy, Users, Edit, Trash2 } from "lucide-react"

interface QuestManagementCardProps {
  quest: Quest
  participantCount?: number
  onEdit?: () => void
  onDelete?: () => void
}

export function QuestManagementCard({ quest, participantCount = 0, onEdit, onDelete }: QuestManagementCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-700"
      case "intermediate":
        return "bg-yellow-100 text-yellow-700"
      case "advanced":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-bold text-gray-900">{quest.title}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(quest.difficulty)}`}>
              {quest.difficulty}
            </span>
          </div>
          <p className="text-gray-600 text-sm">{quest.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span>{quest.xp_reward} XP</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-blue-500" />
          <span>{participantCount} participants</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={onEdit} variant="outline" className="flex-1 bg-transparent">
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>
        <Button
          onClick={onDelete}
          variant="outline"
          className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
