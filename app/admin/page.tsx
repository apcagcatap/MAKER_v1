import { createClient } from "@/lib/supabase/server"
import { 
  Users, 
  ScrollText, 
  Calendar, 
  Award,
  Clock,
  TrendingUp
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AdminDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Note: Authentication and RBAC are handled by middleware (proxy.ts)
  // If user reaches here, they are authenticated and have admin role

  // Fetch statistics
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })

  const { count: totalParticipants } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "participant")

  const { count: totalFacilitators } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "facilitator")

  const { count: totalQuests } = await supabase
    .from("quests")
    .select("*", { count: "exact", head: true })

  const { count: activeQuests } = await supabase
    .from("quests")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)

  const { count: completedQuests } = await supabase
    .from("user_quests")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed")

  // Fetch recent users
  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  const stats = [
    {
      title: "Total Accounts",
      value: totalUsers || 0,
      description: `${totalParticipants || 0} participants, ${totalFacilitators || 0} facilitators`,
      icon: Users,
      color: "bg-blue-600",
    },
    {
      title: "Total Quests",
      value: totalQuests || 0,
      description: `${activeQuests || 0} active quests`,
      icon: ScrollText,
      color: "bg-red-600",
    },
    {
      title: "Completions",
      value: completedQuests || 0,
      description: "Total quest completions",
      icon: Award,
      color: "bg-green-600",
    },
    {
      title: "Workshops",
      value: 0,
      description: "No active workshops",
      icon: Calendar,
      color: "bg-purple-600",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Overview of your Maker Event system</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Clock className="w-4 h-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                    <p className="text-xs text-slate-400 mt-1">{stat.description}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Recent Accounts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentUsers && recentUsers.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-red-500 flex items-center justify-center text-white font-bold">
                      {user.display_name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {user.display_name || "Unnamed User"}
                      </p>
                      <p className="text-sm text-slate-500 truncate">{user.email}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === "admin" 
                        ? "bg-red-100 text-red-700"
                        : user.role === "facilitator"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {user.role}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                No recent users
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-slate-700">Database Status</span>
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  Connected
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-slate-700">Authentication</span>
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <span className="text-sm font-medium text-slate-700">Active Workshop</span>
                </div>
                <span className="text-xs font-medium text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                  None Scheduled
                </span>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-1">Quick Tips</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Create accounts before setting up a workshop</li>
                  <li>• Set up quests with sections for badge progression</li>
                  <li>• Schedule workshops to manage event timings</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
