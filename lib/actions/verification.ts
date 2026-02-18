"use server"

import { createClient } from "@/lib/supabase/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

/**
 * Called by the FACILITATOR to create a verification row for a participant.
 * Your schema requires facilitator_id NOT NULL, so the facilitator must
 * be the one who inserts the row. The DB trigger auto-generates the code.
 */
export async function createVerificationForParticipant(
  participantId: string,
  questId: string,
  levelIndex: number
): Promise<
  | { success: true; id: string; code: string }
  | { success: false; error: string }
> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: "Not authenticated" }

    const adminClient = getAdminClient()

    // Insert with facilitator_id = current user.
    // The DB trigger (trigger_set_verification_code) auto-fills verification_code.
    // Status defaults to 'pending' via the ENUM default... but your first SQL
    // has DEFAULT 'verified' — we override it to 'pending' here.
    const { data, error } = await adminClient
      .from("level_verifications")
      .insert({
        facilitator_id: user.id,
        participant_id: participantId,
        quest_id: questId,
        level_index: levelIndex,
        status: "pending", // Override the schema default of 'verified'
      })
      .select("id, verification_code")
      .single()

    if (error || !data) {
      return { success: false, error: "Failed to create verification. Please try again." }
    }

    return { success: true, id: data.id, code: data.verification_code }
  } catch {
    return { success: false, error: "Unexpected error. Please try again." }
  }
}

/**
 * Called by the FACILITATOR to verify a code entered manually.
 * Looks up a 'pending' row by code and updates status to 'verified'.
 */
export async function verifyLevelCode(
  code: string
): Promise<
  | { success: true; participantId: string; levelIndex: number }
  | { success: false; error: string }
> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: "Not authenticated" }

    const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "")

    // Find the pending record
    const { data: record, error: fetchError } = await supabase
      .from("level_verifications")
      .select("id, participant_id, level_index, status")
      .eq("verification_code", clean)
      .eq("status", "pending")
      .maybeSingle()

    if (fetchError) return { success: false, error: "Database error. Please try again." }
    if (!record) return { success: false, error: "Invalid code or already used." }

    // Update to verified
    const adminClient = getAdminClient()
    const { error: updateError } = await adminClient
      .from("level_verifications")
      .update({ status: "verified" })
      .eq("id", record.id)

    if (updateError) return { success: false, error: "Failed to verify. Please try again." }

    revalidatePath("/facilitator/verify")
    return {
      success: true,
      participantId: record.participant_id,
      levelIndex: record.level_index,
    }
  } catch {
    return { success: false, error: "Unexpected error. Please try again." }
  }
}

/**
 * Called by the PARTICIPANT on mount to check if a verification row
 * already exists for this level (so a page refresh restores the code).
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