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
      className="block bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0">
          {participant.display_name?.[0] || "U"}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 truncate">{participant.display_name || "Unknown User"}</h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 break-all">{participant.email}</p>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
              <span>Level {participant.level}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
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