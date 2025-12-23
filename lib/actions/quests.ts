"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

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
      created_by: user.id,
      is_active: true,
    })
    .select()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/facilitator/quests")
  return quest
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

  if (!user) {
    throw new Error("Unauthorized")
  }

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
    .eq("created_by", user.id)
    .select()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/facilitator/quests")
  return quest
}

export async function deleteQuest(questId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { error } = await supabase
    .from("quests")
    .delete()
    .eq("id", questId)
    .eq("created_by", user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/facilitator/quests")
}

export async function publishQuest(questId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { error } = await supabase
    .from("quests")
    .update({ status: "published" })
    .eq("id", questId)
    .eq("created_by", user.id)

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

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { error } = await supabase
    .from("quests")
    .update({ status: "archived" })
    .eq("id", questId)
    .eq("created_by", user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/facilitator/quests")
}
