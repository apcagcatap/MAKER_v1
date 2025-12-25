"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2, AlertTriangle } from "lucide-react"
import { deleteForum } from "@/app/actions/forums"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface DeleteForumButtonProps {
  forumId: string
}

export function DeleteForumButton({ forumId }: DeleteForumButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteForum(forumId)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
      setIsDeleting(false)
      setShowConfirm(false)
    } else {
      toast({
        title: "Deleted",
        description: "The forum has been successfully removed.",
        variant: "success",
      })
      // No need for setIsDeleting(false) as the page will refresh/redirect
      router.refresh()
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
        <Button
          size="sm"
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
          className="bg-red-600 hover:bg-red-700"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Confirm Delete"
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="bg-white"
        >
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => {
        e.preventDefault() // Stop link navigation
        e.stopPropagation() // Stop bubbling to Link
        setShowConfirm(true)
      }}
      className="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
    >
      <Trash2 className="w-5 h-5" />
    </Button>
  )
}