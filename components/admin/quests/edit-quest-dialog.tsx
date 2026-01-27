"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { QuestForm } from "@/components/admin/quests/quest-form"

// Re-using the interface from quest-form or importing it would be ideal
import { ComponentProps } from "react"
type Quest = ComponentProps<typeof QuestForm>["quest"]

export function EditQuestDialog({ quest, open, onOpenChange }: { quest: Quest, open: boolean, onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Quest</DialogTitle>
        </DialogHeader>
        <QuestForm quest={quest} onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}