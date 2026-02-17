"use server"

import { createClient } from "@/lib/supabase/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

/**
 * Looks up a pending verification record by code and marks it verified.
 * Called by the Facilitator. Returns an error string on failure.
 */
export async function verifyLevelCode(
  code: string
): Promise<{ success: true; participantId: string; levelIndex: number } | { success: false; error: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: "Not authenticated" }

    const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "")

    // 1. Find the pending record
    const { data: record, error: fetchError } = await supabase
      .from("level_verifications")
      .select("id, participant_id, level_index, status")
      .eq("verification_code", clean)
      .eq("status", "pending")
      .maybeSingle()

    if (fetchError) return { success: false, error: "Database error. Please try again." }
    if (!record) return { success: false, error: "Invalid code or code has already been used." }

    // 2. Mark as verified
    const adminClient = getAdminClient()
    const { error: updateError } = await adminClient
      .from("level_verifications")
      .update({
        status: "verified",
        facilitator_id: user.id,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", record.id)

    if (updateError) return { success: false, error: "Failed to verify. Please try again." }

    revalidatePath("/facilitator/verify")
    return { success: true, participantId: record.participant_id, levelIndex: record.level_index }
  } catch {
    return { success: false, error: "Unexpected error. Please try again." }
  }
}

/**
 * Creates a pending verification row for a participant on a specific level.
 * Called by the Participant. Returns the new row id.
 */
export async function createVerificationCode(
  questId: string,
  levelIndex: number,
  code: string
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: "Not authenticated" }

    const { data, error } = await supabase
      .from("level_verifications")
      .insert({
        participant_id: user.id,
        quest_id: questId,
        level_index: levelIndex,
        verification_code: code,
        status: "pending",
      })
      .select("id")
      .single()

    if (error || !data) return { success: false, error: "Failed to generate code. Please try again." }

    return { success: true, id: data.id }
  } catch {
    return { success: false, error: "Unexpected error. Please try again." }
  }
}

/**
 * Checks if a participant already has a pending or verified record for a level.
 * Used on mount so a page refresh restores the existing code.
 */
export async function getExistingVerification(questId: string, levelIndex: number) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data } = await supabase
      .from("level_verifications")
      .select("id, verification_code, status")
      .eq("participant_id", user.id)
      .eq("quest_id", questId)
      .eq("level_index", levelIndex)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    return data ?? null
  } catch {
    return null
  }
}