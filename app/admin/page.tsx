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
      className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden"
      style={{
        backgroundImage: `url("/navbarBg.png")`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <AdminNav />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 ">
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="relative">
              <div>
                <Image src="/hismarty.png" alt="Owl" width={240} height={240} className="object-contain" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-white drop-shadow-lg">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-lg text-white">Complete system overview and management</p>
        </div>
      </div>

      <main className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24">
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* User Stats */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">User Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Total Users"
                value={totalUsers || 0}
                icon={<Users className="w-6 h-6" />}
                gradient="bg-gradient-to-br from-purple-500 to-pink-500"
              />
              <StatsCard
                title="Participants"
                value={totalParticipants || 0}
                icon={<Users className="w-6 h-6" />}
                gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
              />
              <StatsCard
                title="Facilitators"
                value={totalFacilitators || 0}
                icon={<Users className="w-6 h-6" />}
                gradient="bg-gradient-to-br from-green-500 to-emerald-500"
              />
              <StatsCard
                title="Active Quests"
                value={inProgressQuests || 0}
                icon={<Activity className="w-6 h-6" />}
                gradient="bg-gradient-to-br from-orange-500 to-red-500"
              />
            </div>
          </div>

          {/* Content Stats */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Content Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Total Quests"
                value={totalQuests || 0}
                icon={<Target className="w-6 h-6" />}
                gradient="bg-gradient-to-br from-indigo-500 to-purple-500"
              />
              <StatsCard
                title="Skills"
                value={totalSkills || 0}
                icon={<Award className="w-6 h-6" />}
                gradient="bg-gradient-to-br from-yellow-500 to-orange-500"
              />
              <StatsCard
                title="Forums"
                value={totalForums || 0}
                icon={<MessageSquare className="w-6 h-6" />}
                gradient="bg-gradient-to-br from-teal-500 to-cyan-500"
              />
              <StatsCard
                title="Forum Posts"
                value={totalPosts || 0}
                icon={<MessageSquare className="w-6 h-6" />}
                gradient="bg-gradient-to-br from-pink-500 to-rose-500"
              />
            </div>
          </div>

          {/* Engagement Stats */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Engagement Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            {user.display_name?.[0] || "U"}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{user.display_name || "Unknown"}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
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
    </div>
  )
}
