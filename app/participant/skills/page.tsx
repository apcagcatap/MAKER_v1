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

        {/* Header + Progress inside banner */}
        <div className="relative w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 md:gap-8 lg:gap-10">
            {/* 🖼️ Left: Image */}
            <div className="flex justify-center md:justify-start w-full md:w-auto order-2 md:order-1">
              <img
                src="/standsmarty.png"
                alt="Mascot"
                className="w-32 h-32 sm:w-40 sm:h-40 md:w-56 md:h-56 lg:w-72 lg:h-72 xl:w-76 xl:h-76 object-contain drop-shadow-xl"
              />
            </div>

            {/* 📊 Right: Overall Progress Card */}
            <div className="w-full md:flex-1 bg-gradient-to-br from-[#80BEFF] to-blue-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 text-white shadow-lg order-1 md:order-2">
              <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2 sm:gap-4">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white font-bold drop-shadow-lg mb-2 sm:mb-3 md:mb-4">Skills</h1>
        <p className="text-white/80 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 md:mb-8 lg:mb-10">
          Track your progress across different skills
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
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