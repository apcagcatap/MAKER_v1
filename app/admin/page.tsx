import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminNav } from "@/components/layout/admin-nav"
import { StatsCard } from "@/components/participant/stats-card"
import { Users, Target, Award, MessageSquare, TrendingUp, Activity } from "lucide-react"
import Image from "next/image"

export default async function AdminDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/auth/login")
  }

  // Fetch comprehensive statistics
  const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true })

  const { count: totalParticipants } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "participant")

  const { count: totalFacilitators } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "facilitator")

  const { count: totalQuests } = await supabase.from("quests").select("*", { count: "exact", head: true })

  const { count: activeQuests } = await supabase
    .from("quests")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)

  const { count: totalSkills } = await supabase.from("skills").select("*", { count: "exact", head: true })

  const { count: totalForums } = await supabase.from("forums").select("*", { count: "exact", head: true })

  const { count: totalPosts } = await supabase.from("forum_posts").select("*", { count: "exact", head: true })

  const { count: completedQuests } = await supabase
    .from("user_quests")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed")

  const { count: inProgressQuests } = await supabase
    .from("user_quests")
    .select("*", { count: "exact", head: true })
    .eq("status", "in_progress")

  // Fetch recent activity
  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div
      className="min-h-screen bg-gradient-page-bg relative flex flex-col"
      style={{
        backgroundImage: `url("/navbarBg.png")`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <AdminNav />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        <div className="mb-12 text-center">
          <div className="relative flex justify-center mb-8">
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
              <Image src="/hismarty.png" alt="Owl" width={200} height={200} className="object-contain" />
            </div>
            <h1 className="text-5xl font-bold text-white drop-shadow-lg pt-48">
              Admin Dashboard
            </h1>
          </div>
        </div>
      </div>

      <main className="relative z-20 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex-grow pb-8">
        <div className="bg-card rounded-xl shadow-lg p-6">
          {/* User Stats */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-card-foreground mb-4">User Statistics</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <StatsCard
                title="Total Users"
                value={totalUsers || 0}
                icon={<Users className="w-6 h-6" />}
                gradient="bg-blue-600"
              />
              <StatsCard
                title="Participants"
                value={totalParticipants || 0}
                icon={<Users className="w-6 h-6" />}
                gradient="bg-blue-500"
              />
              <StatsCard
                title="Facilitators"
                value={totalFacilitators || 0}
                icon={<Users className="w-6 h-6" />}
                gradient="bg-blue-500"
              />
              <StatsCard
                title="Active Quests"
                value={inProgressQuests || 0}
                icon={<Activity className="w-6 h-6" />}
                gradient="bg-blue-600"
              />
            </div>
          </div>

          {/* Content Stats */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-card-foreground mb-4">Content Statistics</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <StatsCard
                title="Total Quests"
                value={totalQuests || 0}
                icon={<Target className="w-6 h-6" />}
                gradient="bg-blue-600"
              />
              <StatsCard
                title="Skills"
                value={totalSkills || 0}
                icon={<Award className="w-6 h-6" />}
                gradient="bg-blue-500"
              />
              <StatsCard
                title="Forums"
                value={totalForums || 0}
                icon={<MessageSquare className="w-6 h-6" />}
                gradient="bg-blue-600"
              />
              <StatsCard
                title="Forum Posts"
                value={totalPosts || 0}
                icon={<MessageSquare className="w-6 h-6" />}
                gradient="bg-blue-500"
              />
            </div>
          </div>

          {/* Engagement Stats */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-card-foreground mb-4">Engagement Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Quest Completion Rate</h3>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {totalQuests && completedQuests
                    ? Math.round(((completedQuests || 0) / (totalQuests * (totalParticipants || 1))) * 100)
                    : 0}
                  %
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {completedQuests || 0} completed out of {(totalQuests || 0) * (totalParticipants || 1)} total attempts
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Active Quest Rate</h3>
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {totalQuests ? Math.round(((activeQuests || 0) / totalQuests) * 100) : 0}%
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {activeQuests || 0} active out of {totalQuests || 0} total quests
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Avg Posts per Forum</h3>
                  <MessageSquare className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {totalForums ? Math.round((totalPosts || 0) / totalForums) : 0}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {totalPosts || 0} total posts across {totalForums || 0} forums
                </p>
              </div>
            </div>
          </div>

          {/* Recent Users */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Users</h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers?.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-muted">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-avatar rounded-full flex items-center justify-center text-white font-bold">
                            {user.display_name?.[0] || "U"}
                          </div>
                          <div>
                            <div className="font-semibold text-card-foreground">{user.display_name || "Unknown"}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900">Level {user.level}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

        {/* Footer */}
        <footer className="mt-auto w-full bg-blue-900/30 backdrop-blur-sm border-t border-blue-700/30 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-4 text-center">
              <h3 className="font-bold text-white text-lg">About MAKER</h3>
              <p className="text-sm text-blue-100 max-w-2xl mx-auto">
                A gamified learning platform for hands-on maker education, empowering participants to build, create, and innovate.
              </p>
              <div className="flex justify-center gap-8 text-sm text-blue-100">
                <a href="/admin/forums" className="hover:text-white transition-colors">Community Forums</a>
                <a href="/admin/settings" className="hover:text-white transition-colors">Documentation</a>
              </div>
              <div className="text-sm text-blue-200 pt-4 border-t border-blue-700/30 mt-4">
                <p className="font-semibold">Department of Science and Technology</p>
                <p>Science and Technology Information Institute</p>
              </div>
            </div>
          </div>
        </footer>
    </div>
  )
}
