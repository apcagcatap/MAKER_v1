"use client"

import Link from "next/link"
import { Trophy } from "lucide-react"

interface QuestCardProps {
  quest: any
  userQuest?: any
  isLocked?: boolean
}

export function QuestCard({ quest, userQuest, isLocked = false }: QuestCardProps) {
  const getButtonText = () => {
    if (isLocked) return "Locked"
    if (!userQuest) return "Start Quest"
    if (userQuest.status === "completed") return "View Quest"
    return "Continue Quest"
  }

  const getButtonColor = () => {
    if (isLocked) return "bg-gray-400 cursor-not-allowed"
    if (userQuest?.status === "completed") return "bg-green-600 hover:bg-green-700"
    if (userQuest?.status === "in_progress") return "bg-blue-600 hover:bg-blue-700"
    return "bg-blue-600 hover:bg-blue-700"
  }

  const getProgressPercentage = () => {
    if (!userQuest || !quest.levels) return 0
    // Calculate based on current_level if available
    const currentLevel = userQuest.current_level || 0
    const totalLevels = quest.levels.length || 1
    return Math.round((currentLevel / totalLevels) * 100)
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow flex flex-col h-full">
      <div className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex-1">{quest.title}</h3>
          <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium whitespace-nowrap ml-2">
            {quest.difficulty}
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
          {quest.description}
        </p>

        {/* XP and Skill */}
        <div className="flex items-center gap-4 mb-4">
          {quest.xp_reward > 0 && (
            <div className="flex items-center gap-1 text-yellow-600">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">{quest.xp_reward} XP</span>
            </div>
          )}
          {quest.skill && (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
              <span className="text-sm text-gray-600">{quest.skill.name}</span>
            </div>
          )}
        </div>

        {/* Progress Bar (if in progress) */}
        {userQuest && userQuest.status === "in_progress" && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{getProgressPercentage()}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>
        )}

        {/* Spacer to push button to bottom */}
        <div className="flex-1 min-h-2"></div>

        {/* Button - Fixed at bottom */}
        <div className="mt-auto pt-4">
          {isLocked ? (
            <button
              disabled
              className="w-full py-2.5 bg-gray-400 text-white rounded-lg font-medium cursor-not-allowed"
            >
              {getButtonText()}
            </button>
          ) : (
            <Link
              href={`/participant/quests/${quest.id}`}
              className={`block w-full py-2.5 ${getButtonColor()} text-white text-center rounded-lg font-medium transition-colors`}
            >
              {getButtonText()}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}