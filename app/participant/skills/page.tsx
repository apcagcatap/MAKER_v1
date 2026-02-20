import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ParticipantNav } from "@/components/layout/participant-nav"
import { SkillCard } from "@/components/participant/skill-card"
import { Progress } from "@/components/ui/progress"
import { calculateLevel } from "@/lib/utils"
  
export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile for XP
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Calculate Level Progress
  const currentXp = profile?.xp || 0
  const { level, currentLevelProgressXp, xpForNextLevel, progressPercent } = calculateLevel(currentXp)

  // Fetch all skills
  const { data: allSkills } = await supabase.from("skills").select("*").order("name")

  // Fetch COMPLETED quests to determine earned skills
  // We check which skills are associated with quests the user has completed
  const { data: completedQuests } = await supabase
    .from("user_quests")
    .select(`
      quest:quests(skill_id)
    `)
    .eq("user_id", user.id)
    .eq("status", "completed")

  // Create a Set of earned skill IDs
  const earnedSkillIds = new Set<string>()
  completedQuests?.forEach((uq: any) => {
    if (uq.quest?.skill_id) {
      earnedSkillIds.add(uq.quest.skill_id)
    }
  })

  const earnedSkillsCount = earnedSkillIds.size

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
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">Level {level}</h2>
                  <p className="text-white/90 text-xs sm:text-sm md:text-base">
                    XP: {currentLevelProgressXp} / {xpForNextLevel}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white/90 text-xs sm:text-sm mb-0.5 sm:mb-1">Skills Earned</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold">
                    {earnedSkillsCount} Skills
                  </p>
                </div>
              </div>
              {/* Progress bar now reflects XP Level, not skills count */}
              <Progress value={progressPercent} className="h-2 sm:h-3 bg-white/20" />
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
            <SkillCard 
              key={skill.id} 
              skill={skill} 
              status={earnedSkillIds.has(skill.id) ? "completed" : "locked"} 
            />
          ))}
        </div>
      </main>
    </div>
  )
}