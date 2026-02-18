"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle2, AlertCircle, ShieldCheck, Search } from "lucide-react"

// ── Normalise input before DB queries ──────────────────────────────────────
function normalizeCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "")
}

interface FacilitatorVerificationProps {
  facilitatorId: string
  onSuccess?: (participantId: string, levelIndex: number) => void
}

type VerifyState = "idle" | "loading" | "success" | "error"

export function FacilitatorVerification({
  facilitatorId,
  onSuccess,
}: FacilitatorVerificationProps) {
  const supabase = createClient()

  const [inputCode, setInputCode] = useState("")
  const [state, setState] = useState<VerifyState>("idle")
  const [message, setMessage] = useState<string | null>(null)
  const [lastVerified, setLastVerified] = useState<{
    participantId: string
    levelIndex: number
  } | null>(null)

  // Auto-format: insert dash after 3 chars as user types
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "")
    const digits = raw.replace(/-/g, "")
    if (digits.length <= 3) {
      setInputCode(digits)
    } else {
      setInputCode(`${digits.slice(0, 3)}-${digits.slice(3, 6)}`)
    }
    if (state !== "idle") {
      setState("idle")
      setMessage(null)
    }
  }

  const handleVerify = useCallback(async () => {
    const clean = normalizeCode(inputCode)
    if (clean.length !== 6) {
      setState("error")
      setMessage("Please enter the full 6-character code.")
      return
    }

    setState("loading")
    setMessage(null)

    // ── Look up the pending verification row by code ─────────────────────
    // Your schema: facilitator inserts the row, so we look for a row with
    // this code that is still 'pending'
    const { data: record, error: fetchError } = await supabase
      .from("level_verifications")
      .select("id, participant_id, level_index, status")
      .eq("verification_code", clean)
      .eq("status", "pending")
      .maybeSingle()

    if (fetchError) {
      setState("error")
      setMessage("Database error. Please try again.")
      return
    }

    if (!record) {
      setState("error")
      setMessage("Invalid code or already used. Please check and try again.")
      return
    }

    // ── Update status to verified ────────────────────────────────────────
    const { error: updateError } = await supabase
      .from("level_verifications")
      .update({
        status: "verified",
        facilitator_id: facilitatorId,
      })
      .eq("id", record.id)

    if (updateError) {
      setState("error")
      setMessage("Failed to verify. Please try again.")
      return
    }

    setState("success")
    setLastVerified({
      participantId: record.participant_id,
      levelIndex: record.level_index,
    })
    setMessage(`Level ${record.level_index + 1} verified successfully!`)
    setInputCode("")
    onSuccess?.(record.participant_id, record.level_index)
  }, [inputCode, facilitatorId, supabase, onSuccess])

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-blue-50 rounded-lg">
          <ShieldCheck className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Verify Participant</h2>
          <p className="text-sm text-gray-500">
            Enter the code shown on the participant&apos;s screen
          </p>
        </div>
      </div>

      {/* Input row */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={inputCode}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          placeholder="A7X-99B"
          maxLength={7}
          disabled={state === "loading"}
          className={`flex-1 px-4 py-3 rounded-lg border font-mono text-2xl tracking-widest text-center uppercase
            focus:outline-none focus:ring-2 transition-colors
            ${
              state === "error"
                ? "border-red-400 focus:ring-red-300 bg-red-50"
                : state === "success"
                ? "border-green-400 focus:ring-green-300 bg-green-50"
                : "border-gray-300 focus:ring-blue-300"
            }`}
          aria-label="Verification code"
        />
        <button
          onClick={handleVerify}
          disabled={state === "loading" || normalizeCode(inputCode).length < 6}
          className="px-5 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700
            disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {state === "loading" ? (
            <span className="flex items-center gap-1">
              <Search className="w-4 h-4 animate-spin" />
            </span>
          ) : (
            "Verify"
          )}
        </button>
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`flex items-start gap-2 text-sm font-medium rounded-lg px-4 py-3 ${
            state === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {state === "success" ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          )}
          {message}
        </div>
      )}

      {state === "success" && lastVerified && (
        <p className="text-xs text-gray-400 mt-2">
          Participant: {lastVerified.participantId.slice(0, 8)}… · Level{" "}
          {lastVerified.levelIndex + 1}
        </p>
      )}
    </div>
  )
}