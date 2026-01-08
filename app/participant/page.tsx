import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ParticipantNav } from "@/components/layout/participant-nav"
import { StatsCard } from "@/components/participant/stats-card"
import { QuestCard } from "@/components/participant/quest-card"
import { Trophy, Target, Award, TrendingUp, Lock } from "lucide-react"
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

  // Fetch upcoming scheduled quests
  const currentDate = new Date().toISOString()
  const { data: upcomingQuests } = await supabase
    .from("quests")
    .select(`
      *,
      skill:skills(*)
    `)
    .eq("is_active", true)
    .eq("status", "Published")
    .not("scheduled_date", "is", null)
    .gte("scheduled_date", currentDate)
    .order("scheduled_date", { ascending: true })
    .limit(3)

  const inProgressQuests = userQuests?.filter((uq) => uq.status === "in_progress") || []
  const completedQuests = userQuests?.filter((uq) => uq.status === "completed") || []

  // Get featured quest - prioritize the most recently accessed quest
  // Sort by started_at (which updates when you open a quest) to get the most recent
  const sortedInProgressQuests = [...inProgressQuests].sort((a, b) => {
    const dateA = new Date(a.started_at).getTime()
    const dateB = new Date(b.started_at).getTime()
    return dateB - dateA // Most recent first
  })
  
  // Use most recently accessed in-progress quest, or most recent quest overall
  const featuredUserQuest = sortedInProgressQuests[0] || userQuests?.[0]
  const featuredQuest = featuredUserQuest?.quest

  // Calculate featured quest progress
  const featuredQuestProgress = (() => {
    if (!featuredUserQuest || !featuredQuest?.levels) return 0
    const currentLevel = featuredUserQuest.current_level || 0
    const totalLevels = featuredQuest.levels.length || 1
    return Math.round((currentLevel / totalLevels) * 100)
  })()

  // Helper function to check if quest is accessible
  const isQuestAccessible = (scheduledDate: string | null) => {
    if (!scheduledDate) return true
    return new Date(scheduledDate) <= new Date()
  }

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

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
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-blue-50 via-white to-gray-50 rounded-3xl shadow-2xl overflow-hidden mb-12 border-2 border-blue-100">
            <div className="p-8">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl px-6 py-4 inline-block mb-8 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md">
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
                {/* Left Card - Quest Info with Marty */}
                <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-3xl p-8 text-white shadow-2xl overflow-hidden">
                  {/* Decorative background elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-12 -mb-12"></div>
                  
                  <div className="relative z-10">
                    {/* Marty Image */}
                    <div className="flex items-center justify-center mb-6">
                      <div className="relative">
                        <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-500 p-1 shadow-xl">
                          <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
                            <img 
                              src="/standsmarty.png" 
                              alt="Marty" 
                              className="w-28 h-28 object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-3 text-center leading-tight">{featuredQuest.title}</h3>
                    <p className="text-center text-sm mb-6 text-blue-100 font-medium">
                      Will you be a keeper of the Tower Flame?
                    </p>
                    
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <span className="px-4 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-bold rounded-full shadow-lg">
                        {featuredQuest.difficulty || "Beginner"}
                      </span>
                      <div className="flex-1 min-w-[150px] max-w-[200px]">
                        <div className="flex items-center justify-between text-xs text-blue-100 mb-1">
                          <span>Progress</span>
                          <span className="font-bold">{featuredQuestProgress}%</span>
                        </div>
                        <div className="h-3 bg-blue-400 bg-opacity-30 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className="h-full bg-gradient-to-r from-white to-blue-100 rounded-full shadow-sm transition-all duration-300" 
                            style={{ width: `${featuredQuestProgress}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Section - Goal */}
                <div className="pt-4">
                  <h4 className="text-3xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    Goal Of This Quest
                  </h4>
                  <p className="text-gray-700 leading-relaxed text-base mb-6">
                    {featuredQuest.description ||
                      "Design and build a functional sensor array using an Arduino that can detect motion or environmental changes, triggering a signal to light up a watchtower. This quest introduces the basics of physical computing, wiring, and sensor integration your mission is to bring the tower to life and guard the realm!"}
                  </p>
                  
                  {/* Continue Button */}
                  <Link
                    href={`/participant/quests/${featuredQuest.id}`}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    Continue Quest
                  </Link>
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
            <h2 className="text-2xl font-bold text-white mb-4">Continue Learning</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inProgressQuests.map((userQuest) => (
                <QuestCard key={userQuest.id} quest={userQuest.quest} userQuest={userQuest} />
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Upcoming Quests</h2>
          {upcomingQuests && upcomingQuests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingQuests.map((quest) => {
                const isAccessible = isQuestAccessible(quest.scheduled_date)
                
                return (
                  <div key={quest.id} className="relative">
                    <QuestCard quest={quest} isLocked={!isAccessible} />
                    {!isAccessible && (
                      <div className="absolute inset-0 bg-gray-900 bg-opacity-70 rounded-lg flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                        <div className="bg-white rounded-full p-4 mb-3 shadow-lg">
                          <Lock className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-white font-bold text-lg mb-1">Coming Soon</p>
                        <p className="text-blue-200 text-sm text-center px-4">
                          Available on<br />
                          {formatDate(quest.scheduled_date!)}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white/10 rounded-lg border-2 border-dashed border-white/20">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <p className="text-white text-lg font-medium mb-2">No Upcoming Quests</p>
              <p className="text-blue-200 text-sm">Check back later for new scheduled quests!</p>
            </div>
          )}
        </div>

        <div className="text-center mt-12">
          <p className="text-white text-sm">©Maker</p>
        </div>
      </main>
    </div>
  )
}