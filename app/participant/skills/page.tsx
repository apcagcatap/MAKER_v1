import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ParticipantNav } from "@/components/layout/participant-nav"
import { SkillCard } from "@/components/participant/skill-card"
import { Progress } from "@/components/ui/progress"

export default async function SkillsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch all skills
  const { data: allSkills } = await supabase.from("skills").select("*").order("name")

  // Fetch user's skill progress
  const { data: userSkills } = await supabase
    .from("user_skills")
    .select(`
      *,
      skill:skills(*)
    `)
    .eq("user_id", user.id)

  const userSkillsMap = new Map(userSkills?.map((us) => [us.skill_id, us]) || [])

  // Calculate overall progress
  const totalSkills = allSkills?.length || 0
  const learnedSkills = userSkills?.length || 0
  const overallProgress = totalSkills > 0 ? (learnedSkills / totalSkills) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <ParticipantNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Skills</h1>
          <p className="text-gray-600">Track your progress across different skills</p>
        </div>

        {/* Overall Progress Card */}
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-8 text-white mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Level {profile?.level || 1}</h2>
              <p className="text-white/90">Total XP: {profile?.xp || 0}</p>
            </div>
            <div className="text-right">
              <p className="text-white/90 text-sm mb-1">Skills Progress</p>
              <p className="text-2xl font-bold">
                {learnedSkills} / {totalSkills}
              </p>
            </div>
          </div>
          <Progress value={overallProgress} className="h-3 bg-white/20" />
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allSkills?.map((skill) => (
            <SkillCard key={skill.id} skill={skill} userSkill={userSkillsMap.get(skill.id)} />
          ))}
        </div>
      </main>
    </div>
  )
}
