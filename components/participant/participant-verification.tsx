"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { generateVerificationCode, formatCode } from "@/lib/verification-utils"
import { createVerificationCode, getExistingVerification } from "@/lib/actions/verification"
import { CheckCircle2, ClipboardCopy, RefreshCw } from "lucide-react"

interface ParticipantVerificationProps {
  questId: string
  levelIndex: number
  /** Called as soon as the facilitator verifies — unlocks the Complete button */
  onVerified: () => void
}

type UIState = "idle" | "pending" | "verified" | "error"

export function ParticipantVerification({
  questId,
  levelIndex,
  onVerified,
}: ParticipantVerificationProps) {
  const supabase = createClient()

  const [uiState, setUiState] = useState<UIState>("idle")
  const [code, setCode] = useState<string | null>(null)
  const [recordId, setRecordId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // ── On mount: restore any existing code for this level ──────────────────
  useEffect(() => {
    const restore = async () => {
      const existing = await getExistingVerification(questId, levelIndex)
      if (existing) {
        setCode(existing.verification_code)
        setRecordId(existing.id)
        setUiState(existing.status === "verified" ? "verified" : "pending")
        if (existing.status === "verified") onVerified()
      }
    }
    restore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questId, levelIndex])

  // ── Realtime: subscribe once we have a record id ─────────────────────────
  useEffect(() => {
    if (!recordId || uiState === "verified") return

    const channel = supabase
      .channel(`verification-${recordId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "level_verifications",
          filter: `id=eq.${recordId}`,
        },
        (payload) => {
          if ((payload.new as { status: string }).status === "verified") {
            setUiState("verified")
            onVerified()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [recordId, uiState, supabase, onVerified])

  // ── Generate a fresh code ────────────────────────────────────────────────
  const handleGetCode = useCallback(async () => {
    setLoading(true)
    setError(null)

    const newCode = generateVerificationCode()
    const result = await createVerificationCode(questId, levelIndex, newCode)

    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }

    setCode(newCode)
    setRecordId(result.id)
    setUiState("pending")
    setLoading(false)
  }, [questId, levelIndex])

  // ── Copy to clipboard ────────────────────────────────────────────────────
  const handleCopy = () => {
    if (!code) return
    navigator.clipboard.writeText(formatCode(code)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // ── Verified ─────────────────────────────────────────────────────────────
  if (uiState === "verified") {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
        <div>
          <p className="font-semibold text-green-800 text-sm">Verified by Facilitator!</p>
          <p className="text-green-600 text-xs">You can now complete this level.</p>
        </div>
      </div>
    )
  }

  // ── Pending ──────────────────────────────────────────────────────────────
  if (uiState === "pending" && code) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm font-semibold text-blue-800 mb-3">
          Show this code to your facilitator:
        </p>

        {/* Code display */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 bg-white border-2 border-blue-300 rounded-lg py-3 px-4 text-center">
            <span className="text-3xl font-mono font-bold tracking-widest text-blue-900 select-all">
              {formatCode(code)}
            </span>
          </div>
          <button
            onClick={handleCopy}
            title="Copy code"
            className="p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-blue-600"
          >
            <ClipboardCopy className="w-5 h-5" />
          </button>
        </div>

        {copied && (
          <p className="text-xs text-blue-500 text-center mb-2">Copied to clipboard!</p>
        )}

        {/* Waiting indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-blue-500">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          Waiting for facilitator to verify…
        </div>
      </div>
    )
  }

  // ── Idle ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <p className="text-sm text-gray-600 mb-3">
        This level requires manual verification. Ask your facilitator to confirm
        you&apos;ve completed it, then click the button to get your code.
      </p>
      {error && (
        <p className="text-sm text-red-600 mb-3">{error}</p>
      )}
      <button
        onClick={handleGetCode}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
      >
        {loading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Generating…
          </>
        ) : (
          "Get Verification Code"
        )}
      </button>
    </div>
  )
}