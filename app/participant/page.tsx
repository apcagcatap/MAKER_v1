import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ParticipantNav } from "@/components/layout/participant-nav"
import { StatsCard } from "@/components/participant/stats-card"
import { QuestCard } from "@/components/participant/quest-card"
import { Trophy, Target, Award, TrendingUp } from "lucide-react"
import Link from "next/link"

export default async function ParticipantDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "participant") {
    redirect("/auth/login")
  }

  // Fetch user quests with quest details
  const { data: userQuests } = await supabase
    .from("user_quests")
    .select(`
      *,
      quest:quests(
        *,
        skill:skills(*)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Fetch active quests not yet started
  const { data: availableQuests } = await supabase
    .from("quests")
    .select(`
      *,
      skill:skills(*)
    `)
    .eq("is_active", true)
    .limit(3)

  const inProgressQuests = userQuests?.filter((uq) => uq.status === "in_progress") || []
  const completedQuests = userQuests?.filter((uq) => uq.status === "completed") || []

  const featuredQuest = inProgressQuests[0] || availableQuests?.[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden"
        style={{ borderBottomLeftRadius: "3rem", borderBottomRightRadius: "3rem" }}>
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

        <ParticipantNav />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-12 text-center">
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center shadow-2xl">
                  <div className="text-6xl">🦉</div>
                </div>
              </div>
              <h1 className="text-5xl font-bold text-white drop-shadow-lg">
                Hi there, {profile.display_name || "Maker"}!
              </h1>
            </div>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/participant/quests"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Continue Quest
              </Link>
              <Link
                href="/participant/skills"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
                View My Skills
              </Link>
              <Link
                href="/participant/quests"
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Start New Quest
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {featuredQuest && (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden mb-12">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {featuredQuest.skill?.name?.charAt(0) || "M"}
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    Department of Science and Technology
                  </div>
                  <div className="font-semibold text-gray-900">{featuredQuest.skill?.name || "General"} Institute</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                  <h3 className="text-2xl font-bold mb-4">{featuredQuest.title}</h3>
                  <p className="text-blue-100 mb-4">{featuredQuest.description}</p>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-full">
                      {featuredQuest.difficulty || "Beginner"}
                    </span>
                    <div className="flex-1 h-2 bg-blue-400 rounded-full overflow-hidden">
                      <div className="h-full bg-white" style={{ width: "30%" }} />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4">Goal Of This Quest</h4>
                  <p className="text-gray-600 leading-relaxed">
                    {featuredQuest.description ||
                      "Complete this quest to earn XP and unlock new skills. Follow the instructions and complete all tasks to finish this quest successfully."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total XP"
            value={profile.xp}
            icon={<Trophy className="w-6 h-6" />}
            gradient="bg-gradient-to-br from-yellow-400 to-orange-500"
          />
          <StatsCard
            title="Level"
            value={profile.level}
            icon={<TrendingUp className="w-6 h-6" />}
            gradient="bg-gradient-to-br from-purple-500 to-pink-500"
          />
          <StatsCard
            title="Active Quests"
            value={inProgressQuests.length}
            icon={<Target className="w-6 h-6" />}
            gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
          />
          <StatsCard
            title="Completed"
            value={completedQuests.length}
            icon={<Award className="w-6 h-6" />}
            gradient="bg-gradient-to-br from-green-500 to-emerald-500"
          />
        </div>

        {inProgressQuests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Continue Learning</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inProgressQuests.map((userQuest) => (
                <QuestCard key={userQuest.id} quest={userQuest.quest} userQuest={userQuest} />
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Explore New Quests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableQuests?.map((quest) => (
              <QuestCard key={quest.id} quest={quest} />
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">©Maker</p>
        </div>
      </main>
    </div>
  )
}
