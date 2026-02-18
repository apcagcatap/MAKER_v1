"use client"

import { useState } from "react"
import { createVerificationForParticipant } from "@/lib/actions/verification"
import { formatCode } from "@/lib/actions/verification-utils"

interface ActiveQuest {
  id: string
  current_level: number
  status: string
  quest: {
    id: string
    title: string
    levels?: any[]
  }
}

interface FacilitatorGenerateVerificationProps {
  participantId: string
  activeQuests: ActiveQuest[]
}

export function FacilitatorGenerateVerification({
  participantId,
  activeQuests,
}: FacilitatorGenerateVerificationProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastCode, setLastCode] = useState<{
    questId: string
    levelIndex: number
    code: string
  } | null>(null)

  const handleGenerate = async (questId: string, levelIndex: number) => {
    setLoading(true)
    setError(null)
    setLastCode(null)
    try {
      const res = await createVerificationForParticipant(
        participantId,
        questId,
        levelIndex
      )
      if (res.success) {
        setLastCode({ questId, levelIndex, code: res.code })
      } else {
        setError(res.error || "Failed to generate code. Please try again.")
      }
    } catch {
      setError("Unexpected error. Please try again.")
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Manual Verification</h2>
      {activeQuests.length === 0 ? (
        <p className="text-sm text-gray-600">No active quests for this user.</p>
      ) : (
        <div className="space-y-4">
          {activeQuests.map((aq) => {
            const lvl = aq.quest.levels?.[aq.current_level]
            const needs = lvl?.requiresVerification === true
            return (
              <div key={aq.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {aq.quest.title} &ndash; Level {aq.current_level + 1}
                  </p>
                  {!needs && (
                    <p className="text-xs text-gray-500">(no verification required)</p>
                  )}
                </div>
                {needs && (
                  <button
                    onClick={() => handleGenerate(aq.quest.id, aq.current_level)}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? "Generating…" : "Generate Code"}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {lastCode && (
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            Code for level {lastCode.levelIndex + 1}:
          </p>
          <p className="font-mono text-2xl text-blue-900">
            {formatCode(lastCode.code)}
          </p>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  )
}
