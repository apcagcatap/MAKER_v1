import "@/app/admin/admin.css"
import { Users, Trophy, CheckCircle2, MessageSquare } from "lucide-react"
import { format } from "date-fns"
import { getDashboardData } from "@/lib/actions/admin-dashboard"

import { KpiCard } from "@/components/admin/dashboard/kpi-card"
import { CompletionTrend } from "@/components/admin/dashboard/completion-trend"
import { DistributionCard } from "@/components/admin/dashboard/distribution-card"
import { TopQuestsCard } from "@/components/admin/dashboard/top-quests-card"
import { ActivityFeed } from "@/components/admin/dashboard/activity-feed"
import { RecentUsersCard } from "@/components/admin/dashboard/recent-users-card"

export default async function AdminDashboard() {
  const data = await getDashboardData()

  const kpis = [
    { kpi: data.kpis.totalUsers, icon: Users, iconColor: "text-blue-600", iconBg: "bg-blue-100" },
    { kpi: data.kpis.activeQuests, icon: Trophy, iconColor: "text-amber-600", iconBg: "bg-amber-100" },
    { kpi: data.kpis.questCompletions, icon: CheckCircle2, iconColor: "text-emerald-600", iconBg: "bg-emerald-100" },
    { kpi: data.kpis.forumPosts, icon: MessageSquare, iconColor: "text-purple-600", iconBg: "bg-purple-100" },
  ] as const

  return (
    <div className="admin-wrapper p-4 md:p-6">
      <div className="admin-header mb-4">
        <h1 className="admin-title">Dashboard</h1>
        <p className="admin-subtitle">
          Platform overview &mdash; {format(new Date(), "MMMM d, yyyy")}
        </p>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-4">
        {kpis.map((props) => (
          <KpiCard key={props.kpi.label} {...props} />
        ))}
      </div>

      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-6 mb-4">
        <div className="xl:col-span-2">
          <CompletionTrend data={data.completionTrend} />
        </div>
        <div className="xl:col-span-1">
          <DistributionCard
            title="Users by Role"
            items={data.roleSplit.map((r) => ({ label: r.role, count: r.count, fill: r.fill }))}
          />
        </div>
        <div className="xl:col-span-1">
          <DistributionCard
            title="Quest Status"
            items={data.questStatusSplit.map((s) => ({ label: s.status, count: s.count, fill: s.fill, dotOnly: true }))}
          />
        </div>
      </div>

      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        <TopQuestsCard quests={data.topQuests} />
        <ActivityFeed items={data.recentActivity} />
        <RecentUsersCard users={data.recentUsers} />
      </div>
    </div>
  )
}
