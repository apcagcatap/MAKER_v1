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
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 bg-gradient-avatar rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-md">
          {participant.display_name?.[0] || "U"}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-card-foreground mb-1">{participant.display_name || "Unknown User"}</h3>
          <p className="text-sm text-muted-foreground mb-3">{participant.email}</p>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="w-5 h-5 text-brand-blue" />
              <span className="font-medium">Level {participant.level}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Trophy className="w-5 h-5 text-brand-blue" />
              <span className="font-medium">{participant.xp} XP</span>
            </div>
            <div className="text-gray-600 font-medium">
              <span>{questsCompleted} quests completed</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
