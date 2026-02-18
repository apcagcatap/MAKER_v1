// components/admin/users/user-row-actions.tsx
"use client"

import { useState } from "react"
import { MoreHorizontal, Archive, Shield, User, ArchiveRestore } from "lucide-react"
import { archiveUser, restoreUser, updateUserRole } from "@/lib/actions/admin-users"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface UserRowActionsProps {
  userId: string
  currentRole: string
  archived?: boolean
}

export function UserRowActions({ userId, currentRole, archived }: UserRowActionsProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleArchive = async () => {
    if (!confirm("Are you sure you want to archive this user? They will no longer appear in active lists.")) return
    
    setIsLoading(true)
    try {
      const res = await archiveUser(userId)
      if (res.error) alert(`Failed to archive user: ${res.error}`)
    } catch (error) {
      console.error("Failed to archive user", error)
      alert("Failed to archive user")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestore = async () => {
    if (!confirm("Restore this user and make them active again?")) return

    setIsLoading(true)
    try {
      const res = await restoreUser(userId)
      if (res.error) alert(`Failed to restore user: ${res.error}`)
    } catch (error) {
      console.error("Failed to restore user", error)
      alert("Failed to restore user")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleUpdate = async (newRole: string) => {
    setIsLoading(true)
    try {
      await updateUserRole(userId, newRole)
    } catch (error) {
      console.error("Failed to update role", error)
      alert("Failed to update role")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText(userId)}
        >
          Copy ID
        </DropdownMenuItem>
        
        {!archived && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Change Role</DropdownMenuLabel>
            <DropdownMenuItem 
              onClick={() => handleRoleUpdate("facilitator")}
              disabled={currentRole === "facilitator"}
            >
              <Shield className="mr-2 h-4 w-4" />
              Make Facilitator
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleRoleUpdate("participant")}
              disabled={currentRole === "participant"}
            >
              <User className="mr-2 h-4 w-4" />
              Make Participant
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        {archived ? (
          <DropdownMenuItem 
            onClick={handleRestore}
            className="text-green-600 focus:text-green-600"
          >
            <ArchiveRestore className="mr-2 h-4 w-4" />
            Restore User
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem 
            onClick={handleArchive}
            className="text-[#ED262A] focus:text-[#ED262A]"
          >
            <Archive className="mr-2 h-4 w-4" />
            Archive User
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
