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
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-bold text-card-foreground">{quest.title}</h3>
            <span className={getDifficultyColor(quest.difficulty)}>
              {quest.difficulty}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">{quest.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Trophy className="w-4 h-4 text-interactive-primary" />
          <span>{quest.xp_reward} XP</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-interactive-primary" />
          <span>{participantCount} participants</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={onEdit} variant="outline" className="flex-1 text-interactive-primary hover:text-interactive-primary-hover">
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>
        <Button
          onClick={onDelete}
          variant="outline"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
