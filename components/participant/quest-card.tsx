"use client"

import type { Quest, UserQuest } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Trophy, Star } from "lucide-react"

interface QuestCardProps {
  quest: Quest
  userQuest?: UserQuest
  onStart?: () => void
  onContinue?: () => void
}

export function QuestCard({ quest, userQuest, onStart, onContinue }: QuestCardProps) {
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

  const status = userQuest?.status || "not_started"
  const progress = userQuest?.progress || 0

  return (
    <div className="bg-card rounded-xl border p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-card-foreground mb-2">{quest.title}</h3>
          <p className="text-muted-foreground text-sm">{quest.description}</p>
        </div>
        <span className={getDifficultyColor(quest.difficulty)}>
          {quest.difficulty}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span>{quest.xp_reward} XP</span>
        </div>
        {quest.skill && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-interactive-primary" />
            <span>{quest.skill.name}</span>
          </div>
        )}
      </div>

      {status === "in_progress" && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-interactive-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {status === "completed" ? (
        <div className="flex items-center gap-2 text-green-600 font-semibold">
          <Trophy className="w-5 h-5" />
          <span>Completed!</span>
        </div>
      ) : status === "in_progress" ? (
        <Button
          onClick={onContinue}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          Continue Quest
        </Button>
      ) : (
        <Button
          onClick={onStart}
          variant="outline"
          className="w-full border-purple-600 text-purple-600 hover:bg-purple-50 bg-transparent"
        >
          Start Quest
        </Button>
      )}
    </div>
  )
}
