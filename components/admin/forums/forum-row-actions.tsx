"use client"

import { useState } from "react"
import { MoreHorizontal, Archive, Pencil, ArchiveRestore } from "lucide-react"
import { archiveAdminForum, restoreAdminForum } from "@/lib/actions/admin-forums"
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
  forum: Forum & { archived?: boolean }
}

export function ForumRowActions({ forum }: ForumRowActionsProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)

  const handleArchive = async () => {
    if (!confirm("Are you sure you want to archive this forum? It can be restored later.")) return

    const res = await archiveAdminForum(forum.id)
    if (res.error) {
      alert(`Failed to archive forum: ${res.error}`)
    }
  }

  const handleRestore = async () => {
    if (!confirm("Restore this forum and make it visible again?")) return

    const res = await restoreAdminForum(forum.id)
    if (res.error) {
      alert(`Failed to restore forum: ${res.error}`)
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
          {!forum.archived && (
            <DropdownMenuItem onSelect={() => setShowEditDialog(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {forum.archived ? (
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
