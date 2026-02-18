"use client"

import { useState } from "react"
import { MoreHorizontal, Archive, Pencil, ArchiveRestore } from "lucide-react"
import { archiveQuest, restoreQuest } from "@/lib/actions/admin-quests"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { EditQuestDialog } from "./edit-quest-dialog"

// Using the same type definition strategy
import { ComponentProps } from "react"
import { QuestForm } from "./quest-form"
type Quest = ComponentProps<typeof QuestForm>["quest"] & { archived?: boolean }

export function QuestRowActions({ quest }: { quest: Quest }) {
  const [showEditDialog, setShowEditDialog] = useState(false)

  const handleArchive = async () => {
    if (!confirm("Are you sure you want to archive this quest? It can be restored later.")) return
    
    if (quest?.id) {
      const res = await archiveQuest(quest.id)
      if (res?.error) {
        alert(`Failed to archive quest: ${res.error}`)
      }
    }
  }

  const handleRestore = async () => {
    if (!confirm("Restore this quest and make it visible again?")) return

    if (quest?.id) {
      const res = await restoreQuest(quest.id)
      if (res?.error) {
        alert(`Failed to restore quest: ${res.error}`)
      }
    }
  }

  return (
    <>
      <EditQuestDialog open={showEditDialog} onOpenChange={setShowEditDialog} quest={quest} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          {!quest?.archived && (
            <DropdownMenuItem onSelect={() => setShowEditDialog(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {quest?.archived ? (
            <DropdownMenuItem onClick={handleRestore} className="text-green-600 focus:text-green-600">
              <ArchiveRestore className="mr-2 h-4 w-4" /> Restore
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleArchive} className="text-[#ED262A] focus:text-[#ED262A]">
              <Archive className="mr-2 h-4 w-4" /> Archive
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}