"use client"

import { useTransition } from "react"
import { deleteQuest } from "@/lib/actions/admin-quests"

export function DeleteQuestButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this quest? This cannot be undone.")) {
      startTransition(async () => {
        const res = await deleteQuest(id)
        if (res.error) {
          alert(res.error)
        }
      })
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-[#ED262A] hover:text-[#c41e22] text-sm font-medium disabled:opacity-50"
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  )
}