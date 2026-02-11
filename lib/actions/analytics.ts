"use server"

import { createClient } from "@/lib/supabase/server"

export async function getAnalyticsData() {
  const supabase = await createClient()

  // 1. Fetch engagement data (Signups) - Removed 'xp' to prevent errors
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('created_at')

  if (profileError) {
    console.error("Profile Fetch Error:", profileError)
    throw profileError
  }

  // 2. Fetch Quests with status and completions
  const { data: questData, error: questError } = await supabase
    .from('quests')
    .select(`
      title,
      is_active,
      user_quests(status)
    `)

  if (questError) throw questError

  // Process Engagement (Signups by Month)
  const engagementMap = (profileData || []).reduce((acc: any, curr) => {
    // Use YYYY-MM format for correct chronological sorting across years
    const date = new Date(curr.created_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const displayMonth = date.toLocaleString('default', { month: 'short' }).toUpperCase()
    
    if (!acc[monthKey]) {
      acc[monthKey] = { month: displayMonth, desktop: 0, dateValue: date.getTime() }
    }
    acc[monthKey].desktop += 1
    return acc
  }, {})

  // Convert map to array and sort by the underlying date value
  const engagement = Object.values(engagementMap).sort((a: any, b: any) => a.dateValue - b.dateValue)

  // Process Quests with status metadata
  const quests = (questData || []).map(q => {
    const userQuests = (q.user_quests as any[]) || []
    const total = userQuests.length
    const completed = userQuests.filter((uq) => uq.status === 'completed').length
    return {
      quest: q.title,
      completion: total > 0 ? Math.round((completed / total) * 100) : 0,
      is_active: q.is_active
    }
  })

  return { engagement, quests }
}