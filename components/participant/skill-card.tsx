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
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        <div className="text-4xl">{skill.icon || "🎯"}</div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{skill.name}</h3>
          <p className="text-sm text-gray-600 mb-4">{skill.description}</p>

          {userSkill ? (
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Level {level}</span>
                <span className="font-semibold text-purple-600">
                  {xp} / {xpForNextLevel} XP
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">Not started yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
