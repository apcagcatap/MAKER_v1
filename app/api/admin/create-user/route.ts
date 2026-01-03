import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
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
  const { email, password, display_name, bio } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
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

  // Create user using admin API (doesn't affect current session)
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email for admin-created users
    user_metadata: {
      display_name,
    },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (data.user) {
    // Update user with additional details
    await supabaseAdmin
      .from("users")
      .update({
        display_name,
        bio: bio || null,
      })
      .eq("id", data.user.id)
  }

  return NextResponse.json({ success: true, user: data.user })
}
