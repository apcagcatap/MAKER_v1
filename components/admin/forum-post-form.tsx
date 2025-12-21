"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Loader2 } from "lucide-react"
import { createPost } from "@/app/actions/forums"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface ForumPostFormProps {
  forumId: string
}

export function ForumPostForm({ forumId }: ForumPostFormProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter some content for your post",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    const result = await createPost(forumId, content)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Your post has been created!",
      })
      setContent("")
      setIsExpanded(false)
      router.refresh()
    }

    setIsSubmitting(false)
  }

  if (!isExpanded) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 relative z-30">
        <Button
          onClick={() => setIsExpanded(true)}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 cursor-pointer"
          type="button"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Create New Post
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 mb-6 relative z-30">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Create a New Post</h3>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your thoughts..."
        className="mb-4 min-h-[120px]"
        disabled={isSubmitting}
      />
      <div className="flex items-center gap-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Posting...
            </>
          ) : (
            <>
              <MessageSquare className="w-4 h-4 mr-2" />
              Post
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsExpanded(false)
            setContent("")
          }}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}