"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, MoreHorizontal, Trash2 } from "lucide-react"

interface Action {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: "default" | "destructive"
}

interface AdminTableActionsProps {
  actions: Action[]
}

export function AdminTableActions({ actions }: AdminTableActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action, index) => (
          <DropdownMenuItem
            key={index}
            onClick={action.onClick}
            className={action.variant === "destructive" ? "text-red-600" : ""}
          >
            {action.icon}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Convenience component for common edit/delete pattern
interface EditDeleteActionsProps {
  onEdit: () => void
  onDelete: () => void
}

export function EditDeleteActions({ onEdit, onDelete }: EditDeleteActionsProps) {
  return (
    <AdminTableActions
      actions={[
        {
          label: "Edit",
          icon: <Edit className="w-4 h-4 mr-2" />,
          onClick: onEdit,
        },
        {
          label: "Delete",
          icon: <Trash2 className="w-4 h-4 mr-2" />,
          onClick: onDelete,
          variant: "destructive",
        },
      ]}
    />
  )
}
