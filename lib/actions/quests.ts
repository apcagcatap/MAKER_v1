"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getAdminClient } from "@/lib/supabase/admin"
import type { Skill } from "@/lib/types"

/**
 * Get all quests (for facilitator/admin view)
 * Shows all quests regardless of status
 */
export async function getAllQuests() {
  try {
    const supabase = await createClient()
    
    const { data: quests, error } = await supabase
      .from("quests")
      .select(`
        *,
        quest_participants(count)
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
 * Get only published quests (for participant view)
 * Filters out drafts and archived quests
 */
export async function getPublishedQuests() {
  try {
    const supabase = await createClient()
    
    const { data: quests, error } = await supabase
      .from("quests")
      .select(`
        *,
        skill:skills(*)
      `)
      .eq("status", "Published")
      .eq("is_active", true)
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

/**
 * Get a single quest with all related data (stories, resources)
 * Used when participant starts a quest
 */
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

    // Sort stories and resources by order_index
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

/**
 * Check if user has started a quest and get their progress
 */
export async function getUserQuestProgress(questId: string, userId: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("user_quests")
      .select("*")
      .eq("quest_id", questId)
      .eq("user_id", userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error("Error fetching user quest progress:", error)
      throw new Error(error.message)
    }

    return data
  } catch (error) {
    console.error("Error in getUserQuestProgress:", error)
    return null
  }
}

/**
 * Start a quest for a user
 */
export async function startQuest(questId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User not authenticated")
    }

    // Check if user already has this quest
    const existingQuest = await getUserQuestProgress(questId, user.id)

    if (existingQuest) {
      return existingQuest
    }

    // Create new user quest
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

    if (error) {
      console.error("Error starting quest:", error)
      throw new Error(error.message)
    }

    revalidatePath("/participant/quests")
    return data
  } catch (error) {
    console.error("Error in startQuest:", error)
    throw error
  }
}

/**
 * Mark story as completed for user
 */
export async function completeStory(questId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User not authenticated")
    }

    const { data, error } = await supabase
      .from("user_quests")
      .update({
        story_completed: true
      })
      .eq("quest_id", questId)
      .eq("user_id", user.id)
      .select()

    if (error) {
      console.error("Error completing story:", error)
      throw new Error(error.message)
    }

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

  if (error) {
    console.error("Error fetching skills:", error)
    return []
  }

  return skills || []
}

export async function uploadImage(file: Blob, type: "badge" | "certificate") {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user?.id || "dev-user-" + Math.random().toString(36).substring(7)

  if (!file || file.size === 0) {
    throw new Error("No file selected")
  }

  const maxFileSize = 5 * 1024 * 1024
  if (file.size > maxFileSize) {
    throw new Error("File size must be less than 5MB")
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image (PNG, JPG, GIF, etc.)")
  }

  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  const filename = `${type}/${userId}/${timestamp}-${random}.png`

  const adminClient = getAdminClient()

  const { data, error } = await adminClient.storage
    .from("quest-images")
    .upload(filename, file, {
      cacheControl: "3600",
      upsert: false,
    })

  if (error) {
    if (error.message.includes("Bucket not found") || error.message.includes("not found")) {
      throw new Error("Storage bucket 'quest-images' not found. Please ask your administrator to create it in the Supabase dashboard.")
    }
    throw new Error(`Failed to upload image: ${error.message}`)
  }

  const { data: urlData } = adminClient.storage
    .from("quest-images")
    .getPublicUrl(data.path)

  if (!urlData?.publicUrl) {
    throw new Error("Failed to generate public URL for image")
  }

  return urlData.publicUrl
}

export async function createQuest(formData: {
  title: string
  description: string
  difficulty: string
  scheduled_date: string | null
  badge_image_url: string | null
  certificate_image_url: string | null
  status: string
  materials_needed: string
  general_instructions: string
  levels: Array<{
    title: string
    description: string
  }>
  stories?: Array<{
    title: string
    content: string
    order_index: number
  }>
  learning_resources?: Array<{
    title: string
    description: string
    type: string
    external_url: string
    order_index: number
  }>
  xp_reward?: number | null
  skill_id?: string | null
}) {
  try {
    console.log("📝 Creating quest:", { 
      title: formData.title, 
      difficulty: formData.difficulty, 
      status: formData.status 
    })

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const userId = user?.id || "dev-user-admin"
    console.log("👤 Creating quest as user:", userId)

    const adminClient = getAdminClient()

    // Create the quest first
    const { data: quest, error } = await adminClient
      .from("quests")
      .insert({
        title: formData.title,
        description: formData.description,
        difficulty: formData.difficulty,
        scheduled_date: formData.scheduled_date,
        badge_image_url: formData.badge_image_url,
        certificate_image_url: formData.certificate_image_url,
        status: formData.status,
        materials_needed: formData.materials_needed,
        general_instructions: formData.general_instructions,
        levels: formData.levels,
        xp_reward: formData.xp_reward || 0,
        skill_id: formData.skill_id || null,
        created_by: userId,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("❌ Database insert error:", error)
      throw new Error(error.message)
    }

    console.log("✅ Quest created successfully:", quest.title)

    // Insert stories if provided
    if (formData.stories && formData.stories.length > 0) {
      const storiesData = formData.stories.map(story => ({
        quest_id: quest.id,
        title: story.title,
        content: story.content,
        order_index: story.order_index
      }))

      const { error: storiesError } = await adminClient
        .from("stories")
        .insert(storiesData)

      if (storiesError) {
        console.error("❌ Error inserting stories:", storiesError)
      } else {
        console.log("✅ Stories inserted successfully")
      }
    }

    // Insert learning resources if provided
    if (formData.learning_resources && formData.learning_resources.length > 0) {
      const resourcesData = formData.learning_resources.map(resource => ({
        quest_id: quest.id,
        title: resource.title,
        description: resource.description,
        type: resource.type,
        external_url: resource.external_url,
        order_index: resource.order_index
      }))

      const { error: resourcesError } = await adminClient
        .from("learning_resources")
        .insert(resourcesData)

      if (resourcesError) {
        console.error("❌ Error inserting learning resources:", resourcesError)
      } else {
        console.log("✅ Learning resources inserted successfully")
      }
    }

    revalidatePath("/facilitator/quests")
    revalidatePath("/participant/quests")
    return quest
  } catch (error) {
    console.error("🔥 Error in createQuest:", error)
    throw error
  }
}

export async function updateQuest(
  questId: string,
  formData: {
    title: string
    description: string
    difficulty: string
    scheduled_date: string | null
    badge_image_url: string | null
    certificate_image_url: string | null
    status: string
    materials_needed: string
    general_instructions: string
    levels: Array<{
      title: string
      description: string
    }>
    stories?: Array<{
      title: string
      content: string
      order_index: number
    }>
    learning_resources?: Array<{
      title: string
      description: string
      type: string
      external_url: string
      order_index: number
    }>
    xp_reward?: number | null
    skill_id?: string | null
  }
) {
  try {
    console.log("📝 Updating quest:", questId, "with status:", formData.status)
    
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const userId = user?.id || "dev-user-admin"
    console.log("👤 Updating as user:", userId)

    const { data: existingQuest, error: fetchError } = await supabase
      .from("quests")
      .select("id, created_by, title")
      .eq("id", questId)
      .single()

    if (fetchError || !existingQuest) {
      console.error("❌ Quest not found:", fetchError)
      throw new Error("Quest not found")
    }

    console.log("📋 Found quest to update:", existingQuest.title)

    const adminClient = getAdminClient()

    // Update the quest
    const { data: quest, error } = await adminClient
      .from("quests")
      .update({
        title: formData.title,
        description: formData.description,
        difficulty: formData.difficulty,
        scheduled_date: formData.scheduled_date,
        badge_image_url: formData.badge_image_url,
        certificate_image_url: formData.certificate_image_url,
        status: formData.status,
        materials_needed: formData.materials_needed,
        general_instructions: formData.general_instructions,
        levels: formData.levels,
        xp_reward: formData.xp_reward || 0,
        skill_id: formData.skill_id || null,
      })
      .eq("id", questId)
      .select()
      .single()

    if (error) {
      console.error("❌ Update error:", error)
      throw new Error(error.message)
    }

    console.log("✅ Quest updated successfully:", quest.title)

    // Delete existing stories and insert new ones
    await adminClient
      .from("stories")
      .delete()
      .eq("quest_id", questId)

    if (formData.stories && formData.stories.length > 0) {
      const storiesData = formData.stories.map(story => ({
        quest_id: questId,
        title: story.title,
        content: story.content,
        order_index: story.order_index
      }))

      const { error: storiesError } = await adminClient
        .from("stories")
        .insert(storiesData)

      if (storiesError) {
        console.error("❌ Error updating stories:", storiesError)
      } else {
        console.log("✅ Stories updated successfully")
      }
    }

    // Delete existing learning resources and insert new ones
    await adminClient
      .from("learning_resources")
      .delete()
      .eq("quest_id", questId)

    if (formData.learning_resources && formData.learning_resources.length > 0) {
      const resourcesData = formData.learning_resources.map(resource => ({
        quest_id: questId,
        title: resource.title,
        description: resource.description,
        type: resource.type,
        external_url: resource.external_url,
        order_index: resource.order_index
      }))

      const { error: resourcesError } = await adminClient
        .from("learning_resources")
        .insert(resourcesData)

      if (resourcesError) {
        console.error("❌ Error updating learning resources:", resourcesError)
      } else {
        console.log("✅ Learning resources updated successfully")
      }
    }

    revalidatePath("/facilitator/quests")
    revalidatePath("/participant/quests")
    return quest
  } catch (error) {
    console.error("🔥 Error in updateQuest:", error)
    throw error
  }
}

export async function deleteQuest(questId: string) {
  try {
    console.log("🗑️ Deleting quest:", questId)

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const userId = user?.id || "dev-user-admin"

    const { error, data } = await supabase
      .from("quests")
      .delete()
      .eq("id", questId)
      .select()

    if (error) {
      console.error("❌ Delete error:", error)
      throw new Error(error.message)
    }

    if (!data || data.length === 0) {
      throw new Error("Quest not found")
    }

    console.log("✅ Quest deleted successfully:", data)
    revalidatePath("/facilitator/quests")
    revalidatePath("/participant/quests")
  } catch (error) {
    console.error("🔥 Error in deleteQuest:", error)
    throw error
  }
}

export async function publishQuest(questId: string) {
  try {
    console.log("📢 Publishing quest:", questId)
    
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const userId = user?.id || "dev-user-admin"
    console.log("👤 Attempting publish as user:", userId)

    const { data: existingQuest, error: fetchError } = await supabase
      .from("quests")
      .select("id, created_by, title, status")
      .eq("id", questId)
      .single()

    if (fetchError || !existingQuest) {
      console.error("❌ Quest not found:", fetchError)
      throw new Error("Quest not found")
    }

    console.log("📋 Found quest:", {
      id: existingQuest.id,
      title: existingQuest.title,
      current_status: existingQuest.status,
      created_by: existingQuest.created_by,
      current_user: userId,
      match: existingQuest.created_by === userId
    })

    const adminClient = getAdminClient()

    const { data, error } = await adminClient
      .from("quests")
      .update({ status: "Published" })
      .eq("id", questId)
      .select()
      .single()

    if (error) {
      console.error("❌ Publish error:", error)
      throw new Error(error.message)
    }

    if (!data) {
      throw new Error("Failed to publish quest")
    }

    console.log("✅ Quest published successfully:", data.title)
    revalidatePath("/facilitator/quests")
    revalidatePath("/participant/quests")
    return data
  } catch (error) {
    console.error("🔥 Error in publishQuest:", error)
    throw error
  }
}

export async function archiveQuest(questId: string) {
  try {
    console.log("📦 Archiving quest:", questId)
    
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const userId = user?.id || "dev-user-admin"
    console.log("👤 Attempting archive as user:", userId)

    const { data: existingQuest, error: fetchError } = await supabase
      .from("quests")
      .select("id, created_by, title, status")
      .eq("id", questId)
      .single()

    if (fetchError || !existingQuest) {
      console.error("❌ Quest not found:", fetchError)
      throw new Error("Quest not found")
    }

    console.log("📋 Found quest:", {
      id: existingQuest.id,
      title: existingQuest.title,
      current_status: existingQuest.status,
      created_by: existingQuest.created_by,
      current_user: userId,
      match: existingQuest.created_by === userId
    })

    const adminClient = getAdminClient()

    const { data, error } = await adminClient
      .from("quests")
      .update({ status: "Archived" })
      .eq("id", questId)
      .select()
      .single()

    if (error) {
      console.error("❌ Archive error:", error)
      throw new Error(error.message)
    }

    if (!data) {
      throw new Error("Failed to archive quest")
    }

    console.log("✅ Quest archived successfully:", data.title)
    revalidatePath("/facilitator/quests")
    revalidatePath("/participant/quests")
    return data
  } catch (error) {
    console.error("🔥 Error in archiveQuest:", error)
    throw error
  }
}