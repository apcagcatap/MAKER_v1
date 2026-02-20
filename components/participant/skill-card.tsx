import type { Skill } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2 } from "lucide-react"

interface SkillCardProps {
  skill: Skill
  status?: "locked" | "completed"
}

export function SkillCard({ skill, status = "locked" }: SkillCardProps) {
  const isCompleted = status === "completed"

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="text-3xl sm:text-4xl flex-shrink-0">{skill.icon || "🎯"}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 break-words">{skill.name}</h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2">{skill.description}</p>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-xs font-medium text-gray-400">Status</span>
            {isCompleted ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Completed
              </Badge>
            ) : (
              <span className="text-xs text-gray-400 italic">Not Started Yet</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}