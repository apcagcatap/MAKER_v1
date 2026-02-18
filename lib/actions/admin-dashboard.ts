"use server"

import { getAdminClient } from "@/lib/supabase/admin"
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  differenceInDays,
  format,
  eachDayOfInterval,
  subDays,
} from "date-fns"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface KpiCard {
  label: string
  value: number
  previousValue: number
  changePercent: number
  trend: "up" | "down" | "flat"
}

export interface RoleSplit {
  role: string
  count: number
  fill: string
}

export interface QuestStatusSplit {
  status: string
  count: number
  fill: string
}

export interface SignupSparkline {
  day: string
  count: number
}

export interface TopQuest {
  id: string
  title: string
  participants: number
  completions: number
  completionRate: number
}

export interface RecentUser {
  id: string
  email: string
  display_name: string | null
  role: string
  created_at: string
  avatar_url: string | null
}

export interface ActivityItem {
  id: string
  type: "signup" | "quest_start" | "quest_complete" | "forum_post"
  description: string
  timestamp: string
  user_display_name: string | null
  user_email: string
}

export interface DashboardData {
  kpis: {
    totalUsers: KpiCard
    activeQuests: KpiCard
    questCompletions: KpiCard
    forumPosts: KpiCard
  }
  roleSplit: RoleSplit[]
  questStatusSplit: QuestStatusSplit[]
  signupSparkline: SignupSparkline[]
  topQuests: TopQuest[]
  recentUsers: RecentUser[]
  recentActivity: ActivityItem[]
  completionTrend: { month: string; completions: number; starts: number }[]
}

// ─── Main Fetcher ────────────────────────────────────────────────────────────

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = getAdminClient()

  const now = new Date()
  const thisMonthStart = startOfMonth(now)
  const thisMonthEnd = endOfMonth(now)
  const lastMonthStart = startOfMonth(subMonths(now, 1))
  const lastMonthEnd = endOfMonth(subMonths(now, 1))

  // ── Parallel data fetch ───────────────────────────────────────────────────

  const [
    profilesRes,
    profilesThisMonth,
    profilesLastMonth,
    questsRes,
    userQuestsRes,
    forumPostsThisMonth,
    forumPostsLastMonth,
    recentUsersRes,
    recentPostsRes,
    recentStartsRes,
    recentCompletionsRes,
  ] = await Promise.all([
    // All profiles (for role split + total)
    supabase
      .from("profiles")
      .select("id, role, created_at, archived")
      .eq("archived", false),

    // Signups this month
    supabase
      .from("profiles")
      .select("id, created_at")
      .gte("created_at", thisMonthStart.toISOString())
      .lte("created_at", thisMonthEnd.toISOString()),

    // Signups last month
    supabase
      .from("profiles")
      .select("id")
      .gte("created_at", lastMonthStart.toISOString())
      .lte("created_at", lastMonthEnd.toISOString()),

    // All quests
    supabase
      .from("quests")
      .select("id, title, status, is_active, created_at, archived")
      .eq("archived", false),

    // All user_quests
    supabase
      .from("user_quests")
      .select("id, user_id, quest_id, status, started_at, completed_at"),

    // Forum posts this month
    supabase
      .from("forum_posts")
      .select("id, created_at")
      .eq("archived", false)
      .gte("created_at", thisMonthStart.toISOString())
      .lte("created_at", thisMonthEnd.toISOString()),

    // Forum posts last month
    supabase
      .from("forum_posts")
      .select("id")
      .eq("archived", false)
      .gte("created_at", lastMonthStart.toISOString())
      .lte("created_at", lastMonthEnd.toISOString()),

    // Recent users (latest 5)
    supabase
      .from("profiles")
      .select("id, email, display_name, role, created_at, avatar_url")
      .order("created_at", { ascending: false })
      .limit(5),

    // Recent forum posts (for activity feed)
    supabase
      .from("forum_posts")
      .select("id, created_at, user_id, content, profiles:user_id(display_name, email)")
      .eq("archived", false)
      .order("created_at", { ascending: false })
      .limit(5),

    // Recent quest starts
    supabase
      .from("user_quests")
      .select("id, started_at, user_id, quest_id, quests:quest_id(title), profiles:user_id(display_name, email)")
      .not("started_at", "is", null)
      .order("started_at", { ascending: false })
      .limit(5),

    // Recent quest completions
    supabase
      .from("user_quests")
      .select("id, completed_at, user_id, quest_id, quests:quest_id(title), profiles:user_id(display_name, email)")
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(5),
  ])

  const profiles = profilesRes.data ?? []
  const signupsThisMonth = profilesThisMonth.data ?? []
  const signupsLastMonth = profilesLastMonth.data ?? []
  const quests = questsRes.data ?? []
  const userQuests = userQuestsRes.data ?? []
  const postsThisMonth = forumPostsThisMonth.data ?? []
  const postsLastMonth = forumPostsLastMonth.data ?? []
  const recentUsers = (recentUsersRes.data ?? []) as RecentUser[]

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const totalUsersNow = profiles.length
  // "Previous" for total users = users who existed before this month
  const totalUsersLastMonth = profiles.filter(
    (p) => new Date(p.created_at) < thisMonthStart
  ).length

  const activeQuestsNow = quests.filter(
    (q) => q.status === "Published" && q.is_active
  ).length
  const activeQuestsLastMonth = quests.filter((q) => {
    return (
      q.status === "Published" &&
      q.is_active &&
      new Date(q.created_at) < thisMonthStart
    )
  }).length

  const completionsThisMonth = userQuests.filter((uq) => {
    if (!uq.completed_at) return false
    const d = new Date(uq.completed_at)
    return d >= thisMonthStart && d <= thisMonthEnd
  }).length

  const completionsLastMonth = userQuests.filter((uq) => {
    if (!uq.completed_at) return false
    const d = new Date(uq.completed_at)
    return d >= lastMonthStart && d <= lastMonthEnd
  }).length

  const postsThisMonthCount = postsThisMonth.length
  const postsLastMonthCount = postsLastMonth.length

  function buildKpi(
    label: string,
    current: number,
    previous: number
  ): KpiCard {
    const diff = current - previous
    const changePercent =
      previous === 0
        ? current > 0
          ? 100
          : 0
        : Math.round((diff / previous) * 100)
    const trend: "up" | "down" | "flat" =
      diff > 0 ? "up" : diff < 0 ? "down" : "flat"
    return { label, value: current, previousValue: previous, changePercent, trend }
  }

  // ── Role Split (pie chart) ────────────────────────────────────────────────

  const roleCounts: Record<string, number> = {}
  profiles.forEach((p) => {
    const r = p.role || "participant"
    roleCounts[r] = (roleCounts[r] || 0) + 1
  })

  const roleColors: Record<string, string> = {
    participant: "#004A98",
    facilitator: "#ED262A",
    admin: "#1E1E1E",
  }

  const roleSplit: RoleSplit[] = Object.entries(roleCounts).map(
    ([role, count]) => ({
      role: role.charAt(0).toUpperCase() + role.slice(1),
      count,
      fill: roleColors[role] || "#94a3b8",
    })
  )

  // ── Quest Status Split ────────────────────────────────────────────────────

  const statusCounts: Record<string, number> = {}
  quests.forEach((q) => {
    const s = q.status || "Draft"
    statusCounts[s] = (statusCounts[s] || 0) + 1
  })

  const statusColors: Record<string, string> = {
    Draft: "#94a3b8",
    Published: "#22c55e",
    Archived: "#f59e0b",
  }

  const questStatusSplit: QuestStatusSplit[] = Object.entries(statusCounts).map(
    ([status, count]) => ({
      status,
      count,
      fill: statusColors[status] || "#94a3b8",
    })
  )

  // ── Signup Sparkline (last 14 days) ───────────────────────────────────────

  const sparklineStart = subDays(now, 13)
  const sparklineDays = eachDayOfInterval({ start: sparklineStart, end: now })
  const sparklineMap: Record<string, number> = {}
  sparklineDays.forEach((d) => {
    sparklineMap[format(d, "yyyy-MM-dd")] = 0
  })

  signupsThisMonth.forEach((p) => {
    const key = format(new Date(p.created_at), "yyyy-MM-dd")
    if (sparklineMap[key] !== undefined) sparklineMap[key]++
  })

  // Also count signups from last month's end if they fall in our 14-day window
  profiles.forEach((p) => {
    const key = format(new Date(p.created_at), "yyyy-MM-dd")
    if (sparklineMap[key] !== undefined) {
      // Re-count (overwrite only from full set to be accurate)
    }
  })

  // Rebuild more accurately from full profile set
  const sparklineMapFull: Record<string, number> = {}
  sparklineDays.forEach((d) => {
    sparklineMapFull[format(d, "yyyy-MM-dd")] = 0
  })
  profiles.forEach((p) => {
    const key = format(new Date(p.created_at), "yyyy-MM-dd")
    if (sparklineMapFull[key] !== undefined) sparklineMapFull[key]++
  })

  const signupSparkline: SignupSparkline[] = sparklineDays.map((d) => ({
    day: format(d, "MMM d"),
    count: sparklineMapFull[format(d, "yyyy-MM-dd")] || 0,
  }))

  // ── Top Quests by Participation ───────────────────────────────────────────

  const questParticipation: Record<
    string,
    { title: string; participants: number; completions: number }
  > = {}

  quests.forEach((q) => {
    questParticipation[q.id] = { title: q.title, participants: 0, completions: 0 }
  })

  userQuests.forEach((uq) => {
    if (questParticipation[uq.quest_id]) {
      questParticipation[uq.quest_id].participants++
      if (uq.status === "completed" || uq.completed_at) {
        questParticipation[uq.quest_id].completions++
      }
    }
  })

  const topQuests: TopQuest[] = Object.entries(questParticipation)
    .map(([id, data]) => ({
      id,
      title: data.title,
      participants: data.participants,
      completions: data.completions,
      completionRate:
        data.participants > 0
          ? Math.round((data.completions / data.participants) * 100)
          : 0,
    }))
    .sort((a, b) => b.participants - a.participants)
    .slice(0, 5)

  // ── Completion Trend (last 6 months) ──────────────────────────────────────

  const completionTrend: { month: string; completions: number; starts: number }[] = []

  for (let i = 5; i >= 0; i--) {
    const m = subMonths(now, i)
    const mStart = startOfMonth(m)
    const mEnd = endOfMonth(m)

    const starts = userQuests.filter((uq) => {
      if (!uq.started_at) return false
      const d = new Date(uq.started_at)
      return d >= mStart && d <= mEnd
    }).length

    const completions = userQuests.filter((uq) => {
      if (!uq.completed_at) return false
      const d = new Date(uq.completed_at)
      return d >= mStart && d <= mEnd
    }).length

    completionTrend.push({
      month: format(m, "MMM"),
      starts,
      completions,
    })
  }

  // ── Recent Activity Feed ──────────────────────────────────────────────────

  const activityItems: ActivityItem[] = []

  // Recent signups
  recentUsers.slice(0, 3).forEach((u) => {
    activityItems.push({
      id: `signup-${u.id}`,
      type: "signup",
      description: `New ${u.role} registered`,
      timestamp: u.created_at,
      user_display_name: u.display_name,
      user_email: u.email,
    })
  })

  // Recent forum posts
  ;(recentPostsRes.data ?? []).slice(0, 3).forEach((p: any) => {
    const profile = p.profiles
    activityItems.push({
      id: `post-${p.id}`,
      type: "forum_post",
      description: `Posted in forum`,
      timestamp: p.created_at,
      user_display_name: profile?.display_name ?? null,
      user_email: profile?.email ?? "",
    })
  })

  // Recent quest starts
  ;(recentStartsRes.data ?? []).slice(0, 3).forEach((uq: any) => {
    const profile = uq.profiles
    const quest = uq.quests
    activityItems.push({
      id: `start-${uq.id}`,
      type: "quest_start",
      description: `Started "${quest?.title ?? "a quest"}"`,
      timestamp: uq.started_at,
      user_display_name: profile?.display_name ?? null,
      user_email: profile?.email ?? "",
    })
  })

  // Recent completions
  ;(recentCompletionsRes.data ?? []).slice(0, 3).forEach((uq: any) => {
    const profile = uq.profiles
    const quest = uq.quests
    activityItems.push({
      id: `complete-${uq.id}`,
      type: "quest_complete",
      description: `Completed "${quest?.title ?? "a quest"}"`,
      timestamp: uq.completed_at,
      user_display_name: profile?.display_name ?? null,
      user_email: profile?.email ?? "",
    })
  })

  // Sort by most recent
  activityItems.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  // ── Return ────────────────────────────────────────────────────────────────

  return {
    kpis: {
      totalUsers: buildKpi("Total Users", totalUsersNow, totalUsersLastMonth),
      activeQuests: buildKpi(
        "Active Quests",
        activeQuestsNow,
        activeQuestsLastMonth
      ),
      questCompletions: buildKpi(
        "Quest Completions",
        completionsThisMonth,
        completionsLastMonth
      ),
      forumPosts: buildKpi(
        "Forum Posts",
        postsThisMonthCount,
        postsLastMonthCount
      ),
    },
    roleSplit,
    questStatusSplit,
    signupSparkline,
    topQuests,
    recentUsers,
    recentActivity: activityItems.slice(0, 10),
    completionTrend,
  }
}
