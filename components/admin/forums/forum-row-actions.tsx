"use client"

import { useState } from "react"
import { MoreHorizontal, Trash2, Pencil } from "lucide-react"
import { deleteAdminForum } from "@/lib/actions/admin-forums"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { EditForumDialog } from "./edit-forum-dialog"
import type { Forum } from "./forum-form"

interface ForumRowActionsProps {
  forum: Forum
}

export function ForumRowActions({ forum }: ForumRowActionsProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this forum? This will delete all posts and replies within it.")) return

    const res = await deleteAdminForum(forum.id)
    if (res.error) {
      alert(`Failed to delete forum: ${res.error}`)
    }
  }

  return (
    <>
      <EditForumDialog
        forum={forum}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
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
