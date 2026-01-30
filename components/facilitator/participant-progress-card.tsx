"use client"

import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Clock, AlertCircle, Circle } from "lucide-react"

interface ParticipantProgressCardProps {
  userQuest: any
  onClick?: () => void
}

export function ParticipantProgressCard({ userQuest, onClick }: ParticipantProgressCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case "in_progress":
        return <Clock className="w-5 h-5 text-blue-500" />
      case "not_started":
        return <Circle className="w-5 h-5 text-gray-400" />
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 border-green-200"
      case "in_progress":
        return "bg-blue-50 border-blue-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress === 100) return "bg-green-500"
    if (progress >= 50) return "bg-blue-500"
    if (progress >= 25) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border-2 p-4 cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(
        userQuest.status
      )}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {getStatusIcon(userQuest.status)}
            <h4 className="font-bold text-gray-900">{userQuest.quest.title}</h4>
          </div>
          <p className="text-sm text-gray-600 line-clamp-1">{userQuest.quest.description}</p>
        </div>
      </div>

      {userQuest.status === "in_progress" && (
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Progress</span>
            <span className="font-semibold text-gray-900">{userQuest.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getProgressColor(userQuest.progress)}`}
              style={{ width: `${userQuest.progress}%` }}
            />
          </div>
          {userQuest.current_level !== null && (
            <p className="text-xs text-gray-500 mt-2">
              Level {userQuest.current_level + 1} of {userQuest.quest.levels?.length || 0}
            </p>
          )}
        </div>
      )}

      {userQuest.status === "completed" && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="w-4 h-4" />
          <span className="font-medium">Completed</span>
          {userQuest.completed_at && (
            <span className="text-gray-500">
              • {new Date(userQuest.completed_at).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {userQuest.status === "not_started" && (
        <p className="text-sm text-gray-500">Not started yet</p>
      )}
    </div>
  )
}