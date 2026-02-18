"use server"

import { createClient } from "@/lib/supabase/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

/** Generates a random 6-char alphanumeric code in JS — no DB trigger needed */
function makeCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Called by the PARTICIPANT — generates their own verification code.
 * 2 args: questId, levelIndex (participant ID from auth session).
 */
export async function generateCodeForSelf(
  questId: string,
  levelIndex: number
): Promise<{ success: true; id: string; code: string } | { success: false; error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    const adminClient = getAdminClient()

    // Return existing row to avoid duplicates
    const { data: existing } = await adminClient
      .from("level_verifications")
      .select("id, verification_code, status")
      .eq("participant_id", user.id)
      .eq("quest_id", questId)
      .eq("level_index", levelIndex)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing) {
      return { success: true, id: existing.id, code: existing.verification_code }
    }

    // Generate code in JS — works regardless of whether the DB trigger exists
    const code = makeCode()

    const { data, error } = await adminClient
      .from("level_verifications")
      .insert({
        participant_id: user.id,
        facilitator_id: user.id,   // placeholder (schema requires NOT NULL); overwritten on verify
        quest_id: questId,
        level_index: levelIndex,
        verification_code: code,   // explicitly provided — no trigger dependency
        status: "pending",
      })
      .select("id, verification_code")
      .single()

    if (error || !data) {
      console.error("generateCodeForSelf insert error:", JSON.stringify(error))
      return { success: false, error: `DB error: ${error?.message ?? "unknown"}` }
    }

    return { success: true, id: data.id, code: data.verification_code }
  } catch (e) {
    console.error("generateCodeForSelf exception:", e)
    return { success: false, error: "Unexpected error. Please try again." }
  }
}

/**
 * Called by the FACILITATOR from generate-verification.tsx.
 * 3 args: participantId, questId, levelIndex.
 */
export async function createVerificationForParticipant(
  participantId: string,
  questId: string,
  levelIndex: number
): Promise<{ success: true; id: string; code: string } | { success: false; error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    const adminClient = getAdminClient()

    // Return existing row to avoid duplicates
    const { data: existing } = await adminClient
      .from("level_verifications")
      .select("id, verification_code, status")
      .eq("participant_id", participantId)
      .eq("quest_id", questId)
      .eq("level_index", levelIndex)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing) {
      return { success: true, id: existing.id, code: existing.verification_code }
    }

    const code = makeCode()

    const { data, error } = await adminClient
      .from("level_verifications")
      .insert({
        participant_id: participantId,
        facilitator_id: user.id,
        quest_id: questId,
        level_index: levelIndex,
        verification_code: code,
        status: "pending",
      })
      .select("id, verification_code")
      .single()

    if (error || !data) {
      console.error("createVerificationForParticipant insert error:", JSON.stringify(error))
      return { success: false, error: `DB error: ${error?.message ?? "unknown"}` }
    }

    return { success: true, id: data.id, code: data.verification_code }
  } catch (e) {
    console.error("createVerificationForParticipant exception:", e)
    return { success: false, error: "Unexpected error. Please try again." }
  }
}

/**
 * Called by the FACILITATOR to mark a code as verified.
 */
export async function verifyLevelCode(
  code: string
): Promise<{ success: true; participantId: string; levelIndex: number } | { success: false; error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "")
    const adminClient = getAdminClient()

    const { data: record, error: fetchError } = await adminClient
      .from("level_verifications")
      .select("id, participant_id, level_index, status")
      .eq("verification_code", clean)
      .eq("status", "pending")
      .maybeSingle()

    if (fetchError) return { success: false, error: "Database error. Please try again." }
    if (!record) return { success: false, error: "Invalid code or already used." }

    const { error: updateError } = await adminClient
      .from("level_verifications")
      .update({ status: "verified", facilitator_id: user.id })
      .eq("id", record.id)

    if (updateError) return { success: false, error: "Failed to verify. Please try again." }

    revalidatePath("/facilitator/verify")
    return { success: true, participantId: record.participant_id, levelIndex: record.level_index }
  } catch (e) {
    console.error("verifyLevelCode exception:", e)
    return { success: false, error: "Unexpected error. Please try again." }
  }
}