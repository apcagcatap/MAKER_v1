"use client"

import { Target, Trophy } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FeaturedQuestCardProps {
  quest: {
    id: string
    title: string
    description: string
    difficulty: string
    xp_reward?: number
    status?: string
    skill?: {
      id: string
      name: string
    } | null
  }
  userQuest?: {
    id: string
    quest_id: string
    user_id: string
    status: string
    started_at?: string
    completed_at?: string
  } | undefined
}

export function FeaturedQuestCard({ quest, userQuest }: FeaturedQuestCardProps) {
  const router = useRouter()

  const getButtonText = () => {
    if (!userQuest) return "Start this Quest"
    if (userQuest.status === "completed") return "Complete"
    return "Continue Quest"
  }

  const getButtonStyle = () => {
    if (userQuest?.status === "completed") {
      return "bg-green-600 hover:bg-green-700"
    }
    if (userQuest?.status === "in_progress") {
      return "bg-yellow-600 hover:bg-yellow-700"
    }
    return "bg-blue-600 hover:bg-blue-700"
  }

  const handleClick = () => {
    router.push(`/participant/quests/${quest.id}`)
  }

  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3">
        <div className="flex items-start gap-3 flex-1 w-full">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
              Featured Quest
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 break-words">{quest.title}</h2>
              <span className="inline-block px-3 py-1 bg-red-50 text-red-600 rounded text-xs font-medium w-fit">
                {quest.difficulty}
              </span>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleClick}
          className={`${getButtonStyle()} text-white px-4 sm:px-6 py-2 rounded-md font-medium transition-colors text-sm sm:text-base w-full sm:w-auto whitespace-nowrap`}
        >
          {getButtonText()}
        </button>
      </div>

      <div className="flex items-start gap-2 mb-4">
        <Trophy className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs sm:text-sm text-gray-600 font-medium">
          Do You Have What It Takes?
        </p>
      </div>

      <p className="text-xs sm:text-sm text-gray-600 mb-4 line-clamp-3">
        {quest.description}
      </p>

      <div className="flex items-center gap-3 flex-wrap">
        {quest.skill && (
          <span className="text-xs text-gray-500">
            {quest.skill.name}
          </span>
        )}
      </div>
    </div>
  )
}