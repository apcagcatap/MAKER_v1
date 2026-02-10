import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FacilitatorNav } from "@/components/layout/facilitator-nav"
import { StatsCard } from "@/components/participant/stats-card"
import { Users, Target, Award, TrendingUp } from "lucide-react"
import { getLatestQuest } from "@/lib/actions/quests"
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

  // Fetch the latest active quest for the featured section
  const latestQuest = await getLatestQuest()

  return (
    <div className="min-h-screen bg-blue-900">
      {/* Header Section with Greeting */}
      <div
        className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden"
        style={{ borderBottomLeftRadius: "2rem", borderBottomRightRadius: "2rem" }}
      >
        <div className="absolute inset-0 opacity-100 z-0">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url('/navbarBg.png')`,
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderBottomLeftRadius: "2rem",
              borderBottomRightRadius: "2rem",
            }}
          />
        </div>
        <div className="relative z-10">
          <FacilitatorNav />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 md:pt-8 pb-6 sm:pb-8 md:pb-12">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
              <div className="relative flex-shrink-0">
                <Image 
                  src="/hismarty.png" 
                  alt="Owl" 
                  width={180} 
                  height={180} 
                  className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-44 lg:h-44 object-contain" 
                />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg text-center sm:text-left break-words max-w-full px-2 sm:px-0">
                Hi there, {profile.display_name || "Facilitator"}!
              </h1>
            </div>
          </div>
        </div>
      </div>

      <main className="relative -mt-8 sm:-mt-12 md:-mt-16 z-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Combined Card Section */} 
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 md:mb-8 flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Left Side: Department Info and Quest Card */} 
          <div className="lg:w-1/2 flex flex-col gap-4 sm:gap-6 lg:gap-8">
            {/* Department Info - Top Left */} 
            <div className="p-3 sm:p-4 bg-blue-600 text-white rounded-xl w-full sm:max-w-xs">
              <p className="text-xs opacity-80">DEPARTMENT OF SCIENCE AND TECHNOLOGY</p>
              <h3 className="text-sm sm:text-base md:text-lg font-bold">Science and Technology</h3>
              <p className="text-xs sm:text-sm">Information Institute</p>
            </div>

            {/* Left Section: Featured Quest Card (Formerly Light The Tower) */} 
            <div className="bg-blue-600 rounded-xl p-4 sm:p-6 text-white flex flex-col justify-between flex-grow">
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
                  {latestQuest ? latestQuest.title : "No Active Quests"}
                </h2>
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="bg-white rounded-full p-2 sm:p-3 mr-2 sm:mr-3 md:mr-4 flex-shrink-0">
                    {/* Icon placeholder */} 
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-blue-600 sm:w-6 sm:h-6"
                    >
                      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </div>
                  <p className="text-sm sm:text-base md:text-lg line-clamp-2">
                    {latestQuest 
                      ? "Check out the most recently created quest on the platform." 
                      : "Create a new quest to get started!"}
                  </p>
                </div>
                {latestQuest && (
                  <span className="bg-red-500 text-white text-xs font-semibold px-2 sm:px-2.5 py-0.5 rounded-full capitalize">
                    {latestQuest.difficulty || "General"}
                  </span>
                )}
              </div>
              {/* Visual Divider / Progress Placeholder */} 
              <div className="mt-3 sm:mt-4 h-2 bg-blue-400 rounded-full">
                <div className="h-full bg-white rounded-full w-1/2"></div>
              </div>
            </div>
          </div>

          {/* Right Section: Quest Details (Dynamic) */} 
          <div className="lg:w-1/2 bg-white rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg flex flex-col justify-between border border-gray-100">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                {latestQuest ? "About this Quest" : "Welcome"}
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-gray-700 leading-relaxed">
                {latestQuest 
                  ? latestQuest.description 
                  : "There are currently no active quests. Click the button below to create your first quest and it will be featured here."}
              </p>
            </div>
            <div className="flex justify-end mt-4 sm:mt-6">
              <Button 
                asChild
                className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded w-full sm:w-auto text-sm sm:text-base h-9 sm:h-10"
              >
                <a href="/facilitator/quests">Manage Quests</a>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */} 
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          <StatsCard
            title="Total Participants"
            value={totalParticipants || 0}
            icon={<Users className="w-5 h-5 sm:w-6 sm:h-6" />}
            gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
          />
          <StatsCard
            title="Active Quests"
            value={totalQuests || 0}
            icon={<Target className="w-5 h-5 sm:w-6 sm:h-6" />}
            gradient="bg-gradient-to-br from-purple-500 to-pink-500"
          />
          <StatsCard
            title="In Progress"
            value={activeQuests || 0}
            icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />}
            gradient="bg-gradient-to-br from-orange-500 to-red-500"
          />
          <StatsCard
            title="Completed"
            value={completedQuests || 0}
            icon={<Award className="w-5 h-5 sm:w-6 sm:h-6" />}
            gradient="bg-gradient-to-br from-green-500 to-emerald-500"
          />
        </div>
      </main>
    </div>
  )
}