"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Archive,
  ArchiveRestore,
  User,
  Loader2,
} from "lucide-react"
import {
  archiveAdminPost,
  restoreAdminPost,
  archiveAdminReply,
  restoreAdminReply,
  getAdminPostReplies,
} from "@/lib/actions/admin-forums"
import { useToast } from "@/hooks/use-toast"

interface AdminPostCardProps {
  post: {
    id: string
    content: string
    image_url?: string | null
    created_at: string
    archived: boolean
    profile?: {
      id: string
      display_name: string | null
      avatar_url: string | null
      role: string
    }
  }
  forumId: string
  showArchived?: string
}

export function AdminPostCard({ post, forumId, showArchived }: AdminPostCardProps) {
  const autoExpandReplies = !post.archived && showArchived === "archived"
  const [showReplies, setShowReplies] = useState(autoExpandReplies)
  const [replies, setReplies] = useState<any[]>([])
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [archivingPost, setArchivingPost] = useState(false)
  const [archivingReplyId, setArchivingReplyId] = useState<string | null>(null)
  const { toast } = useToast()

  const loadReplies = async () => {
    setLoadingReplies(true)
    try {
      const data = await getAdminPostReplies(post.id, showArchived)
      setReplies(data)
    } catch {
      toast({ title: "Error", description: "Failed to load replies", variant: "destructive" })
    } finally {
      setLoadingReplies(false)
    }
  }

  useEffect(() => {
    if (showReplies) {
      loadReplies()
    }
  }, [showReplies, showArchived])

  const handleArchivePost = async () => {
    if (!confirm(`Are you sure you want to ${post.archived ? "restore" : "archive"} this post? ${!post.archived ? "This will also archive all replies." : "This will also restore all replies."}`)) return
    setArchivingPost(true)
    try {
      const result = post.archived
        ? await restoreAdminPost(post.id, forumId)
        : await archiveAdminPost(post.id, forumId)

      if ("error" in result) {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      } else {
        toast({ title: post.archived ? "Post restored" : "Post archived", description: post.archived ? "The post and its replies have been restored." : "The post and its replies have been archived." })
        if (showReplies) loadReplies()
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
    } finally {
      setArchivingPost(false)
    }
  }

  const handleArchiveReply = async (replyId: string, isArchived: boolean) => {
    if (!confirm(`Are you sure you want to ${isArchived ? "restore" : "archive"} this reply?`)) return
    setArchivingReplyId(replyId)
    try {
      const result = isArchived
        ? await restoreAdminReply(replyId, forumId)
        : await archiveAdminReply(replyId, forumId)

      if ("error" in result) {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      } else {
        toast({ title: isArchived ? "Reply restored" : "Reply archived" })
        loadReplies()
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
    } finally {
      setArchivingReplyId(null)
    }
  }

  return (
    <div className={`bg-white rounded-lg border shadow-sm overflow-hidden ${post.archived ? "border-gray-300 opacity-75" : "border-gray-200"}`}>
      {/* Post Header */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
              {post.profile?.avatar_url ? (
                <img src={post.profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-gray-500" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-900 text-sm truncate">
                  {post.profile?.display_name || "Unknown User"}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 capitalize">
                  {post.profile?.role || "user"}
                </span>
                {post.archived && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-600 inline-flex items-center gap-1">
                    <Archive className="w-3 h-3" />
                    Archived
                  </span>
                )}
                {!post.archived && showArchived === "archived" && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 inline-flex items-center gap-1">
                    Has Archived Replies
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(post.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Archive / Restore Post */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleArchivePost}
            disabled={archivingPost}
            className={post.archived
              ? "text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
              : "bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700"
            }
          >
            {archivingPost ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : post.archived ? (
              <>
                <ArchiveRestore className="w-4 h-4 mr-1.5" />
                Restore
              </>
            ) : (
              <>
                <Archive className="w-4 h-4 mr-1.5" />
                Archive
              </>
            )}
          </Button>
        </div>

        {/* Post Content */}
        <div className="mt-3 text-sm text-gray-700 whitespace-pre-wrap break-words">
          {post.content}
        </div>

        {post.image_url && (
          <div className="mt-3">
            <img
              src={post.image_url}
              alt="Post attachment"
              className="max-h-60 rounded-lg border border-gray-200 object-contain"
            />
          </div>
        )}
      </div>

      {/* Toggle Replies */}
      <div className="border-t border-gray-100">
        <button
          onClick={() => setShowReplies(!showReplies)}
          className="w-full flex items-center justify-between px-4 sm:px-5 py-3 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            {showReplies ? "Hide Replies" : "Show Replies"}
          </span>
          {showReplies ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Replies Section */}
      {showReplies && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-4 sm:p-5 space-y-3">
          {loadingReplies ? (
            <div className="flex items-center justify-center py-4 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Loading replies...
            </div>
          ) : replies.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-4">
              No replies found.
            </p>
          ) : (
            replies.map((reply: any) => (
              <div
                key={reply.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  reply.archived
                    ? "bg-gray-50 border-gray-300 opacity-75"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                  {reply.profile?.avatar_url ? (
                    <img src={reply.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {reply.profile?.display_name || "Unknown User"}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 capitalize">
                      {reply.profile?.role || "user"}
                    </span>
                    {reply.archived && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-600 inline-flex items-center gap-1">
                        <Archive className="w-3 h-3" />
                        Archived
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(reply.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap break-words">
                    {reply.content}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleArchiveReply(reply.id, reply.archived)}
                  disabled={archivingReplyId === reply.id}
                  className={`shrink-0 ${
                    reply.archived
                      ? "text-green-600 hover:bg-green-50 hover:text-green-700"
                      : "bg-red-600 text-white hover:bg-red-700 rounded-md"
                  }`}
                >
                  {archivingReplyId === reply.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : reply.archived ? (
                    <ArchiveRestore className="w-3.5 h-3.5" />
                  ) : (
                    <Archive className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
