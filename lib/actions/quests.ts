"use server"

import { createClient } from "@/lib/supabase/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

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
}) {
  try {
    console.log("📝 Creating quest with data:", { title: formData.title, difficulty: formData.difficulty })

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Use a development user ID if not authenticated (for development/testing)
    const userId = user?.id || "dev-user-admin"
    console.log("👤 Using userId:", userId)

    const { data: quest, error } = await supabase
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
        created_by: userId,
        is_active: true,
      })
      .select()

    if (error) {
      console.error("❌ Database insert error:", error)
      throw new Error(error.message)
    }

    console.log("✅ Quest created successfully:", quest)
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
  }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Use a development user ID if not authenticated (for development/testing)
  const userId = user?.id || "dev-user-admin"

  const { data: quest, error } = await supabase
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
    })
    .eq("id", questId)
    .eq("created_by", userId)
    .select()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/facilitator/quests")
  return quest
}

export async function deleteQuest(questId: string) {
  try {
    console.log("🗑️ Deleting quest:", questId)

    // Use admin client to ensure delete works regardless of RLS
    const adminClient = getAdminClient()

    // Delete by ID only (most reliable)
    const { error, data } = await adminClient
      .from("quests")
      .delete()
      .eq("id", questId)
      .select()

    if (error) {
      console.error("❌ Delete error:", error)
      throw new Error(error.message)
    }

    console.log("✅ Quest deleted successfully:", data)
    revalidatePath("/facilitator/quests")
  } catch (error) {
    console.error("🔥 Error in deleteQuest:", error)
    throw error
  }
}

export async function publishQuest(questId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Use a development user ID if not authenticated (for development/testing)
  const userId = user?.id || "dev-user-admin"

  const { error } = await supabase
    .from("quests")
    .update({ status: "published" })
    .eq("id", questId)
    .eq("created_by", userId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/facilitator/quests")
}

export async function archiveQuest(questId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Use a development user ID if not authenticated (for development/testing)
  const userId = user?.id || "dev-user-admin"

  const { error } = await supabase
    .from("quests")
    .update({ status: "archived" })
    .eq("id", questId)
    .eq("created_by", userId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/facilitator/quests")
}
