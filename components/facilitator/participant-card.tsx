import type { Profile } from "@/lib/types"
import { Trophy, TrendingUp } from "lucide-react"
import Link from "next/link"

interface ParticipantCardProps {
  participant: Profile
  questsCompleted?: number
}

export function ParticipantCard({ participant, questsCompleted = 0 }: ParticipantCardProps) {
  return (
    <Link
      href={`/facilitator/participants/${participant.id}`}
      className="block bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-avatar rounded-full flex items-center justify-center text-white font-bold text-lg">
          {participant.display_name?.[0] || "U"}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-card-foreground mb-1">{participant.display_name || "Unknown User"}</h3>
          <p className="text-sm text-muted-foreground mb-3">{participant.email}</p>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span>Level {participant.level}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Trophy className="w-4 h-4 text-blue-600" />
              <span>{participant.xp} XP</span>
            </div>
            <div className="text-gray-600">
              <span>{questsCompleted} quests completed</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
