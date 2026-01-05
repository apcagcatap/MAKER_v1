"use client"

import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"

interface AdminPageHeaderProps {
  title: string
  description: string
  actionLabel?: string
  actionIcon?: LucideIcon
  onAction?: () => void
}

export function AdminPageHeader({
  title,
  description,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
}: AdminPageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="text-slate-500">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction}>
          {ActionIcon && <ActionIcon className="w-4 h-4 mr-2" />}
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
