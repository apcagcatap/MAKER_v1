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
    <div className="bg-card rounded-xl border p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-6">
        <div className="text-6xl flex-shrink-0 w-20 h-20 flex items-center justify-center bg-gradient-to-br from-brand-blue-light to-purple-50 rounded-2xl">
          {skill.icon || "🎯"}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-2xl font-bold text-card-foreground mb-2">{skill.name}</h3>
          <p className="text-base text-muted-foreground mb-4">{skill.description}</p>

          {userSkill ? (
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground font-medium">Level {level}</span>
                <span className="font-bold text-interactive-primary text-base">
                  {xp} / {xpForNextLevel} XP
                </span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Not started yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
