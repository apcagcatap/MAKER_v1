/**
 * Supabase session middleware
 *
 * Handles:
 *  - Session refresh
 *  - Auth redirects
 *  - Role-based access control (RBAC)
 */

import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/auth/login", "/auth/signup", "/auth/select-role"]

// Role-protected route prefixes and their allowed roles
const ROLE_ROUTES: Record<string, string[]> = {
  "/admin": ["admin"],
  "/facilitator": ["facilitator", "admin"], // admins can also access facilitator routes
  "/participant": ["participant", "facilitator", "admin"], // higher roles can access participant routes
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  console.log("🔍 Middleware triggered for:", pathname)

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

    // Fetch authenticated user
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error("❌ Supabase auth.getUser() failed:", userError.message)
    }

    const user = userData?.user
    console.log("👤 User:", user?.id ?? "No user")

    // Check if route is public
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))

    // Redirect unauthenticated users to login (except public routes)
    if (!user && !isPublicRoute) {
      console.log("🚫 No user — redirecting to /auth/login")
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    // Handle authenticated users
    if (user) {
      // First check if user is a global admin
      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", user.id)
        .single()

      const isGlobalAdmin = userProfile?.is_admin === true
      console.log("🔑 Is global admin:", isGlobalAdmin)

      // Fetch user's workshop assignments to determine workshop role
      const { data: workshopUsers, error: workshopError } = await supabase
        .from("workshop_user")
        .select("role")
        .eq("user_id", user.id)

      // Determine role: global admin takes priority, then workshop roles
      let userRole: string | null = null
      if (isGlobalAdmin) {
        userRole = 'admin'
      } else if (workshopUsers && workshopUsers.length > 0) {
        const hasFacilitator = workshopUsers.some(w => w.role === 'facilitator')
        if (hasFacilitator) {
          userRole = 'facilitator'
        } else {
          userRole = 'participant'
        }
      }
      console.log("📄 User role:", userRole)

      // Redirect authenticated users away from public auth pages
      if (isPublicRoute) {
        console.log("➡️ Authenticated user on auth page, redirecting")
        const url = request.nextUrl.clone()
        url.pathname = userRole ? `/${userRole}` : "/waiting-room"
        return NextResponse.redirect(url)
      }

      // Homepage redirect - send to user's dashboard or waiting room
      if (pathname === "/") {
        console.log("➡️ Redirecting from / to user dashboard or waiting room")
        const url = request.nextUrl.clone()
        url.pathname = userRole ? `/${userRole}` : "/waiting-room"
        return NextResponse.redirect(url)
      }

      // RBAC: Check role-protected routes
      for (const [routePrefix, allowedRoles] of Object.entries(ROLE_ROUTES)) {
        if (pathname.startsWith(routePrefix)) {
          console.log(`🔐 Checking RBAC: User role="${userRole}", Allowed roles="${allowedRoles.join(", ")}"`)
          
          if (!userRole || !allowedRoles.includes(userRole)) {
            console.log(`⛔ Access denied - user role "${userRole}" cannot access ${routePrefix}`)
            // Redirect to user's own dashboard or login
            const url = request.nextUrl.clone()
            if (userRole) {
              url.pathname = `/${userRole}`
            } else {
              url.pathname = "/auth/login"
            }
            return NextResponse.redirect(url)
          }
          
          console.log(`✅ RBAC passed for ${routePrefix}`)
          break
        }
      }
    }

    console.log("✅ Middleware finished successfully for:", pathname)
    return supabaseResponse
  } catch (e) {
    console.error("🔥 Middleware crashed:", e)
    return new NextResponse("Internal Server Error (check logs)", { status: 500 })
  }
}
