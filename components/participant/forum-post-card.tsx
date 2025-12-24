"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, ChevronDown, ChevronUp, Loader2, Trash2 } from "lucide-react"
import { createReply, deleteReply, deletePost } from "@/app/actions/forums"
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
  const [isDeletingPost, setIsDeletingPost] = useState(false)
  const [replies, setReplies] = useState<ForumReply[]>([])
  const [isLoadingReplies, setIsLoadingReplies] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch current user on mount to check ownership
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getUser()
  }, [])

  const loadReplies = async () => {
    if (replies.length > 0) return 
    
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

  const handleDeletePost = async () => {
    if (!confirm("Are you sure you want to delete this post? All replies will be lost.")) return

    setIsDeletingPost(true)
    const result = await deletePost(post.id, forumId)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
      setIsDeletingPost(false)
    } else {
      toast({
        title: "Success",
        description: "Post deleted successfully",
      })
      // No manual state clear needed as revalidatePath will refresh the list
    }
  }

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim()) return

    setIsSubmitting(true)
    const result = await createReply(post.id, replyContent, forumId)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({ title: "Success", description: "Reply posted!" })
      setReplyContent("")
      setShowReplyForm(false)
      setReplies([]) 
      await loadReplies()
    }
    setIsSubmitting(false)
  }

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm("Delete this reply?")) return

    const result = await deleteReply(replyId, forumId)
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else {
      toast({ title: "Success", description: "Reply deleted" })
      setReplies(prev => prev.filter(r => r.id !== replyId))
    }
  }

  const replyCount = post.replies?.[0]?.count || 0

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all ${isDeletingPost ? "opacity-50 grayscale" : ""}`}>
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {post.profile?.display_name?.[0]?.toUpperCase() || "U"}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900">
                  {post.profile?.display_name || "Unknown User"}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Delete Post Button (Owner only) */}
              {currentUserId === post.user_id && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDeletePost}
                  disabled={isDeletingPost}
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50 -mt-2"
                >
                  {isDeletingPost ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
              )}
            </div>
            <p className="text-gray-700 whitespace-pre-wrap break-words">{post.content}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleReplies}
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            {replyCount} {replyCount === 1 ? "Reply" : "Replies"}
            {showReplies ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            Reply
          </Button>
        </div>
      </div>

      {/* Reply Form */}
      {showReplyForm && (
        <div className="px-6 pb-6">
          <form onSubmit={handleSubmitReply} className="bg-gray-50 rounded-lg p-4">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              className="mb-3 bg-white"
              disabled={isSubmitting}
            />
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" disabled={isSubmitting} className="bg-gradient-to-r from-purple-600 to-blue-600">
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Post Reply"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowReplyForm(false)} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Replies List */}
      {showReplies && (
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          {isLoadingReplies ? (
            <div className="text-center py-4"><Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600" /></div>
          ) : replies.length > 0 ? (
            <div className="space-y-4">
              {replies.map((reply) => (
                <div key={reply.id} className="flex items-start gap-3 bg-white p-4 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {reply.profile?.display_name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{reply.profile?.display_name || "User"}</span>
                        <span className="text-xs text-gray-500">{new Date(reply.created_at).toLocaleDateString()}</span>
                      </div>
                      {currentUserId === reply.user_id && (
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteReply(reply.id)} className="text-red-600 h-6 px-2 hover:bg-red-50">
                          Delete
                        </Button>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap break-words">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">No replies yet</p>
          )}
        </div>
      )}
    </div>
  )
}