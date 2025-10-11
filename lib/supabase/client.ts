/**
 * Supabase Client for Browser/Client Components
 *
 * This file creates a Supabase client for use in client-side React components.
 * It uses the browser client from @supabase/ssr which handles authentication
 * and session management in the browser.
 *
 * Usage: Import and call createClient() in any client component
 * Example: const supabase = createClient()
 */

import { createBrowserClient } from "@supabase/ssr"

/**
 * Creates a Supabase client for browser/client-side use
 *
 * @returns {SupabaseClient} A configured Supabase client instance
 * @throws {Error} If required environment variables are missing
 */
export function createClient() {
  // Get Supabase URL and anonymous key from environment variables
  // These must be prefixed with NEXT_PUBLIC_ to be available in the browser
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Validate that required environment variables are present
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase environment variables:", {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey,
    })
    throw new Error(
      "Missing Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
    )
  }

  // Create and return the browser client
  // This client automatically handles cookies and session management
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
