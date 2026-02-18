
// lib/actions/admin-users.ts
"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

// Initialize admin client for user management
// Ensure SUPABASE_SERVICE_ROLE_KEY is in your .env.local
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

export async function createUser(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const displayName = formData.get("displayName") as string
  const role = formData.get("role") as string
  const bio = formData.get("bio") as string

  // 1. Create Auth User
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  })

  if (authError) {
    console.error("Error creating user:", authError)
    return { error: authError.message }
  }

  if (authData.user) {
    // 2. Update Profile
    // The database trigger handles the initial insert into public.profiles
    // We update it to set the role and bio which aren't handled by the trigger
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        display_name: displayName,
        role: role,
        bio: bio,
        updated_at: new Date().toISOString(),
      })
      .eq("id", authData.user.id)

    if (profileError) {
      console.error("Error updating profile:", profileError)
      // If profile creation fails, we might want to clean up the auth user
      // await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return { error: "User created but profile update failed: " + profileError.message }
    }
  }

  revalidatePath("/admin/users")
  return { success: true }
}

export async function archiveUser(userId: string) {
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ archived: true })
    .eq("id", userId)
  
  if (error) return { error: error.message }
  
  revalidatePath("/admin/users")
  return { success: true }
}

export async function restoreUser(userId: string) {
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ archived: false })
    .eq("id", userId)
  
  if (error) return { error: error.message }
  
  revalidatePath("/admin/users")
  return { success: true }
}

export async function updateUserRole(userId: string, newRole: string) {
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId)

  if (error) return { error: error.message }
  
  revalidatePath("/admin/users")
  return { success: true }
}
