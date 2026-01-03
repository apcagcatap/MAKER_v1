import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function DELETE(request: Request) {
  // Verify the requesting user is an admin
  const supabase = await createServerClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if current user is admin
  const { data: userData } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", currentUser.id)
    .single()

  if (!userData?.is_admin) {
    return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
  }

  // Parse request body
  const { userId } = await request.json()

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 })
  }

  // Prevent admin from deleting themselves
  if (userId === currentUser.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
  }

  // Create admin client with service role key
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

  // Delete user from auth.users (this will cascade to public.users if you have proper triggers/policies)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Also explicitly delete from public.users in case there's no cascade
  await supabaseAdmin
    .from("users")
    .delete()
    .eq("id", userId)

  return NextResponse.json({ success: true })
}
