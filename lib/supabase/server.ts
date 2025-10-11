/**
 * Supabase Client for Server Components and API Routes
 *
 * This file creates a Supabase client for use in server-side code including:
 * - Server Components (app directory)
 * - API Routes
 * - Server Actions
 *
 * It properly handles cookies for authentication and session management on the server.
 *
 * Usage: const supabase = await createClient()
 */

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Creates a Supabase client for server-side use
 *
 * This function must be called with await since it accesses cookies asynchronously.
 * The client handles authentication by reading and writing cookies.
 *
 * @returns {Promise<SupabaseClient>} A configured Supabase client instance
 * @throws {Error} If required environment variables are missing
 */
export async function createClient() {
  // Get the Next.js cookies store
  const cookieStore = await cookies()

  // Get Supabase credentials from environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Validate environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase environment variables on server:", {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey,
    })
    throw new Error(
      "Missing Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
    )
  }

  // Create server client with cookie handlers
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      // Read all cookies for authentication
      getAll() {
        return cookieStore.getAll()
      },
      // Write cookies when authentication state changes
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}
