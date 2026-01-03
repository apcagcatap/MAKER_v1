import { createClient } from "@/lib/supabase/server"
import { 
  Users, 
  ScrollText, 
  Calendar, 
  Clock,
  TrendingUp,
  UserPlus,
  Link as LinkIcon
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AdminDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Note: Authentication and RBAC are handled by middleware (proxy.ts)
  // If user reaches here, they are authenticated and have admin role

  // Fetch statistics from new schema
  const { count: totalUsers } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })

  const { count: totalQuests } = await supabase
    .from("quest")
    .select("*", { count: "exact", head: true })

  const { count: totalWorkshops } = await supabase
    .from("workshop")
    .select("*", { count: "exact", head: true })

  const { count: totalAssignments } = await supabase
    .from("workshop_user")
    .select("*", { count: "exact", head: true })

  const { count: totalQuestAssignments } = await supabase
    .from("workshop_quest")
    .select("*", { count: "exact", head: true })

  // Fetch recent users
  const { data: recentUsers } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  // Fetch recent workshops
  const { data: recentWorkshops } = await supabase
    .from("workshop")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  const stats = [
    {
      title: "Total Users",
      value: totalUsers || 0,
      description: "Registered accounts",
      icon: Users,
      color: "bg-blue-600",
    },
    {
      title: "Total Quests",
      value: totalQuests || 0,
      description: "Available quests",
      icon: ScrollText,
      color: "bg-purple-600",
    },
    {
      title: "Workshops",
      value: totalWorkshops || 0,
      description: "Created workshops",
      icon: Calendar,
      color: "bg-green-600",
    },
    {
      title: "User Assignments",
      value: totalAssignments || 0,
      description: "Workshop-user links",
      icon: UserPlus,
      color: "bg-orange-600",
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
              Recent Users
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentUsers && recentUsers.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-500 flex items-center justify-center text-white font-bold">
                      {u.display_name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {u.display_name || "Unnamed User"}
                      </p>
                      <p className="text-sm text-slate-500 truncate">{u.email}</p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                No users yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Workshops */}
        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              Recent Workshops
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentWorkshops && recentWorkshops.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentWorkshops.map((workshop) => (
                  <div key={workshop.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {workshop.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {new Date(workshop.event_date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                No workshops yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-slate-200">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Quick Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">1. Create Quests</h4>
              <p className="text-sm text-blue-700">
                Define quests that participants can complete during workshops.
              </p>
            </div>
            <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">2. Set Up Workshops</h4>
              <p className="text-sm text-green-700">
                Create workshops with dates and assign quests to them.
              </p>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">3. Assign Users</h4>
              <p className="text-sm text-purple-700">
                Add participants and facilitators to your workshops.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
