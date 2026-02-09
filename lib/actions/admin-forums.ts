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

export async function getForums(search?: string, sort?: string) {
  try {
    let query = supabaseAdmin.from("forums").select("*")

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

export async function deleteAdminForum(forumId: string) {
  const { error } = await supabaseAdmin
    .from("forums")
    .delete()
    .eq("id", forumId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/forums")
  revalidatePath("/facilitator/forums")
  revalidatePath("/participant/forums")

  return { success: true }
}
