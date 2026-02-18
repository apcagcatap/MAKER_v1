"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { generateCodeForSelf } from "@/lib/actions/verification"
import { CheckCircle2, RefreshCw, ClipboardCopy } from "lucide-react"

function formatCode(code: string): string {
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "")
  if (clean.length !== 6) return code
  return `${clean.slice(0, 3)}-${clean.slice(3)}`
}

interface ParticipantVerificationProps {
  questId: string
  levelIndex: number
  participantId: string
  onVerified: () => void
}

type UIState = "loading" | "idle" | "hasCode" | "verified"

export function ParticipantVerification({
  questId,
  levelIndex,
  participantId,
  onVerified,
}: ParticipantVerificationProps) {
  const supabase = createClient()
  const [uiState, setUiState] = useState<UIState>("loading")
  const [code, setCode] = useState<string | null>(null)
  const [recordId, setRecordId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Use a ref so polling interval always sees the latest state
  const uiStateRef = useRef<UIState>("loading")
  const recordIdRef = useRef<string | null>(null)

  const markVerified = useCallback(() => {
    uiStateRef.current = "verified"
    setUiState("verified")
    onVerified()
  }, [onVerified])

  // ── Check DB (used on mount AND as polling fallback) ──────────────────────
  const checkDB = useCallback(async () => {
    if (!participantId) return
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
      if (data.status === "verified") {
        recordIdRef.current = data.id
        setRecordId(data.id)
        setCode(data.verification_code)
        markVerified()
      } else {
        recordIdRef.current = data.id
        setRecordId(data.id)
        setCode(data.verification_code)
        if (uiStateRef.current === "loading" || uiStateRef.current === "idle") {
          uiStateRef.current = "hasCode"
          setUiState("hasCode")
        }
      }
    } else {
      if (uiStateRef.current === "loading") {
        uiStateRef.current = "idle"
        setUiState("idle")
      }
    }
  }, [participantId, questId, levelIndex, supabase, markVerified])

  // ── Mount: initial check + start polling every 3s ─────────────────────────
  useEffect(() => {
    checkDB()

    const interval = setInterval(() => {
      // Stop polling once verified
      if (uiStateRef.current === "verified") return
      checkDB()
    }, 3000)

    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantId, questId, levelIndex])

  // ── Realtime: UPDATE (pending → verified) — fires instantly if it works ───
  useEffect(() => {
    if (!recordId || uiStateRef.current === "verified") return

    const ch = supabase
      .channel(`v-update-${recordId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "level_verifications",
        filter: `id=eq.${recordId}`,
      }, (payload) => {
        if ((payload.new as { status: string }).status === "verified") {
          markVerified()
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [recordId, supabase, markVerified])

  // ── Generate code ─────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    setGenerating(true)
    setError(null)
    const res = await generateCodeForSelf(questId, levelIndex)
    if (res.success) {
      recordIdRef.current = res.id
      setRecordId(res.id)
      setCode(res.code)
      uiStateRef.current = "hasCode"
      setUiState("hasCode")
    } else {
      setError(res.error)
    }
    setGenerating(false)
  }, [questId, levelIndex])

  const handleCopy = () => {
    if (!code) return
    navigator.clipboard.writeText(formatCode(code)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // ── VERIFIED ──────────────────────────────────────────────────────────────
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

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (uiState === "loading") {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
        <div className="h-14 bg-gray-200 rounded" />
      </div>
    )
  }

  // ── HAS CODE — show it and wait ───────────────────────────────────────────
  if (uiState === "hasCode" && code) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm font-semibold text-blue-800 mb-1">
          Your verification code:
        </p>
        <p className="text-xs text-blue-600 mb-3">
          Show this code to your facilitator so they can verify your level completion.
        </p>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 bg-white border-2 border-blue-300 rounded-lg py-4 text-center">
            <span className="text-4xl font-mono font-bold tracking-widest text-blue-900 select-all">
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
        {copied && <p className="text-xs text-blue-500 text-center mb-2">Copied!</p>}
        <div className="flex items-center justify-center gap-2 text-xs text-blue-500">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          Waiting for facilitator to verify…
        </div>
      </div>
    )
  }

  // ── IDLE — no code yet ────────────────────────────────────────────────────
  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <p className="text-sm font-semibold text-amber-800 mb-1">
        Manual Verification Required
      </p>
      <p className="text-xs text-amber-700 mb-3">
        This level requires your facilitator to verify your completion.
        Click below to generate a code, then show it to your facilitator.
      </p>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
      >
        {generating ? (
          <><RefreshCw className="w-4 h-4 animate-spin" /> Generating…</>
        ) : (
          "Get Verification Code"
        )}
      </button>
    </div>
  )
}