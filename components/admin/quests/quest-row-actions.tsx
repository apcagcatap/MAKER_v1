"use client"

import { useState } from "react"
import { MoreHorizontal, Trash2, Pencil } from "lucide-react"
import { deleteQuest } from "@/lib/actions/admin-quests"
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
type Quest = ComponentProps<typeof QuestForm>["quest"]

export function QuestRowActions({ quest }: { quest: Quest }) {
  const [showEditDialog, setShowEditDialog] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this quest? This action cannot be undone.")) return
    
    // We assume quest.id is always present
    if (quest?.id) {
      await deleteQuest(quest.id)
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
          <DropdownMenuItem onSelect={() => setShowEditDialog(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDelete} className="text-[#ED262A] focus:text-[#ED262A]">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}