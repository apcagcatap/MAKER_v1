"use server"

import { createClient } from "@/lib/supabase/server"
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

  const { error } = await supabase.from("forums").delete().eq("id", forumId)

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

  const { error } = await supabase.from("forum_posts").delete().eq("id", postId)

  if (error) {
    return { error: error.message }
  }

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

  const { error } = await supabase.from("forum_replies").delete().eq("id", replyId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/forums/${forumId}`)
  revalidatePath(`/facilitator/forums/${forumId}`)
  revalidatePath(`/participant/forums/${forumId}`)

  return { success: true }
}