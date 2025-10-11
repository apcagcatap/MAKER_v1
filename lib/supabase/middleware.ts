/**
 * Supabase session middleware (debug version)
 *
 * Handles:
 *  - Session refresh
 *  - Auth redirects
 *  - Logging for debugging
 */

import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  console.log("🔍 Middleware triggered for:", request.nextUrl.pathname)

  let supabaseResponse = NextResponse.next()

  try {
    // Create Supabase server client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              supabaseResponse.cookies.set(name, value, options)
            })
          },
        },
      },
    )

    console.log("✅ Supabase client created")

    // Fetch authenticated user
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error("❌ Supabase auth.getUser() failed:", userError.message)
    }

    const user = userData?.user
    console.log("👤 User:", user?.id ?? "No user")

    // Redirect unauthenticated users to login
    if (!user && !request.nextUrl.pathname.startsWith("/auth") && request.nextUrl.pathname !== "/") {
      console.log("🚫 No user — redirecting to /auth/login")
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    // Redirect authenticated users away from /auth pages
    if (user && request.nextUrl.pathname.startsWith("/auth")) {
      console.log("👤 User logged in, checking profile role...")

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (profileError) {
        console.error("❌ Supabase profile query failed:", profileError.message)
      } else {
        console.log("📄 Profile role:", profile?.role)
      }

      if (profile?.role) {
        const url = request.nextUrl.clone()
        url.pathname = `/${profile.role}`
        console.log("➡️ Redirecting to:", url.pathname)
        return NextResponse.redirect(url)
      }
    }

    console.log("✅ Middleware finished successfully for:", request.nextUrl.pathname)
    return supabaseResponse
  } catch (e) {
    console.error("🔥 Middleware crashed:", e)
    // Show visible message instead of generic 500
    return new NextResponse("Internal Server Error (check logs)", { status: 500 })
  }
}
