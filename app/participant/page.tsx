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

  // Fetch user data
  const { data: userData } = await supabase.from("users").select("*").eq("id", user.id).single()

  // Check if user has participant role in any workshop
  const { data: workshopRoles } = await supabase
    .from("workshop_user")
    .select("role")
    .eq("user_id", user.id)

  const isParticipant = workshopRoles?.some(w => w.role === 'participant') || 
                        (workshopRoles && workshopRoles.length === 0) // Allow if no assignments yet

  if (!userData || !isParticipant) {
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
    <div className="min-h-screen">
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

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 ">
          <div className="mb-12 text-center">
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="relative">
                <div>
                  <img src="hismarty.png" alt="Owl" className="w-60 h-60 object-contain" />
                </div>
              </div>
              <h1 className="text-5xl font-bold text-white drop-shadow-lg">
                Hi there, {userData.display_name || "Maker"}!
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
    <div className="max-w-5xl mx-auto bg-gradient-to-r from-blue-50 to-gray-100 rounded-3xl shadow-xl overflow-hidden mb-12 border border-gray-200">
      <div className="p-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-3xl px-6 py-4 inline-block mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {featuredQuest.skill?.name?.charAt(0) || "S"}
                </span>
              </div>
            </div>
            <div className="text-white">
              <div className="text-xs uppercase tracking-wide font-medium opacity-90">
                Department of Science and Technology
              </div>
              <div className="font-bold text-lg">
                {featuredQuest.skill?.name || "Science and Technology"}
              </div>
              <div className="text-sm opacity-90 font-bold">Science and Technology Information Institute</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Left Card - Quest Info */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 text-white shadow-lg">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <div className="w-16 h-16 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <h3 className="text-2xl font-bold mb-4 text-center">{featuredQuest.title}</h3>
            <p className="text-center text-sm mb-6 text-blue-50">
              Will you be a keeper of the Tower Flame?
            </p>
            
            <div className="flex items-center justify-center gap-3">
              <span className="px-4 py-1.5 bg-red-500 text-white text-sm font-semibold rounded-full shadow-md">
                {featuredQuest.difficulty || "Beginner"}
              </span>
              <div className="flex-1 max-w-[200px] h-2 bg-blue-400 bg-opacity-40 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: "25%" }} />
              </div>
            </div>
          </div>

          {/* Right Section - Goal */}
          <div className="pt-4">
            <h4 className="text-3xl font-bold text-gray-900 mb-6">Goal Of This Quest</h4>
            <p className="text-gray-700 leading-relaxed text-base">
              {featuredQuest.description ||
                "Design and build a functional sensor array using an Arduino that can detect motion or environmental changes, triggering a signal to light up a watchtower. This quest introduces the basics of physical computing, wiring, and sensor integration your mission is to bring the tower to life and guard the realm!"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 ">
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
          <h2 className="text-2xl font-bold text-white mb-4">Explore New Quests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableQuests?.map((quest) => (
              <QuestCard key={quest.id} quest={quest} />
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-white text-sm">©Maker</p>
        </div>
      </main>
    </div>
  )
}
