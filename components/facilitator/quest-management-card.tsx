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
        return "difficulty-beginner"
      case "intermediate":
        return "difficulty-intermediate"
      case "advanced":
        return "difficulty-advanced"
      default:
        return "status-not-started"
    }
  }

  return (
    <div className="bg-card rounded-xl border p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-bold text-card-foreground flex-1">{quest.title}</h3>
            <span className={`${getDifficultyColor(quest.difficulty)} ml-2 whitespace-nowrap`}>
              {quest.difficulty}
            </span>
          </div>
          
          <p className="text-muted-foreground text-base mb-4 line-clamp-2">{quest.description}</p>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-interactive-primary" />
              <span className="font-medium">{quest.xp_reward} XP</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-interactive-primary" />
              <span className="font-medium">{participantCount} participants</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="lg:w-48 flex-shrink-0 flex gap-2">
          <Button onClick={onEdit} variant="outline" className="flex-1 text-interactive-primary hover:text-interactive-primary-hover h-11">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            onClick={onDelete}
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-11 px-4"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
