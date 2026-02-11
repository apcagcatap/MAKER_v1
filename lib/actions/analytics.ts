"use server"

import { createClient } from "@/lib/supabase/server"

export async function getAnalyticsData(cutoffDate?: Date) {
  const supabase = await createClient()
  
  // If no date is selected, default to "now" (end of today)
  const dateLimit = cutoffDate ? new Date(cutoffDate) : new Date()
  // Ensure we include the entire selected day
  dateLimit.setHours(23, 59, 59, 999)
  const dateLimitIso = dateLimit.toISOString()

  // 1. Fetch profiles created on or before the cutoff date
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('created_at')
    .lte('created_at', dateLimitIso)

  if (profileError) {
    console.error("Profile Fetch Error:", profileError)
    throw profileError
  }

  // 2. Fetch Quests and their User interactions
  // We filter user_quests manually in JS to handle the "snapshot" logic correctly
  // (e.g., a quest is "started" if started_at <= cutoff)
  const { data: questData, error: questError } = await supabase
    .from('quests')
    .select(`
      title,
      is_active,
      user_quests (
        started_at,
        completed_at,
        status
      )
    `)

  if (questError) throw questError

  // --- Process Engagement (Signups by Month) ---
  const engagementMap = (profileData || []).reduce((acc: any, curr) => {
    const date = new Date(curr.created_at)
    // Group by YYYY-MM
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const displayMonth = date.toLocaleString('default', { month: 'short' }).toUpperCase()
    
    if (!acc[monthKey]) {
      acc[monthKey] = { month: displayMonth, desktop: 0, dateValue: date.getTime() }
    }
    acc[monthKey].desktop += 1
    return acc
  }, {})

  // Sort chronologically
  const engagement = Object.values(engagementMap).sort((a: any, b: any) => a.dateValue - b.dateValue)

  // --- Process Quests (Historical Snapshot) ---
  const quests = (questData || []).map(q => {
    const interactions = (q.user_quests as any[]) || []

    // Filter: Only count interactions that started ON or BEFORE the cutoff
    const validInteractions = interactions.filter(uq => {
      return uq.started_at && new Date(uq.started_at) <= dateLimit
    })

    const total = validInteractions.length

    // Calculate completions relative to the cutoff date
    // (A quest is only "completed" if completed_at exists AND is <= cutoff)
    const completedCount = validInteractions.filter(uq => {
      return uq.completed_at && new Date(uq.completed_at) <= dateLimit
    }).length

    return {
      quest: q.title,
      completion: total > 0 ? Math.round((completedCount / total) * 100) : 0,
      is_active: q.is_active
    }
  })

  return { engagement, quests }
}