"use server"

import { getAdminClient } from "@/lib/supabase/admin"
import { startOfMonth, endOfMonth, startOfDay, endOfDay, eachDayOfInterval, format } from "date-fns"

export async function getAnalyticsData(targetDate?: Date) {
  const supabase = getAdminClient()
  
  const date = targetDate ? new Date(targetDate) : new Date()
  
  // Month range for the Engagement Chart (so the line chart has points to connect)
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  
  // Specific Day range for the Quest Data
  const dayStart = startOfDay(date)
  const dayEnd = endOfDay(date)

  // 1. Fetch Profiles (Signups within the month for the chart)
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('created_at')
    .gte('created_at', monthStart.toISOString())
    .lte('created_at', monthEnd.toISOString())

  if (profileError) throw profileError

  // 2. Fetch Quest Activity
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
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const engagementMap = daysInMonth.reduce((acc: any, day) => {
    const dayKey = format(day, "yyyy-MM-dd")
    acc[dayKey] = { 
      day: format(day, "d"), // "1", "2", "3"
      fullDate: dayKey,
      users: 0 
    }
    return acc
  }, {})

  profileData?.forEach(profile => {
    const profileDate = format(new Date(profile.created_at), "yyyy-MM-dd")
    if (engagementMap[profileDate]) {
      engagementMap[profileDate].users += 1
    }
  })

  const engagement = Object.values(engagementMap)

  // --- Process Quests: Daily Performance (For the EXACT day picked) ---
  const quests = (questData || []).map(q => {
    const interactions = (q.user_quests as any[]) || []

    // Count Starts on the specific day
    const startsInDay = interactions.filter(uq => {
      if (!uq.started_at) return false
      const d = new Date(uq.started_at)
      return d >= dayStart && d <= dayEnd
    }).length

    // Count Completions on the specific day
    const completionsInDay = interactions.filter(uq => {
      if (!uq.completed_at) return false
      const d = new Date(uq.completed_at)
      return d >= dayStart && d <= dayEnd
    }).length

    let rate = 0
    if (startsInDay > 0) {
      rate = Math.round((completionsInDay / startsInDay) * 100)
    } else if (completionsInDay > 0) {
      rate = 100 
    }

    return {
      quest: q.title,
      status: q.status || "Draft",
      completion: rate,
      starts: startsInDay,
      completes: completionsInDay,
      is_active: q.is_active
    }
  })

  return { engagement, quests }
}