import type { Profile } from "@/lib/types"
import { Trophy, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"

interface ParticipantCardProps {
  participant: Profile
  questsCompleted?: number
  questsInProgress?: number
  totalQuests?: number
  isAtRisk?: boolean
}

export function ParticipantCard({ 
  participant, 
  questsCompleted = 0,
  questsInProgress = 0,
  totalQuests = 0,
  isAtRisk = false
}: ParticipantCardProps) {
  const completionRate = totalQuests > 0 ? Math.round((questsCompleted / totalQuests) * 100) : 0
  
  return (
    <Link
      href={`/facilitator/participants/${participant.id}`}
      className={`block bg-white rounded-xl border-2 p-4 sm:p-6 hover:shadow-lg transition-shadow ${
        isAtRisk ? "border-red-200 bg-red-50" : "border-gray-200"
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0">
          {participant.display_name?.[0] || "U"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{participant.display_name || "Unknown User"}</h3>
            {isAtRisk && (
              <div className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0">
                <AlertCircle className="w-3 h-3" />
                At Risk
              </div>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 truncate">{participant.email}</p>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3">
            <div className="flex items-center gap-1 text-gray-600">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
              <span className="text-xs sm:text-sm">Level {participant.level}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
              <span className="text-xs sm:text-sm">{participant.xp} XP</span>
            </div>
          </div>

          {/* Progress Stats */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-blue-50 rounded-lg p-2 text-center">
              <p className="font-semibold text-blue-600">{questsInProgress}</p>
              <p className="text-gray-600">In Progress</p>
            </div>
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <p className="font-semibold text-green-600">{questsCompleted}</p>
              <p className="text-gray-600">Completed</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-2 text-center">
              <p className="font-semibold text-purple-600">{completionRate}%</p>
              <p className="text-gray-600">Rate</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}