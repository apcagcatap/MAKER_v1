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
      // Fetch user profile for role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (profileError) {
        console.error("❌ Supabase profile query failed:", profileError.message)
        // If no profile, redirect to login
        const url = request.nextUrl.clone()
        url.pathname = "/auth/login"
        return NextResponse.redirect(url)
      }

      const userRole = profile?.role
      console.log("📄 User role:", userRole)

      // Redirect authenticated users away from public auth pages
      if (isPublicRoute && userRole) {
        console.log("➡️ Authenticated user on auth page, redirecting to dashboard")
        const url = request.nextUrl.clone()
        url.pathname = `/${userRole}`
        return NextResponse.redirect(url)
      }

      // Homepage redirect - send to user's dashboard
      if (pathname === "/") {
        if (userRole) {
          console.log("➡️ Redirecting from / to user dashboard")
          const url = request.nextUrl.clone()
          url.pathname = `/${userRole}`
          return NextResponse.redirect(url)
        }
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
