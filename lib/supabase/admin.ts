/**
 * Supabase Admin Client for Server-side Operations
 * 
 * This file creates a Supabase client using the service role key,
 * which bypasses RLS policies. This should only be used for:
 * - Storage operations (uploads, deletes)
 * - Backend operations that need to bypass user-level restrictions
 * 
 * IMPORTANT: The service role key is secret and should never be exposed to the client.
 * This should only be used in Server Actions and API Routes.
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

let adminClient: ReturnType<typeof createSupabaseClient> | null = null

export function getAdminClient() {
  if (adminClient) {
    return adminClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing Supabase configuration. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your environment variables."
    )
  }

  adminClient = createSupabaseClient(supabaseUrl, supabaseServiceRoleKey)
  return adminClient
}
