"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { QuestsTable } from "@/components/facilitator/quests-table"

interface Quest {
  id: string
  title: string
  description: string
  difficulty: string
  scheduled_date: string | null
  badge_image_url: string | null
  certificate_image_url: string | null
  status: string
  materials_needed: string
  general_instructions: string
  levels: Array<{ title: string; description: string }>
  created_at: string
}

interface QuestsTableWrapperProps {
  initialQuests: Quest[]
  initialEditingQuestId: string | null
}

export function QuestsTableWrapper({
  initialQuests,
  initialEditingQuestId,
}: QuestsTableWrapperProps) {
  const searchParams = useSearchParams()
  const [questToEdit, setQuestToEdit] = useState<Quest | null>(null)
  const [shouldOpenModal, setShouldOpenModal] = useState(false)

  useEffect(() => {
    const editId = searchParams.get("edit") || initialEditingQuestId
    if (editId) {
      const foundQuest = initialQuests.find((q) => q.id === editId)
      if (foundQuest) {
        setQuestToEdit(foundQuest)
        setShouldOpenModal(true)
      }
    }
  }, [searchParams, initialEditingQuestId, initialQuests])

  return (
    <QuestsTable
      initialQuests={initialQuests}
      initialEditingQuest={questToEdit}
      initialModalOpen={shouldOpenModal}
    />
  )
}
