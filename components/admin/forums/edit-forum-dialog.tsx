"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ForumForm } from "./forum-form"
import type { Forum } from "./forum-form"

interface EditForumDialogProps {
  forum: Forum
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditForumDialog({ forum, open, onOpenChange }: EditForumDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Edit Forum</DialogTitle>
        </DialogHeader>
        <ForumForm forum={forum} onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
