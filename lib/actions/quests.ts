"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getAdminClient } from "@/lib/supabase/admin"
import type { Skill } from "@/lib/types"

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
 * UPDATED: Now filters out quests scheduled for the future
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
  const userId = user?.id || "dev-user-" + Math.random().toString(36).substring(7)

  if (!file || file.size === 0) throw new Error("No file selected")
  
  const maxFileSize = 5 * 1024 * 1024
  if (file.size > maxFileSize) throw new Error("File size must be less than 5MB")
  if (!file.type.startsWith("image/")) throw new Error("File must be an image")

  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  const filename = `${type}/${userId}/${timestamp}-${random}.png`

  const adminClient = getAdminClient()
  const { data, error } = await adminClient.storage
    .from("quest-images")
    .upload(filename, file, { cacheControl: "3600", upsert: false })

  if (error) throw new Error(`Failed to upload image: ${error.message}`)

  const { data: urlData } = adminClient.storage
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

    const { data: quest, error } = await adminClient
      .from("quests")
      .insert({
        ...questData,
        xp_reward: questData.xp_reward || 0,
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

    // --- ONLY NOTIFY IF IT'S CREATED AS PUBLISHED ---
    if (quest.status === 'Published') {
      try {
        const { data: participants } = await adminClient
          .from('profiles')
          .select('id')
          .eq('role', 'participant')
        
        if (participants && participants.length > 0) {
          const notificationsToInsert = participants.map((participant: any) => ({
            user_id: participant.id,
            type: 'new_quest',
            title: 'New Quest Available! 🎯',
            message: `A new quest "${quest.title}" has just been published. Give it a try!`,
            link_url: `/participant/quests/${quest.id}`,
            is_read: false
          }))

          await adminClient.from('notifications').insert(notificationsToInsert)
        }
      } catch (notifError) {
        console.error("Failed to send notifications for new quest:", notifError)
      }
    }
    // ------------------------------------------------

    revalidatePath("/facilitator/quests")
    revalidatePath("/participant/quests")
    return quest
  } catch (error) {
    console.error("Error in createQuest:", error)
    throw error
  }
}

export async function updateQuest(questId: string, formData: any) {
  try {
    const supabase = await createClient()
    const adminClient = getAdminClient()
    
    // Safety check for active participants
    const { count, error: countError } = await supabase
      .from("user_quests")
      .select("*", { count: 'exact', head: true })
      .eq("quest_id", questId)
      .eq("status", "in_progress")

    if (countError) throw new Error(countError.message)
    if (count && count > 0) {
      throw new Error("Cannot edit quest: There are participants currently working on this quest.")
    }

    // 1. Fetch previous status to see if we're moving from Draft -> Published
    const { data: oldQuest } = await adminClient
      .from("quests")
      .select("status")
      .eq("id", questId)
      .single()

    const { stories, learning_resources, ...questData } = formData

    const { data: quest, error } = await adminClient
      .from("quests")
      .update({
        ...questData,
        xp_reward: questData.xp_reward || 0,
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

    // --- ONLY NOTIFY IF IT WAS JUST PUBLISHED DURING THIS EDIT ---
    if (oldQuest?.status !== "Published" && quest.status === "Published") {
      try {
        const { data: participants } = await adminClient
          .from('profiles')
          .select('id')
          .eq('role', 'participant')
        
        if (participants && participants.length > 0) {
          const notificationsToInsert = participants.map((participant: any) => ({
            user_id: participant.id,
            type: 'new_quest',
            title: 'New Quest Available! 🎯',
            message: `A new quest "${quest.title}" has just been published. Give it a try!`,
            link_url: `/participant/quests/${quest.id}`,
            is_read: false
          }))
          await adminClient.from('notifications').insert(notificationsToInsert)
        }
      } catch (notifError) {
        console.error("Failed to send notifications for updated quest:", notifError)
      }
    }
    // -----------------------------------------------------------

    revalidatePath("/facilitator/quests")
    revalidatePath("/participant/quests")
    return quest
  } catch (error) {
    console.error("Error in updateQuest:", error)
    throw error
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
    const { data: quest, error } = await adminClient
      .from("quests")
      .update({ status: "Published" })
      .eq("id", questId)
      .select()
      .single()

    if (error) throw new Error(error.message)

    // --- NOTIFY WHEN PUBLISHED VIA THE PUBLISH ACTION ---
    try {
      const { data: participants } = await adminClient
        .from('profiles')
        .select('id')
        .eq('role', 'participant')
      
      if (participants && participants.length > 0) {
        const notificationsToInsert = participants.map((participant: any) => ({
          user_id: participant.id,
          type: 'new_quest',
          title: 'New Quest Available! 🎯',
          message: `A new quest "${quest.title}" has just been published. Give it a try!`,
          link_url: `/participant/quests/${quest.id}`,
          is_read: false
        }))
        await adminClient.from('notifications').insert(notificationsToInsert)
      }
    } catch (notifError) {
      console.error("Failed to send notifications for published quest:", notifError)
    }
    // ----------------------------------------------------

    revalidatePath("/facilitator/quests")
    revalidatePath("/participant/quests")
    return quest
  } catch (error) {
    console.error("Error in publishQuest:", error)
    throw error
  }
}

export async function archiveQuest(questId: string) {
  try {
    const supabase = await createClient()

    const { count, error: countError } = await supabase
      .from("user_quests")
      .select("*", { count: 'exact', head: true })
      .eq("quest_id", questId)
      .eq("status", "in_progress")

    if (countError) throw new Error(countError.message)
    
    if (count && count > 0) {
      throw new Error("Cannot archive quest: There are participants currently working on this quest.")
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
    return data
  } catch (error) {
    console.error("Error in archiveQuest:", error)
    throw error
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