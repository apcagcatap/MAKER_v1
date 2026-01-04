"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import type { Quest } from "@/lib/types"
import { QuestManagementCard } from "@/components/facilitator/quest-management-card"
import { deleteQuest } from "@/lib/actions/quests"
import { toast } from "sonner"

interface RecentQuestsSectionProps {
  quests: Quest[]
}

export function RecentQuestsSection({ quests: initialQuests }: RecentQuestsSectionProps) {
  const router = useRouter()
  const [quests, setQuests] = useState(initialQuests)
  const [isLoading, setIsLoading] = useState(false)

  const handleEdit = (questId: string) => {
    console.log("Edit quest:", questId)
    // Navigate to Active Quests page with quest ID to edit
    router.push(`/facilitator/quests?edit=${questId}`)
  }

  const handleDelete = async (questId: string) => {
    console.log("Delete quest:", questId)
    if (!confirm("Are you sure you want to delete this quest?")) return

    setIsLoading(true)
    try {
      await deleteQuest(questId)
      setQuests(quests.filter((q) => q.id !== questId))
      toast.success("Quest deleted successfully")
      // Refresh the page to ensure database is synced
      router.refresh()
    } catch (error) {
      console.error("Delete error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete quest")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-cyan-100">Recent Quests</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quests?.map((quest) => (
          <QuestManagementCard
            key={quest.id}
            quest={quest}
            onEdit={() => handleEdit(quest.id)}
            onDelete={() => handleDelete(quest.id)}
          />
        ))}
      </div>
    </div>
  )
}
