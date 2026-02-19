"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getAdminClient } from "@/lib/supabase/admin"
import { calculateLevel } from "@/lib/utils"
import type { Skill } from "@/lib/types"

// HELPER: Get XP based on difficulty
const getXpForDifficulty = (difficulty: string) => {
  switch (difficulty?.toLowerCase()) {
    case 'beginner': return 100
    case 'intermediate': return 250
    case 'advanced': return 400
    default: return 100
  }
}

// Define standard return type for actions that might be blocked
type ActionResponse = {
  success: boolean
  message?: string
  data?: any
}

/**
 * Get all quests (for facilitator/admin view)
 */
export async function getAllQuests() {
  try {
    const supabase = await createClient()
    
    const { data: quests, error } = await supabase
      .from("quests")
      .select(`
        *,
        quest_participants:user_quests(status)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching all quests:", error)
      throw new Error(error.message)
    }

    return quests || []
  } catch (error) {
    console.error("Error in getAllQuests:", error)
    throw error
  }
}

/**
 * Fetch specific participants for a quest
 */
export async function getQuestParticipants(questId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("user_quests")
      .select(`
        status,
        progress,
        current_level,
        started_at,
        completed_at,
        profiles:user_id (
          id,
          display_name,
          email,
          avatar_url
        )
      `)
      .eq("quest_id", questId)
      .order("started_at", { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return data
  } catch (error) {
    console.error("Error fetching quest participants:", error)
    return []
  }
}

/**
 * Get only published quests (for participant view)
 */
export async function getPublishedQuests() {
  try {
    const supabase = await createClient()
    
    const now = new Date().toISOString()

    const { data: quests, error } = await supabase
      .from("quests")
      .select(`
        *,
        skill:skills(*)
      `)
      .eq("status", "Published")
      .eq("is_active", true)
      .or(`scheduled_date.is.null,scheduled_date.lte.${now}`)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching published quests:", error)
      throw new Error(error.message)
    }

    return quests || []
  } catch (error) {
    console.error("Error in getPublishedQuests:", error)
    throw error
  }
}

export async function getQuestWithDetails(questId: string) {
  try {
    const supabase = await createClient()
    
    const { data: quest, error } = await supabase
      .from("quests")
      .select(`
        *,
        skill:skills(*),
        stories(*),
        learning_resources(*)
      `)
      .eq("id", questId)
      .single()

    if (error) {
      console.error("Error fetching quest details:", error)
      throw new Error(error.message)
    }

    if (quest.stories) {
      quest.stories.sort((a: any, b: any) => a.order_index - b.order_index)
    }
    if (quest.learning_resources) {
      quest.learning_resources.sort((a: any, b: any) => a.order_index - b.order_index)
    }

    return quest
  } catch (error) {
    console.error("Error in getQuestWithDetails:", error)
    throw error
  }
}

export async function getUserQuestProgress(questId: string, userId: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("user_quests")
      .select("*")
      .eq("quest_id", questId)
      .eq("user_id", userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching user quest progress:", error)
      throw new Error(error.message)
    }

    return data
  } catch (error) {
    console.error("Error in getUserQuestProgress:", error)
    return null
  }
}

export async function startQuest(questId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("User not authenticated")

    const existingQuest = await getUserQuestProgress(questId, user.id)
    if (existingQuest) return existingQuest

    const { data, error } = await supabase
      .from("user_quests")
      .insert({
        user_id: user.id,
        quest_id: questId,
        status: "in_progress",
        started_at: new Date().toISOString(),
        story_completed: false,
        instructions_viewed: false,
        materials_viewed: false,
        current_level: 0
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    revalidatePath("/participant/quests")
    return data
  } catch (error) {
    console.error("Error in startQuest:", error)
    throw error
  }
}

export async function completeStory(questId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("User not authenticated")

    const { data, error } = await supabase
      .from("user_quests")
      .update({ story_completed: true })
      .eq("quest_id", questId)
      .eq("user_id", user.id)
      .select()

    if (error) throw new Error(error.message)

    revalidatePath(`/participant/quests/${questId}`)
    return data && data.length > 0 ? data[0] : null
  } catch (error) {
    console.error("Error in completeStory:", error)
    throw error
  }
}

/**
 * Marks a quest as completed and awards XP using admin permissions
 */
export async function finishQuest(questId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("User not authenticated")

    console.log(`\n[XP System] 🚀 Starting completion for quest ${questId} by user ${user.id}`)

    // 1. Initialize adminClient to bypass RLS for granting XP
    const adminClient = getAdminClient()

    // 2. Fetch Quest Details (We grab difficulty too, just in case xp_reward is missing!)
    const { data: quest, error: questError } = await supabase
      .from("quests")
      .select("xp_reward, difficulty")
      .eq("id", questId)
      .single()

    if (questError || !quest) throw new Error("Quest not found")

    // FALLBACK: If xp_reward is missing, calculate it using your difficulty helper
    // 🛠️ FIX 1: Force xpToAward to be a strict Math Number
    const xpToAward = Number(quest.xp_reward || getXpForDifficulty(quest.difficulty))
    console.log(`[XP System] 🎯 Quest is worth ${xpToAward} XP.`)

    // 3. Fetch User Quest Status
    const { data: userQuest, error: uqError } = await supabase
      .from("user_quests")
      .select("*")
      .eq("user_id", user.id)
      .eq("quest_id", questId)
      .single()

    if (uqError) throw new Error("User has not started this quest")

    // THE TRAP: If they already completed it, don't give them points twice!
    if (userQuest.status === "completed") {
      console.log("[XP System] ⚠️ Quest was ALREADY completed previously! XP will not be granted again.")
      return { message: "Quest already completed", earnedXp: 0 }
    }

    // 4. Update User Quest to 'completed' (Using adminClient so it doesn't get blocked)
    const { error: updateError } = await adminClient
      .from("user_quests")
      .update({ 
        status: "completed",
        completed_at: new Date().toISOString(),
        progress: 100 
      })
      .eq("id", userQuest.id)

    if (updateError) throw new Error("Failed to complete quest")

    // 5. Fetch their current XP
    const { data: profile } = await supabase
      .from("profiles")
      .select("xp")
      .eq("id", user.id)
      .single()
    
    // 🛠️ FIX 2: Force currentXp to be a strict Math Number
    const currentXp = Number(profile?.xp || 0)
    const newTotalXp = currentXp + xpToAward
    console.log(`[XP System] 📈 Upgrading XP: ${currentXp} + ${xpToAward} = ${newTotalXp}`)

    // 6. Save the new XP to the database (MUST use adminClient to bypass RLS)
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ 
        xp: newTotalXp,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id)

    if (profileError) {
      console.error("[XP System] ❌ Failed to save XP to database:", profileError)
      throw new Error("Failed to update user XP")
    }

    console.log(`[XP System] ✅ SUCCESS! Saved ${newTotalXp} Total XP to the database.`)

    // Force Next.js to immediately clear cache for the entire participant portal layout
    revalidatePath("/participant", "layout")
    
    // Calculate their level to send back to the frontend UI
    const { level: newLevel } = calculateLevel(newTotalXp)
    return { success: true, earnedXp: xpToAward, newLevel }
  } catch (error) {
    console.error("Error in finishQuest:", error)
    throw error
  }
}

export async function getSkills(): Promise<Skill[]> {
  const supabase = await createClient()
  const { data: skills, error } = await supabase
    .from("skills")
    .select("*")
    .order("name", { ascending: true })

  if (error) return []
  return skills || []
}

export async function createNewSkill(name: string, icon: string = "🎯", description?: string) {
  try {
    const supabase = await createClient()
    const adminClient = getAdminClient()

    const { data: existing } = await supabase
      .from("skills")
      .select("*")
      .ilike("name", name)
      .single()

    if (existing) return existing

    const { data, error } = await adminClient
      .from("skills")
      .insert({ 
        name,
        description: description || `Mastery in ${name}`, 
        icon: icon || "🎯" 
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    
    revalidatePath("/facilitator/skills")
    return data
  } catch (error) {
    console.error("Error creating skill:", error)
    throw error
  }
}

export async function updateSkill(skillId: string, name: string, description: string, icon: string) {
  try {
    const supabase = await createClient()
    const adminClient = getAdminClient()

    const { data, error } = await adminClient
      .from("skills")
      .update({ name, description, icon })
      .eq("id", skillId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    
    revalidatePath("/facilitator/skills")
    return data
  } catch (error) {
    console.error("Error updating skill:", error)
    throw error
  }
}

export async function deleteSkill(skillId: string) {
  try {
    const supabase = await createClient()
    const adminClient = getAdminClient()

    const { error } = await adminClient
      .from("skills")
      .delete()
      .eq("id", skillId)

    if (error) throw new Error(error.message)

    revalidatePath("/facilitator/skills")
  } catch (error) {
    console.error("Error deleting skill:", error)
    throw error
  }
}

export async function uploadImage(file: Blob, type: "badge" | "certificate") {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error("User not authenticated")
  const userId = user.id

  if (!file || file.size === 0) throw new Error("No file selected")
  
  const maxFileSize = 5 * 1024 * 1024
  if (file.size > maxFileSize) throw new Error("File size must be less than 5MB")
  if (!file.type.startsWith("image/")) throw new Error("File must be an image")

  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  const filename = `${type}/${userId}/${timestamp}-${random}.png`

  // Use user client (supabase) not adminClient
  const { data, error } = await supabase.storage
    .from("quest-images")
    .upload(filename, file, { cacheControl: "3600", upsert: false })

  if (error) throw new Error(`Failed to upload image: ${error.message}`)

  const { data: urlData } = supabase.storage
    .from("quest-images")
    .getPublicUrl(data.path)

  if (!urlData?.publicUrl) throw new Error("Failed to generate public URL")

  return urlData.publicUrl
}

export async function createQuest(formData: any) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || "dev-user-admin"
    const adminClient = getAdminClient()

    const { stories, learning_resources, ...questData } = formData

    // AUTO-CALCULATE XP
    const xpReward = questData.xp_reward || getXpForDifficulty(questData.difficulty)

    const { data: quest, error } = await adminClient
      .from("quests")
      .insert({
        ...questData,
        xp_reward: xpReward,
        skill_id: questData.skill_id || null,
        created_by: userId,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    if (stories?.length > 0) {
      await adminClient.from("stories").insert(
        stories.map((s: any) => ({ ...s, quest_id: quest.id }))
      )
    }

    if (learning_resources?.length > 0) {
      await adminClient.from("learning_resources").insert(
        learning_resources.map((r: any) => ({ ...r, quest_id: quest.id }))
      )
    }

    revalidatePath("/facilitator/quests")
    revalidatePath("/participant/quests")
    return quest
  } catch (error) {
    console.error("Error in createQuest:", error)
    throw error
  }
}

// UPDATED: Returns an object instead of throwing on blocking conditions
export async function updateQuest(questId: string, formData: any): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    const { count, error: countError } = await supabase
      .from("user_quests")
      .select("*", { count: 'exact', head: true })
      .eq("quest_id", questId)
      .eq("status", "in_progress")

    if (countError) throw new Error(countError.message)
    
    // 🟢 CHANGE: Return failure object instead of throwing
    if (count && count > 0) {
      return { 
        success: false, 
        message: "Cannot edit quest: There are participants currently working on this quest." 
      }
    }

    const adminClient = getAdminClient()
    const { stories, learning_resources, ...questData } = formData

    // AUTO-CALCULATE XP
    const xpReward = questData.xp_reward || getXpForDifficulty(questData.difficulty)

    const { data: quest, error } = await adminClient
      .from("quests")
      .update({
        ...questData,
        xp_reward: xpReward,
        skill_id: questData.skill_id || null,
      })
      .eq("id", questId)
      .select()
      .single()

    if (error) throw new Error(error.message)

    await adminClient.from("stories").delete().eq("quest_id", questId)
    if (stories?.length > 0) {
      await adminClient.from("stories").insert(
        stories.map((s: any) => ({ ...s, quest_id: questId }))
      )
    }

    await adminClient.from("learning_resources").delete().eq("quest_id", questId)
    if (learning_resources?.length > 0) {
      await adminClient.from("learning_resources").insert(
        learning_resources.map((r: any) => ({ ...r, quest_id: questId }))
      )
    }

    revalidatePath("/facilitator/quests")
    revalidatePath("/participant/quests")
    // 🟢 CHANGE: Return success object
    return { success: true, data: quest }
  } catch (error: any) {
    console.error("Error in updateQuest:", error)
    // Catch unexpected errors and return as failure message
    return { success: false, message: error.message || "Failed to update quest" }
  }
}

export async function deleteQuest(questId: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("quests")
      .delete()
      .eq("id", questId)

    if (error) throw new Error(error.message)

    revalidatePath("/facilitator/quests")
    revalidatePath("/participant/quests")
  } catch (error) {
    console.error("Error in deleteQuest:", error)
    throw error
  }
}

export async function publishQuest(questId: string) {
  try {
    const adminClient = getAdminClient()
    const { data, error } = await adminClient
      .from("quests")
      .update({ status: "Published" })
      .eq("id", questId)
      .select()
      .single()

    if (error) throw new Error(error.message)

    revalidatePath("/facilitator/quests")
    revalidatePath("/participant/quests")
    return data
  } catch (error) {
    console.error("Error in publishQuest:", error)
    throw error
  }
}

// UPDATED: Returns an object instead of throwing on blocking conditions
export async function archiveQuest(questId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const { count, error: countError } = await supabase
      .from("user_quests")
      .select("*", { count: 'exact', head: true })
      .eq("quest_id", questId)
      .eq("status", "in_progress")

    if (countError) throw new Error(countError.message)
    
    // 🟢 CHANGE: Return failure object instead of throwing
    if (count && count > 0) {
      return { 
        success: false, 
        message: "Cannot archive quest: There are participants currently working on this quest." 
      }
    }

    const adminClient = getAdminClient()
    const { data, error } = await adminClient
      .from("quests")
      .update({ status: "Archived" })
      .eq("id", questId)
      .select()
      .single()

    if (error) throw new Error(error.message)

    revalidatePath("/facilitator/quests")
    revalidatePath("/participant/quests")
    // 🟢 CHANGE: Return success object
    return { success: true, data }
  } catch (error: any) {
    console.error("Error in archiveQuest:", error)
    // Catch unexpected errors and return as failure message
    return { success: false, message: error.message || "Failed to archive quest" }
  }
}

export async function getLatestQuest() {
  try {
    const supabase = await createClient()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("quests")
      .select(`
        *,
        skill:skills(*)
      `)
      .eq("is_active", true)
      .eq("status", "Published")
      .or(`scheduled_date.is.null,scheduled_date.lte.${now}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching latest quest:", error)
      throw new Error(error.message)
    }

    return data
  } catch (error) {
    console.error("Error in getLatestQuest:", error)
    return null
  }
}