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
      {/* Desktop: Horizontal Layout, Mobile: Vertical */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        {/* Left side: Content */}
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
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-medium">{quest.xp_reward} XP</span>
            </div>
            {quest.skill && (
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-interactive-primary" />
                <span className="font-medium">{quest.skill.name}</span>
              </div>
            )}
          </div>

          {status === "in_progress" && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground font-medium">Progress</span>
                <span className="font-bold text-interactive-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          )}
        </div>

        {/* Right side: Action button */}
        <div className="lg:w-48 flex-shrink-0">
          {status === "completed" ? (
            <div className="flex flex-col items-center justify-center gap-3 text-green-600 font-bold p-4 bg-green-50 rounded-lg">
              <Trophy className="w-8 h-8" />
              <span className="text-lg">Completed!</span>
            </div>
          ) : status === "in_progress" ? (
            <Button
              onClick={onContinue}
              className="w-full bg-brand-blue hover:bg-brand-blue-hover h-12 text-base font-semibold"
            >
              Continue Quest
            </Button>
          ) : (
            <Button
              onClick={onStart}
              variant="outline"
              className="w-full border-2 border-purple-600 text-purple-600 hover:bg-purple-50 bg-transparent h-12 text-base font-semibold"
            >
              Start Quest
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
