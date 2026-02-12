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
import { ForumForm } from "./forum-form"

export function CreateForumDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#ED262A] hover:bg-[#c41e22] text-white">
          <Plus className="mr-2 h-4 w-4" />
          Create Forum
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Create New Forum</DialogTitle>
        </DialogHeader>
        <ForumForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
