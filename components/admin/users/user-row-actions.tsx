// components/admin/users/user-row-actions.tsx
"use client"

import { useState } from "react"
import { MoreHorizontal, Trash2, Shield, User } from "lucide-react"
import { deleteUser, updateUserRole } from "@/lib/actions/admin-users"
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
}

export function UserRowActions({ userId, currentRole }: UserRowActionsProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return
    
    setIsLoading(true)
    try {
      await deleteUser(userId)
    } catch (error) {
      console.error("Failed to delete user", error)
      alert("Failed to delete user")
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
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleDelete}
          className="text-[#ED262A] focus:text-[#ED262A]"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
