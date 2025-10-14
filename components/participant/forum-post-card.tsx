"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { createReply, deleteReply } from "@/app/actions/forums"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import type { ForumPost, ForumReply } from "@/lib/types"

interface ForumPostCardProps {
  post: ForumPost & {
    profile?: {
      id: string
      display_name: string | null
      avatar_url: string | null
      role: string
    }
    replies?: Array<{ count: number }>
  }
  forumId: string
}

export function ForumPostCard({ post, forumId }: ForumPostCardProps) {
  const [showReplies, setShowReplies] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [replies, setReplies] = useState<ForumReply[]>([])
  const [isLoadingReplies, setIsLoadingReplies] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getUser()
  }, [])

  const loadReplies = async () => {
    if (replies.length > 0) return // Already loaded
    
    setIsLoadingReplies(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("forum_replies")
      .select(`
        *,
        profile:profiles(id, display_name, avatar_url, role)
      `)
      .eq("post_id", post.id)
      .order("created_at", { ascending: true })

    if (data) {
      setReplies(data as ForumReply[])
    }
    setIsLoadingReplies(false)
  }

  const handleToggleReplies = () => {
    if (!showReplies) {
      loadReplies()
    }
    setShowReplies(!showReplies)
  }

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!replyContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reply",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    const result = await createReply(post.id, replyContent, forumId)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Your reply has been posted!",
      })
      setReplyContent("")
      setShowReplyForm(false)
      // Reload replies
      setReplies([])
      await loadReplies()
    }

    setIsSubmitting(false)
  }

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm("Are you sure you want to delete this reply?")) return

    const result = await deleteReply(replyId, forumId)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Reply deleted",
      })
      // Reload replies
      setReplies([])
      await loadReplies()
    }
  }

  const replyCount = post.replies?.[0]?.count || 0

  return (
    <div className="bg-card rounded-xl shadow-lg overflow-hidden border">
      <div className="p-8">
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 bg-gradient-avatar rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-sm">
            {post.profile?.display_name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="font-bold text-card-foreground text-lg">
                {post.profile?.display_name || "Unknown User"}
              </span>
              <span className="text-sm text-muted-foreground font-medium">
                {new Date(post.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-secondary whitespace-pre-wrap break-words text-base leading-relaxed">{post.content}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleReplies}
            className="text-interactive-primary hover:text-interactive-primary-hover hover:bg-muted h-10 px-4"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            <span className="font-medium">{replyCount} {replyCount === 1 ? "Reply" : "Replies"}</span>
            {showReplies ? (
              <ChevronUp className="w-4 h-4 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-2" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="text-interactive-primary hover:text-interactive-primary-hover hover:bg-muted h-10 px-4 font-medium"
          >
            Reply
          </Button>
        </div>
      </div>

      {showReplyForm && (
        <div className="px-8 pb-8">
          <form onSubmit={handleSubmitReply} className="bg-muted rounded-lg p-6">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              className="mb-3 bg-card"
              disabled={isSubmitting}
            />
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-brand-blue hover:bg-brand-blue-hover"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post Reply"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowReplyForm(false)
                  setReplyContent("")
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {showReplies && (
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
          {isLoadingReplies ? (
            <div className="text-center py-6">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600" />
            </div>
          ) : replies.length > 0 ? (
            <div className="space-y-4">
              {replies.map((reply) => (
                <div key={reply.id} className="flex items-start gap-4 bg-white p-6 rounded-lg shadow-sm">
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-blue-medium to-purple-400 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {reply.profile?.display_name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-bold text-gray-900 text-base">
                          {reply.profile?.display_name || "Unknown User"}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(reply.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {currentUserId === reply.user_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReply(reply.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-3"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                    <p className="text-gray-700 text-base whitespace-pre-wrap break-words leading-relaxed">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-6 text-base">No replies yet</p>
          )}
        </div>
      )}
    </div>
  )
}
