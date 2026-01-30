import type { Skill, UserSkill } from "@/lib/types"
import { Progress } from "@/components/ui/progress"

interface SkillCardProps {
  skill: Skill
  userSkill?: UserSkill
}

export function SkillCard({ skill, userSkill }: SkillCardProps) {
  const level = userSkill?.level || 0
  const xp = userSkill?.xp || 0
  const xpForNextLevel = level * 100
  const progress = xpForNextLevel > 0 ? (xp / xpForNextLevel) * 100 : 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="text-3xl sm:text-4xl flex-shrink-0">{skill.icon || "🎯"}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 break-words">{skill.name}</h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2">{skill.description}</p>

          {userSkill ? (
            <div>
              <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                <span className="text-gray-600">Level {level}</span>
                <span className="font-semibold text-purple-600">
                  {xp} / {xpForNextLevel} XP
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-gray-500 italic">Not started yet</p>
          )}
        </div>
      </div>
    </div>
  )
}