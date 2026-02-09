"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

// Initialize admin client for forum management (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function getForums(search?: string, sort?: string, showArchived?: string) {
  try {
    let query = supabaseAdmin.from("forums").select("*")

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
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (sort === "oldest") {
      query = query.order("created_at", { ascending: true })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching forums:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Unexpected error fetching forums:", error)
    return []
  }
}

export async function createAdminForum(formData: FormData) {
  const title = formData.get("title") as string
  const description = formData.get("description") as string

  if (!title || title.trim().length === 0) {
    return { error: "Title is required" }
  }

  const { data, error } = await supabaseAdmin
    .from("forums")
    .insert({ title, description })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/forums")
  revalidatePath("/facilitator/forums")
  revalidatePath("/participant/forums")

  return { data }
}

export async function updateAdminForum(forumId: string, formData: FormData) {
  const title = formData.get("title") as string
  const description = formData.get("description") as string

  if (!title || title.trim().length === 0) {
    return { error: "Title is required" }
  }

  const { data, error } = await supabaseAdmin
    .from("forums")
    .update({ title, description })
    .eq("id", forumId)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/forums")
  revalidatePath("/facilitator/forums")
  revalidatePath(`/participant/forums/${forumId}`)

  return { data }
}

export async function archiveAdminForum(forumId: string) {
  const { error } = await supabaseAdmin
    .from("forums")
    .update({ archived: true })
    .eq("id", forumId)

  if (error) {
    return { error: error.message }
  }

  // Also archive all posts and replies in this forum
  const { data: posts } = await supabaseAdmin
    .from("forum_posts")
    .select("id")
    .eq("forum_id", forumId)

  if (posts && posts.length > 0) {
    await supabaseAdmin
      .from("forum_posts")
      .update({ archived: true })
      .eq("forum_id", forumId)

    const postIds = posts.map((p) => p.id)
    await supabaseAdmin
      .from("forum_replies")
      .update({ archived: true })
      .in("post_id", postIds)
  }

  revalidatePath("/admin/forums")
  revalidatePath("/facilitator/forums")
  revalidatePath("/participant/forums")

  return { success: true }
}

export async function restoreAdminForum(forumId: string) {
  const { error } = await supabaseAdmin
    .from("forums")
    .update({ archived: false })
    .eq("id", forumId)

  if (error) {
    return { error: error.message }
  }

  // Also restore all posts and replies in this forum
  const { data: posts } = await supabaseAdmin
    .from("forum_posts")
    .select("id")
    .eq("forum_id", forumId)

  if (posts && posts.length > 0) {
    await supabaseAdmin
      .from("forum_posts")
      .update({ archived: false })
      .eq("forum_id", forumId)

    const postIds = posts.map((p) => p.id)
    await supabaseAdmin
      .from("forum_replies")
      .update({ archived: false })
      .in("post_id", postIds)
  }

  revalidatePath("/admin/forums")
  revalidatePath("/facilitator/forums")
  revalidatePath("/participant/forums")

  return { success: true }
}
