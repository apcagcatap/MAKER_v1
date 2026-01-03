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

  // Fetch user data
  const { data: userData } = await supabase.from("users").select("*").eq("id", user.id).single()

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
    <div className="min-h-screen">
      {/* 🟦 Navbar + Background + Progress Section */}
      <div
        className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden"
        style={{ borderBottomLeftRadius: "3rem", borderBottomRightRadius: "3rem" }}
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
              borderBottomLeftRadius: "3rem",
              borderBottomRightRadius: "3rem",
            }}
          />
        </div>

        {/* Navbar */}
        <ParticipantNav />

        {/* Header + Progress inside banner */}
        <div className="relative w-full px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10">
            {/* 🖼️ Left: Image */}
            <div className="flex justify-center md:justify-start w-full md:w-auto">
              <img
                src="/standsmarty.png"
                alt="Mascot"
                className="w-76 h-76 object-contain drop-shadow-xl"
              />
            </div>

            {/* 📊 Right: Overall Progress Card */}
            <div className="w-full md:flex-1 bg-gradient-to-br from-[#80BEFF] to-blue-600 rounded-2xl p-8 text-white shadow-lg mx-auto md:mx-0">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
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
          </div>
        </div>
      </div>

      {/* 🧭 Skills List Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-5xl text-white font-bold drop-shadow-lg mb-4">Skills</h1>
        <p className="text-white/80 text-lg mb-10">
          Track your progress across different skills
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allSkills?.map((skill) => (
            <SkillCard key={skill.id} skill={skill} userSkill={userSkillsMap.get(skill.id)} />
          ))}
        </div>
      </main>
    </div>
  )
}
