"use client"

import type { Quest } from "@/lib/types"
import { Users, Edit, Archive, Archive } from "lucide-react"

interface QuestManagementCardProps {
  quest: Quest
  participantCount?: number
  isLoading?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onArchive?: () => void
}

export function QuestManagementCard({ 
  quest, 
  participantCount = 0, 
  isLoading = false, 
  onEdit, 
  onDelete,
  onArchive
}: QuestManagementCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
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
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 break-words">{quest.title}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${getDifficultyColor(quest.difficulty)}`}>
              {quest.difficulty}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
              quest.status === 'Published' ? 'bg-green-100 text-green-700' : 
              quest.status === 'Archived' ? 'bg-gray-100 text-gray-700' : 
              'bg-yellow-100 text-yellow-700'
            }`}>
              {quest.status}
            </span>
          </div>
          <p className="text-gray-600 text-xs sm:text-sm line-clamp-2">{quest.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-3 text-xs sm:text-sm text-gray-600">
        <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
        <span>{participantCount} participants</span>
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={onEdit}
          disabled={isLoading}
          type="button"
          className="flex-1 min-w-[80px] px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-gray-200 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs sm:text-sm"
        >
          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Edit</span>
        </button>
        {quest.status !== 'Archived' && onArchive && (
          <button
            onClick={onArchive}
            disabled={isLoading}
            type="button"
            className="px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-gray-200 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            title="Archive"
          >
            <Archive className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        )}
        <button
          onClick={onDelete}
          disabled={isLoading}
          type="button"
          className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-gray-200 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          title="Delete"
        >
          <Archive className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  )
}