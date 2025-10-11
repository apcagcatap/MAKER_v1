/**
 * Next.js Middleware for Authentication
 *
 * This middleware runs on every request to:
 * 1. Refresh the user's authentication session
 * 2. Update authentication cookies
 * 3. Protect routes that require authentication
 *
 * The middleware uses Supabase's session management to keep users logged in
 * and automatically refresh expired tokens.
 *
 * Configuration:
 * - Runs on all routes except static files and images
 * - See the matcher config below for excluded paths
 */

import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"

/**
 * Middleware function that runs on every request
 *
 * @param {NextRequest} request - The incoming request object
 * @returns {Promise<NextResponse>} The response with updated session cookies
 */
export async function middleware(request: NextRequest) {
  // Update the user's session and refresh authentication cookies
  // This ensures users stay logged in and tokens are refreshed automatically
  return await updateSession(request)
}

/**
 * Middleware Configuration
 *
 * The matcher defines which routes this middleware runs on.
 * It excludes:
 * - Next.js static files (_next/static)
 * - Next.js image optimization (_next/image)
 * - Favicon
 * - Image files (svg, png, jpg, jpeg, gif, webp)
 */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
