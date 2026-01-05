"use client"

import { cn } from "@/lib/utils"

interface UserAvatarProps {
  name?: string | null
  email: string
  className?: string
}

export function UserAvatar({ name, email, className }: UserAvatarProps) {
  const initial = name?.[0]?.toUpperCase() || email[0].toUpperCase()
  
  return (
    <div
      className={cn(
        "w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-500 flex items-center justify-center text-white font-bold",
        className
      )}
    >
      {initial}
    </div>
  )
}
