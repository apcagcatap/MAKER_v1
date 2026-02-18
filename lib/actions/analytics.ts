"use server"

import { getAdminClient } from "@/lib/supabase/admin"
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns"

export async function getAnalyticsData(targetDate?: Date) {
  const supabase = getAdminClient()
  
  // 1. Determine the Month Range
  // If no date is selected, default to current month
  const date = targetDate ? new Date(targetDate) : new Date()
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  
  const monthStartIso = monthStart.toISOString()
  const monthEndIso = monthEnd.toISOString()

  // 2. Fetch Profiles (Signups within this month)
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('created_at')
    .gte('created_at', monthStartIso)
    .lte('created_at', monthEndIso)

  if (profileError) throw profileError

  // 3. Fetch Quest Activity (Started OR Completed within this month)
  // We fetch a bit broadly and filter in JS to calculate the "Close Rate" (Completions / Starts)
  const { data: questData, error: questError } = await supabase
    .from('quests')
    .select(`
      title,
      status,
      is_active,
      user_quests (
        started_at,
        completed_at,
        status
      )
    `)

  if (questError) throw questError

  // --- Process Engagement: Daily Signups for the Month ---
  // Initialize all days in the month with 0 to ensure continuity in the graph
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const engagementMap = daysInMonth.reduce((acc: any, day) => {
    const dayKey = format(day, "yyyy-MM-dd")
    acc[dayKey] = { 
      day: format(day, "d"), // Display "1", "2", "3"...
      fullDate: dayKey,
      users: 0 
    }
    return acc
  }, {})

  // Populate with actual data
  profileData?.forEach(profile => {
    const profileDate = format(new Date(profile.created_at), "yyyy-MM-dd")
    if (engagementMap[profileDate]) {
      engagementMap[profileDate].users += 1
    }
  })

  const engagement = Object.values(engagementMap)

  // --- Process Quests: Monthly Performance ---
  const quests = (questData || []).map(q => {
    const interactions = (q.user_quests as any[]) || []

    // Count Starts in this month
    const startsInMonth = interactions.filter(uq => {
      if (!uq.started_at) return false
      const d = new Date(uq.started_at)
      return d >= monthStart && d <= monthEnd
    }).length

    // Count Completions in this month
    const completionsInMonth = interactions.filter(uq => {
      if (!uq.completed_at) return false
      const d = new Date(uq.completed_at)
      return d >= monthStart && d <= monthEnd
    }).length

    // Metric: "Monthly Completion Rate" 
    // (Completions in Month / Starts in Month) * 100
    // Note: This can technically exceed 100% if people started previously but finished this month,
    // which is a valid throughput metric. We cap it at 100 visually in the UI if preferred, 
    // or we use (Completions / Active). Let's use (Completions / Starts) as a "Close Rate".
    let rate = 0
    if (startsInMonth > 0) {
      rate = Math.round((completionsInMonth / startsInMonth) * 100)
    } else if (completionsInMonth > 0) {
      // If 0 starts but has completions (backlog), treat as 100% efficiency for this view
      rate = 100 
    }

    return {
      quest: q.title,
      status: q.status || "Draft", // Default to Draft if null
      completion: rate,
      // We return these stats in case you want to show them in tooltips later
      starts: startsInMonth,
      completes: completionsInMonth,
      is_active: q.is_active
    }
  })

  return { engagement, quests }
}