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

export async function getAdminForumDetail(forumId: string) {
  try {
    const { data: forum, error } = await supabaseAdmin
      .from("forums")
      .select("*")
      .eq("id", forumId)
      .single()

    if (error) {
      console.error("Error fetching forum:", error)
      return null
    }

    return forum
  } catch (error) {
    console.error("Unexpected error fetching forum:", error)
    return null
  }
}

export async function getAdminForumPosts(forumId: string, showArchived?: string) {
  try {
    if (showArchived === "archived") {
      // For the archived filter, we need:
      // 1. All archived posts
      // 2. Active posts that have at least one archived reply
      const { data: archivedPosts, error: err1 } = await supabaseAdmin
        .from("forum_posts")
        .select(`
          *,
          profile:profiles(id, display_name, avatar_url, role)
        `)
        .eq("forum_id", forumId)
        .eq("archived", true)
        .order("created_at", { ascending: false })

      if (err1) {
        console.error("Error fetching archived posts:", err1)
        return []
      }

      // Find active posts that have archived replies
      const { data: archivedReplies } = await supabaseAdmin
        .from("forum_replies")
        .select("post_id")
        .eq("archived", true)

      const postIdsWithArchivedReplies = [
        ...new Set((archivedReplies || []).map((r) => r.post_id)),
      ]

      let activePostsWithArchivedReplies: any[] = []
      if (postIdsWithArchivedReplies.length > 0) {
        const { data: activePosts } = await supabaseAdmin
          .from("forum_posts")
          .select(`
            *,
            profile:profiles(id, display_name, avatar_url, role)
          `)
          .eq("forum_id", forumId)
          .eq("archived", false)
          .in("id", postIdsWithArchivedReplies)
          .order("created_at", { ascending: false })

        activePostsWithArchivedReplies = activePosts || []
      }

      // Combine and sort by created_at descending
      const combined = [...(archivedPosts || []), ...activePostsWithArchivedReplies]
      combined.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      return combined
    }

    let query = supabaseAdmin
      .from("forum_posts")
      .select(`
        *,
        profile:profiles(id, display_name, avatar_url, role)
      `)
      .eq("forum_id", forumId)

    if (showArchived === "all") {
      // show everything
    } else {
      query = query.eq("archived", false)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching posts:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Unexpected error fetching posts:", error)
    return []
  }
}

export async function getAdminPostReplies(postId: string, showArchived?: string) {
  try {
    let query = supabaseAdmin
      .from("forum_replies")
      .select(`
        *,
        profile:profiles(id, display_name, avatar_url, role)
      `)
      .eq("post_id", postId)

    if (showArchived === "archived") {
      query = query.eq("archived", true)
    } else if (showArchived === "all") {
      // show everything
    } else {
      query = query.eq("archived", false)
    }

    const { data, error } = await query.order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching replies:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Unexpected error fetching replies:", error)
    return []
  }
}

export async function archiveAdminPost(postId: string, forumId: string) {
  const { error } = await supabaseAdmin
    .from("forum_posts")
    .update({ archived: true })
    .eq("id", postId)

  if (error) return { error: error.message }

  // Also archive all replies on this post
  await supabaseAdmin
    .from("forum_replies")
    .update({ archived: true })
    .eq("post_id", postId)

  revalidatePath(`/admin/forums/${forumId}`)
  revalidatePath(`/facilitator/forums/${forumId}`)
  revalidatePath(`/participant/forums/${forumId}`)

  return { success: true }
}

export async function restoreAdminPost(postId: string, forumId: string) {
  const { error } = await supabaseAdmin
    .from("forum_posts")
    .update({ archived: false })
    .eq("id", postId)

  if (error) return { error: error.message }

  // Also restore all replies on this post
  await supabaseAdmin
    .from("forum_replies")
    .update({ archived: false })
    .eq("post_id", postId)

  revalidatePath(`/admin/forums/${forumId}`)
  revalidatePath(`/facilitator/forums/${forumId}`)
  revalidatePath(`/participant/forums/${forumId}`)

  return { success: true }
}

export async function archiveAdminReply(replyId: string, forumId: string) {
  const { error } = await supabaseAdmin
    .from("forum_replies")
    .update({ archived: true })
    .eq("id", replyId)

  if (error) return { error: error.message }

  revalidatePath(`/admin/forums/${forumId}`)
  revalidatePath(`/facilitator/forums/${forumId}`)
  revalidatePath(`/participant/forums/${forumId}`)

  return { success: true }
}

export async function restoreAdminReply(replyId: string, forumId: string) {
  const { error } = await supabaseAdmin
    .from("forum_replies")
    .update({ archived: false })
    .eq("id", replyId)

  if (error) return { error: error.message }

  revalidatePath(`/admin/forums/${forumId}`)
  revalidatePath(`/facilitator/forums/${forumId}`)
  revalidatePath(`/participant/forums/${forumId}`)

  return { success: true }
}
