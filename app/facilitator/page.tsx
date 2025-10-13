import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FacilitatorNav } from "@/components/layout/facilitator-nav"
import { StatsCard } from "@/components/participant/stats-card"
import { Users, Target, Award, TrendingUp } from "lucide-react"
import { QuestManagementCard } from "@/components/facilitator/quest-management-card"
import Image from "next/image"

export default async function FacilitatorDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "facilitator") {
    redirect("/auth/login")
  }

  // Fetch statistics
  const { count: totalParticipants } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "participant")

  const { count: totalQuests } = await supabase
    .from("quests")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)

  const { count: completedQuests } = await supabase
    .from("user_quests")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed")

  const { count: activeQuests } = await supabase
    .from("user_quests")
    .select("*", { count: "exact", head: true })
    .eq("status", "in_progress")

  // Fetch recent quests
  const { data: recentQuests } = await supabase
    .from("quests")
    .select(`
      *,
      skill:skills(*)
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(6)

  return (
    <div className="min-h-screen">
      {/* Header Section with Greeting */}
      <div
        className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden"
        style={{ borderBottomLeftRadius: "3rem", borderBottomRightRadius: "3rem" }}
      >
        <div className="absolute inset-0 opacity-100 z-0">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url('/navbarBg.png')`,
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderBottomLeftRadius: "3rem",
              borderBottomRightRadius: "3rem",
            }}
          />
        </div>
        <div className="relative z-10">
          <FacilitatorNav />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="relative">
                <Image src="/hismarty.png" alt="Owl" width={180} height={180} className="w-44 h-44 object-contain" />
              </div>
              <h1 className="text-5xl font-bold text-white drop-shadow-lg">
                Hi there, {profile.display_name || "Facilitator"}!
              </h1>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        {/* REMOVED the old greeting card/header here; everything else stays */}
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Participants"
            value={totalParticipants || 0}
            icon={<Users className="w-6 h-6" />}
            gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
          />
          <StatsCard
            title="Active Quests"
            value={totalQuests || 0}
            icon={<Target className="w-6 h-6" />}
            gradient="bg-gradient-to-br from-purple-500 to-pink-500"
          />
          <StatsCard
            title="In Progress"
            value={activeQuests || 0}
            icon={<TrendingUp className="w-6 h-6" />}
            gradient="bg-gradient-to-br from-orange-500 to-red-500"
          />
          <StatsCard
            title="Completed"
            value={completedQuests || 0}
            icon={<Award className="w-6 h-6" />}
            gradient="bg-gradient-to-br from-green-500 to-emerald-500"
          />
        </div>

        {/* Recent Quests */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-cyan-100">Recent Quests</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentQuests?.map((quest) => (
              <QuestManagementCard key={quest.id} quest={quest} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
