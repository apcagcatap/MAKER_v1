"use client"

import type { Quest } from "@/lib/types"
import { Users, Edit, Trash2 } from "lucide-react"

interface QuestManagementCardProps {
  quest: Quest
  participantCount?: number
  isLoading?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

export function QuestManagementCard({ quest, participantCount = 0, isLoading = false, onEdit, onDelete }: QuestManagementCardProps) {
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
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900">{quest.title}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getDifficultyColor(quest.difficulty)}`}>
              {quest.difficulty}
            </span>
          </div>
          <p className="text-gray-600 text-sm line-clamp-2">{quest.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-3 text-sm text-gray-600">
        <Users className="w-4 h-4 text-blue-500" />
        <span>{participantCount} participants</span>
      </div>

      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={onEdit}
          disabled={isLoading}
          type="button"
          className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-gray-200 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={onDelete}
          disabled={isLoading}
          type="button"
          className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-gray-200 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}