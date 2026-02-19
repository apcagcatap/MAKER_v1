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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
      {/* 🟦 Navbar + Background + Progress Section */}
      <div
        className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden"
        style={{ borderBottomLeftRadius: "2rem", borderBottomRightRadius: "2rem" }}
      >
        {/* Background Image Overlay */}
        <div className="absolute inset-0 opacity-100">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("/navbarBg.png")`,
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderBottomLeftRadius: "2rem",
              borderBottomRightRadius: "2rem",
            }}
          />
        </div>

        {/* Navbar */}
        <ParticipantNav />

        {/* Header + Progress - EXTREMELY SHORTENED PADDING */}
        <div className="relative w-full px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6">
          <div className="flex flex-row items-center justify-between gap-4 max-w-5xl mx-auto">
            {/* 🖼️ Left: Image - SMALLER SIZE TO REDUCE HEIGHT */}
            <div className="flex-shrink-0">
              <img
                src="/standsmarty.png"
                alt="Mascot"
                className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 object-contain drop-shadow-xl"
              />
            </div>

            {/* 📊 Right: Overall Progress Card - COMPACT STYLE */}
            <div className="flex-1 bg-gradient-to-br from-[#80BEFF] to-blue-600 rounded-xl p-3 sm:p-4 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl font-bold">Level {profile?.level || 1}</h2>
                  <p className="text-white/90 text-[10px] sm:text-xs">Total XP: {profile?.xp || 0}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/90 text-[10px] sm:text-xs">Skills Progress</p>
                  <p className="text-sm sm:text-base md:text-lg font-bold">
                    {learnedSkills} / {totalSkills}
                  </p>
                </div>
              </div>
              <Progress value={overallProgress} className="h-1.5 bg-white/20" />
            </div>
          </div>
        </div>
      </div>

      {/* 🧭 Skills List Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg mb-1">Skills</h1>
        <p className="text-white/80 text-xs sm:text-sm mb-6">
          Track your progress across different skills
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {allSkills?.map((skill) => (
            <SkillCard key={skill.id} skill={skill} userSkill={userSkillsMap.get(skill.id)} />
          ))}
        </div>
      </main>
    </div>
  )
}