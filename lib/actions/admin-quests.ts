"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

// Initialize admin client for quest management
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function uploadStorageImage(file: File, path: string) {
  if (!file || file.size === 0) return null

  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
  const filePath = `${path}/${fileName}`

  const { error } = await supabaseAdmin.storage
    .from("quest-images")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    console.error("Error uploading image:", error)
    throw new Error(`Failed to upload ${path} image: ${error.message}`)
  }

  const { data } = supabaseAdmin.storage
    .from("quest-images")
    .getPublicUrl(filePath)

  return data.publicUrl
}

export async function getQuests(search?: string, status?: string, sort?: string, showArchived?: string) {
  try {
    let query = supabaseAdmin.from("quests").select("*")

    // Filter by archive status
    if (showArchived === "archived") {
      query = query.eq("archived", true)
    } else if (showArchived === "all") {
      // Show everything
    } else {
      // Default: only show non-archived
      query = query.eq("archived", false)
    }

    if (search) {
      query = query.ilike("title", `%${search}%`)
    }

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (sort === "oldest") {
      query = query.order("created_at", { ascending: true })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching quests:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Unexpected error fetching quests:", error)
    return []
  }
}

export async function createQuest(formData: FormData) {
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const xp_reward = formData.get("xp_reward") as string
  const difficulty = formData.get("difficulty") as string
  const status = formData.get("status") as string
  const materials_needed = formData.get("materials_needed") as string
  const general_instructions = formData.get("general_instructions") as string
  
  const scheduledDateRaw = formData.get("scheduled_date") as string
  const scheduled_date = scheduledDateRaw || null

  const skillIdRaw = formData.get("skill_id") as string
  const skill_id = skillIdRaw || null

  const levelsRaw = formData.get("levels") as string
  let levels = null
  if (levelsRaw) {
    try {
      levels = JSON.parse(levelsRaw)
    } catch (e) {
      return { error: "Invalid JSON format for Levels" }
    }
  }
  
  // Default to active upon creation
  const isActive = formData.get("is_active") === "on"

  try {
    // Handle Image Uploads
    const badgeFile = formData.get("badge_image") as File
    const certificateFile = formData.get("certificate_image") as File
    
    let badge_image_url = null
    let certificate_image_url = null

    const uploadedBadgeUrl = await uploadStorageImage(badgeFile, "badges")
    if (uploadedBadgeUrl) badge_image_url = uploadedBadgeUrl

    const uploadedCertUrl = await uploadStorageImage(certificateFile, "certificates")
    if (uploadedCertUrl) certificate_image_url = uploadedCertUrl

    const { error } = await supabaseAdmin
      .from("quests")
      .insert({
        title,
        description,
        xp_reward,
        difficulty,
        status,
        materials_needed,
        general_instructions,
        scheduled_date,
        badge_image_url,
        certificate_image_url,
        skill_id,
        levels,
        is_active: isActive,
      })

    if (error) {
      console.error("Error creating quest:", error)
      return { error: error.message }
    }
  } catch (error) {
    console.error("Unexpected error creating quest:", error)
    return { error: "Failed to create quest due to a network or server error." }
  }

  revalidatePath("/admin/quests")
  return { success: true }
}

export async function updateQuest(formData: FormData) {
  const id = formData.get("id") as string
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const xp_reward = formData.get("xp_reward") as string
  const difficulty = formData.get("difficulty") as string
  const status = formData.get("status") as string
  const materials_needed = formData.get("materials_needed") as string
  const general_instructions = formData.get("general_instructions") as string
  
  const scheduledDateRaw = formData.get("scheduled_date") as string
  const scheduled_date = scheduledDateRaw || null

  const skillIdRaw = formData.get("skill_id") as string
  const skill_id = skillIdRaw || null

  const levelsRaw = formData.get("levels") as string
  let levels = null
  if (levelsRaw) {
    try {
      levels = JSON.parse(levelsRaw)
    } catch (e) {
      return { error: "Invalid JSON format for Levels" }
    }
  }

  // Checkbox returns "on" if checked, null otherwise
  const isActive = formData.get("is_active") === "on"

  try {
    // Handle Image Uploads
    const badgeFile = formData.get("badge_image") as File
    const certificateFile = formData.get("certificate_image") as File
    
    // Default to existing URLs if no new file is uploaded
    let badge_image_url = formData.get("existing_badge_image_url") as string
    let certificate_image_url = formData.get("existing_certificate_image_url") as string

    const uploadedBadgeUrl = await uploadStorageImage(badgeFile, "badges")
    if (uploadedBadgeUrl) badge_image_url = uploadedBadgeUrl

    const uploadedCertUrl = await uploadStorageImage(certificateFile, "certificates")
    if (uploadedCertUrl) certificate_image_url = uploadedCertUrl

    const { error } = await supabaseAdmin
      .from("quests")
      .update({
        title,
        description,
        xp_reward,
        difficulty,
        status,
        materials_needed,
        general_instructions,
        scheduled_date,
        badge_image_url,
        certificate_image_url,
        skill_id,
        levels,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      console.error("Error updating quest:", error)
      return { error: error.message }
    }
  } catch (error) {
    console.error("Unexpected error updating quest:", error)
    return { error: "Failed to update quest due to a network or server error." }
  }

  revalidatePath("/admin/quests")
  return { success: true }
}

export async function archiveQuest(questId: string) {
  try {
    const { error } = await supabaseAdmin
      .from("quests")
      .update({ archived: true })
      .eq("id", questId)

    if (error) return { error: error.message }
  } catch (error) {
    console.error("Unexpected error archiving quest:", error)
    return { error: "Failed to archive quest due to a network or server error." }
  }

  revalidatePath("/admin/quests")
  return { success: true }
}

export async function restoreQuest(questId: string) {
  try {
    const { error } = await supabaseAdmin
      .from("quests")
      .update({ archived: false })
      .eq("id", questId)

    if (error) return { error: error.message }
  } catch (error) {
    console.error("Unexpected error restoring quest:", error)
    return { error: "Failed to restore quest due to a network or server error." }
  }

  revalidatePath("/admin/quests")
  return { success: true }
}