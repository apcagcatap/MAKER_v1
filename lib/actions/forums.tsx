"use server"

import { createClient } from "@/lib/supabase/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function createForum(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const title = formData.get("title") as string
  const description = formData.get("description") as string

  const { data, error } = await supabase
    .from("forums")
    .insert({
      title,
      description,
      created_by: user.id,
    })
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

export async function deleteForum(forumId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Soft delete: archive instead of hard delete
  const { error } = await supabase.from("forums").update({ archived: true }).eq("id", forumId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/forums")
  revalidatePath("/facilitator/forums")
  revalidatePath("/participant/forums")

  return { success: true }
}

export async function createPost(forumId: string, content: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("forum_posts")
    .insert({
      forum_id: forumId,
      user_id: user.id,
      content,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // ==========================================
  // 🔔 NOTIFICATION LOGIC: NEW POST / THREAD
  // ==========================================
  try {
    const adminClient = getAdminClient()
    
    // Get the forum title for context
    const { data: forum } = await adminClient
      .from("forums")
      .select("title")
      .eq("id", forumId)
      .single()
    
    // Get all participants EXCEPT the person who just posted
    const { data: participants } = await adminClient
      .from('profiles')
      .select('id')
      .eq('role', 'participant')
      .neq('id', user.id)
    
    if (participants && participants.length > 0) {
      const notificationsToInsert = participants.map((participant: any) => ({
        user_id: participant.id,
        type: 'new_forum_post',
        title: 'New Forum Discussion 💬',
        message: `A new discussion was started in "${forum?.title || 'the forums'}".`,
        link_url: `/participant/forums/${forumId}`,
        is_read: false
      }))

      await adminClient.from('notifications').insert(notificationsToInsert)
    }
  } catch (notifError) {
    console.error("Failed to send notifications for new forum post:", notifError)
  }
  // ==========================================

  revalidatePath(`/admin/forums/${forumId}`)
  revalidatePath(`/facilitator/forums/${forumId}`)
  revalidatePath(`/participant/forums/${forumId}`)

  return { data }
}

export async function deletePost(postId: string, forumId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Use admin client to bypass RLS so facilitators can archive any post
  const adminClient = getAdminClient()

  // Soft delete: archive the post and its replies
  const { error } = await adminClient.from("forum_posts").update({ archived: true }).eq("id", postId)

  if (error) {
    return { error: error.message }
  }

  // Also archive all replies on this post
  await adminClient.from("forum_replies").update({ archived: true }).eq("post_id", postId)

  revalidatePath("/admin/forums")
  revalidatePath(`/admin/forums/${forumId}`)
  revalidatePath(`/facilitator/forums/${forumId}`)
  revalidatePath(`/participant/forums/${forumId}`)

  return { success: true }
}

export async function createReply(postId: string, content: string, forumId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("forum_replies")
    .insert({
      post_id: postId,
      user_id: user.id,
      content,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  try {
    const adminClient = getAdminClient()
    
    // Get the original post to find out who the author is
    const { data: post } = await adminClient
      .from("forum_posts")
      .select("user_id")
      .eq("id", postId)
      .single()
      
    // Only notify if the person replying is NOT the original author
    if (post && post.user_id !== user.id) {
      // Get the replier's name for a friendly message
      const { data: replier } = await adminClient
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single()
        
      const replierName = replier?.display_name || "Someone"
      
      await adminClient.from('notifications').insert({
        user_id: post.user_id, // Send ONLY to the post author
        type: 'new_forum_reply',
        title: 'New Reply to Your Post 📬',
        message: `${replierName} replied to your forum post.`,
        link_url: `/participant/forums/${forumId}`, 
        is_read: false
      })
    }
  } catch (notifError) {
    console.error("Failed to send notification for forum reply:", notifError)
  }

  revalidatePath(`/admin/forums/${forumId}`)
  revalidatePath(`/facilitator/forums/${forumId}`)
  revalidatePath(`/participant/forums/${forumId}`)

  return { data }
}

export async function deleteReply(replyId: string, forumId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Use admin client to bypass RLS so facilitators can archive any reply
  const adminClient = getAdminClient()
  const { error } = await adminClient.from("forum_replies").update({ archived: true }).eq("id", replyId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/forums")
  revalidatePath(`/admin/forums/${forumId}`)
  revalidatePath(`/facilitator/forums/${forumId}`)
  revalidatePath(`/participant/forums/${forumId}`)

  return { success: true }
}

export async function updateForum(forumId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const title = formData.get("title") as string
  const description = formData.get("description") as string

  const { data, error } = await supabase
    .from("forums")
    .update({ title, description })
    .eq("id", forumId) // We only filter by ID now, RLS handles the Role check
    .select()

  if (error) return { error: error.message }

  // If data is empty, it means the user logged in isn't a facilitator
  if (!data || data.length === 0) {
    return { error: "You do not have permission to edit forums." }
  }

  revalidatePath("/admin/forums")
  revalidatePath("/facilitator/forums")
  revalidatePath(`/participant/forums/${forumId}`)

  return { data: data[0] }
}

export async function updatePost(postId: string, content: string, forumId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { data, error } = await supabase
    .from("forum_posts")
    .update({ content })
    .eq("id", postId)
    .eq("user_id", user.id) // Ensure only owner can edit
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/admin/forums/${forumId}`)
  revalidatePath(`/facilitator/forums/${forumId}`)
  revalidatePath(`/participant/forums/${forumId}`)

  return { data }
}

export async function updateReply(replyId: string, content: string, forumId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { data, error } = await supabase
    .from("forum_replies")
    .update({ content })
    .eq("id", replyId)
    .eq("user_id", user.id) // Ensure only owner can edit
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/admin/forums/${forumId}`)
  revalidatePath(`/facilitator/forums/${forumId}`)
  revalidatePath(`/participant/forums/${forumId}`)

  return { data }
}