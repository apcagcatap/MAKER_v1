"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle2, Clock } from "lucide-react"
import { createVerificationForParticipant } from "@/lib/actions/verification"

// ── Format raw code for display: "A7X99B" → "A7X-99B" ─────────────────────
function formatCode(code: string): string {
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "")
  if (clean.length !== 6) return code
  return `${clean.slice(0, 3)}-${clean.slice(3)}`
}

interface ParticipantVerificationProps {
  questId: string
  levelIndex: number
  participantId: string
  /** Called the moment facilitator marks status = 'verified' */
  onVerified: () => void
}

type UIState = "waiting" | "verified"

export function ParticipantVerification({
  questId,
  levelIndex,
  participantId,
  onVerified,
}: ParticipantVerificationProps) {
  const supabase = createClient()
  const [uiState, setUiState] = useState<UIState>("waiting")
  const [code, setCode] = useState<string | null>(null)
  const [recordId, setRecordId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false) // when participant taps "Request code"
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // ── On mount: check if a verification row already exists for this level ──
  useEffect(() => {
    const fetchExisting = async () => {
      setLoading(true)
      const { data } = await supabase
        .from("level_verifications")
        .select("id, verification_code, status")
        .eq("participant_id", participantId)
        .eq("quest_id", questId)
        .eq("level_index", levelIndex)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data) {
        setRecordId(data.id)
        setCode(data.verification_code)
        if (data.status === "verified") {
          setUiState("verified")
          onVerified()
        }
      }
      setLoading(false)
    }

    fetchExisting()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questId, levelIndex, participantId])

  // ── Realtime: listen for the facilitator to INSERT or UPDATE this row ────
  useEffect(() => {
    // Listen for INSERTs (facilitator creates the row with a code)
    const insertChannel = supabase
      .channel(`verification-insert-${questId}-${levelIndex}-${participantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "level_verifications",
          filter: `participant_id=eq.${participantId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string
            quest_id: string
            level_index: number
            verification_code: string
            status: string
          }
          // Only react to the row for THIS quest + level
          if (row.quest_id === questId && row.level_index === levelIndex) {
            setRecordId(row.id)
            setCode(row.verification_code)
            if (row.status === "verified") {
              setUiState("verified")
              onVerified()
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(insertChannel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questId, levelIndex, participantId])

  // ── Realtime: listen for UPDATE on a known row (pending → verified) ──────
  useEffect(() => {
    if (!recordId || uiState === "verified") return

    const updateChannel = supabase
      .channel(`verification-update-${recordId}`)
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
      supabase.removeChannel(updateChannel)
    }
  }, [recordId, uiState, supabase, onVerified])

  // ── Verified state ───────────────────────────────────────────────────────
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

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-10 bg-gray-200 rounded" />
      </div>
    )
  }

  // ── Waiting: show code if facilitator already generated one ──────────────
  if (code) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm font-semibold text-blue-800 mb-1">
          Your verification code:
        </p>
        <p className="text-xs text-blue-600 mb-3">
          Show this to your facilitator or ask them to scan your QR code.
        </p>
        <div className="bg-white border-2 border-blue-300 rounded-lg py-4 text-center mb-3">
          <span className="text-4xl font-mono font-bold tracking-widest text-blue-900 select-all">
            {formatCode(code)}
          </span>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-blue-500">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          Waiting for facilitator to verify…
        </div>
      </div>
    )
  }

  // ── No code yet: facilitator hasn't created the row yet ──────────────────
  // provide a button so the participant can ask for a code themselves
  const handleRequest = async () => {
    setRequesting(true)
    setErrorMsg(null)
    try {
      const res = await createVerificationForParticipant(participantId, questId, levelIndex)
      console.log("createVerificationForParticipant result", res)
      if (res.success) {
        setRecordId(res.id)
        setCode(res.code)
        // also inform user explicitly
        setErrorMsg(null)
      } else {
        setErrorMsg(res.error || "Unable to generate code.")
      }
    } catch (err) {
      console.error("verification request failed", err)
      setErrorMsg("Unexpected error. Please try again.")
    }
    setRequesting(false)
  }

  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
      <div className="flex items-start gap-3">
        <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">
            Waiting for Facilitator
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Ask your facilitator to verify your progress or generate a code for you.
          </p>
        </div>
      </div>
      <button
        onClick={handleRequest}
        disabled={requesting}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {requesting ? "Requesting…" : "Request verification code"}
      </button>
      {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}
      {!errorMsg && !requesting && code === null && (
        <p className="text-xs text-gray-500">Tap above to ask your facilitator for a code.</p>
      )}
    </div>
  )
}