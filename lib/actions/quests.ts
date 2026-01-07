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

  // Use a development user ID if not authenticated (for development/testing)
  const userId = user?.id || "dev-user-" + Math.random().toString(36).substring(7)

  // Validate file
  if (!file || file.size === 0) {
    throw new Error("No file selected")
  }

  // Check file size (max 5MB)
  const maxFileSize = 5 * 1024 * 1024
  if (file.size > maxFileSize) {
    throw new Error("File size must be less than 5MB")
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image (PNG, JPG, GIF, etc.)")
  }

  // Generate a unique filename
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  const filename = `${type}/${userId}/${timestamp}-${random}.png`

  // Use admin client for storage operations (bypasses RLS)
  const adminClient = getAdminClient()

  // Upload to Supabase storage
  const { data, error } = await adminClient.storage
    .from("quest-images")
    .upload(filename, file, {
      cacheControl: "3600",
      upsert: false,
    })

  if (error) {
    // Check if it's a bucket not found error
    if (error.message.includes("Bucket not found") || error.message.includes("not found")) {
      throw new Error("Storage bucket 'quest-images' not found. Please ask your administrator to create it in the Supabase dashboard.")
    }
    throw new Error(`Failed to upload image: ${error.message}`)
  }

  // Get the public URL using admin client
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

    // Use admin client for consistent behavior
    const adminClient = getAdminClient()

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
    revalidatePath("/facilitator/quests")
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

    // Verify quest exists first
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

    // Use admin client to bypass RLS
    const adminClient = getAdminClient()

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
    revalidatePath("/facilitator/quests")
    return quest
  } catch (error) {
    console.error("🔥 Error in updateQuest:", error)
    throw error
  }
}

export async function deleteQuest(questId: string) {
  try {
    console.log("🗑️ Deleting quest:", questId)

    // Use regular client with user authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Use a development user ID if not authenticated (for development/testing)
    const userId = user?.id || "dev-user-admin"

    // Any facilitator can delete any quest - just delete by ID
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

    // First, verify the quest exists
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

    // Use admin client to bypass RLS
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

    // First, verify the quest exists
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

    // Use admin client to bypass RLS
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
    return data
  } catch (error) {
    console.error("🔥 Error in archiveQuest:", error)
    throw error
  }
}