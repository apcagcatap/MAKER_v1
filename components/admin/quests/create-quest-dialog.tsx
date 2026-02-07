"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { QuestForm } from "@/components/admin/quests/quest-form"

export function CreateQuestDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#ED262A] hover:bg-[#c41e22] text-white">
          <Plus className="mr-2 h-4 w-4" />
          Create Quest
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Quest</DialogTitle>
        </DialogHeader>
        <QuestForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}