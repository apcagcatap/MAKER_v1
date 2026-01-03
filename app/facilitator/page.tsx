import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FacilitatorNav } from "@/components/layout/facilitator-nav"
import { StatsCard } from "@/components/participant/stats-card"
import { Users, Target, Award, TrendingUp } from "lucide-react"
import { QuestManagementCard } from "@/components/facilitator/quest-management-card"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default async function FacilitatorDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user data
  const { data: userData } = await supabase.from("users").select("*").eq("id", user.id).single()

  // Check if user has facilitator role in any workshop
  const { data: workshopRoles } = await supabase
    .from("workshop_user")
    .select("role")
    .eq("user_id", user.id)

  const isFacilitator = workshopRoles?.some(w => w.role === 'facilitator' || w.role === 'admin')

  if (!userData || !isFacilitator) {
    redirect("/auth/login")
  }

  // Fetch statistics
  const { count: totalParticipants } = await supabase
    .from("workshop_user")
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
                Hi there, {userData.display_name || "Facilitator"}!
              </h1>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Combined Card Section */} 
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 flex flex-col lg:flex-row gap-8">
          {/* Left Side: Department Info and Quest Card */} 
          <div className="lg:w-1/2 flex flex-col gap-8">
            {/* Department Info - Top Left */} 
            <div className="p-4 bg-blue-600 text-white rounded-xl max-w-xs">
              <p className="text-xs opacity-80">DEPARTMENT OF SCIENCE AND TECHNOLOGY</p>
              <h3 className="text-lg font-bold">Science and Technology</h3>
              <p className="text-sm">Information Institute</p>
            </div>

            {/* Left Section: Light The Tower Card */} 
            <div className="bg-blue-600 rounded-xl p-6 text-white flex flex-col justify-between flex-grow">
              <div>
                <h2 className="text-3xl font-bold mb-4">Light The Tower</h2>
                <div className="flex items-center mb-4">
                  <div className="bg-white rounded-full p-3 mr-4">
                    {/* Icon placeholder */} 
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-blue-600"
                    >
                      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </div>
                  <p className="text-lg">Will you be a keeper of the Tower Flame?</p>
                </div>
                <span className="bg-red-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">Beginner</span>
              </div>
              {/* Progress Bar Placeholder */} 
              <div className="mt-4 h-2 bg-blue-400 rounded-full">
                <div className="h-full bg-white rounded-full w-1/2"></div>
              </div>
            </div>
          </div>

          {/* Right Section: Goal Of This Quest */} 
          <div className="lg:w-1/2 bg-white rounded-xl p-8 shadow-lg flex flex-col justify-between">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Goal Of This Quest</h2>
              <p className="text-gray-700 leading-relaxed">
                Design and build a functional sensor array using an Arduino that can detect motion or environmental
                changes, triggering a signal to light up a watchtower. This quest introduces the basics of physical
                computing, wiring, and sensor integration your mission is to bring the tower to life and guard the
                realm!
              </p>
            </div>
            <div className="flex justify-end mt-6">
              <Button className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded">
                Edit
              </Button>
            </div>
          </div>
        </div>

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
