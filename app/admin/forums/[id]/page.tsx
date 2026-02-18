import "@/app/admin/admin.css"
import { Suspense } from "react"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"
import Link from "next/link"
import { ArrowLeft, MessageSquare, Archive } from "lucide-react"
import {
  getAdminForumDetail,
  getAdminForumPosts,
} from "@/lib/actions/admin-forums"
import { AdminPostCard } from "@/components/admin/forums/admin-post-card"
import { AdminForumDetailToolbar } from "@/components/admin/forums/admin-forum-detail-toolbar"

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    archived?: string
  }>
}

export default async function AdminForumDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const sp = await searchParams
  const archived = typeof sp.archived === "string" ? sp.archived : "active"

  const forum = await getAdminForumDetail(id)

  if (!forum) {
    redirect("/admin/forums")
  }

  const posts = await getAdminForumPosts(id, archived)

  return (
    <div className="admin-wrapper p-4 md:p-6">
      <div className="admin-header">
        <Link
          href="/admin/forums"
          className="inline-flex items-center text-white/80 hover:text-white mb-4 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Forums
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="admin-title">{forum.title}</h1>
              {forum.archived && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  <Archive className="w-3 h-3" />
                  Archived
                </span>
              )}
            </div>
            <p className="admin-subtitle">
              {forum.description || "No description"}
            </p>
            <div className="flex items-center gap-2 mt-2 text-sm text-white/60">
              <MessageSquare className="w-4 h-4" />
              <span>{posts.length} post{posts.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Suspense fallback={null}>
          <AdminForumDetailToolbar />
        </Suspense>

        <Suspense
          fallback={
            <div className="text-center py-10 text-white/60">
              Loading posts...
            </div>
          }
        >
          {posts.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No posts found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post: any) => (
                <AdminPostCard
                  key={post.id}
                  post={post}
                  forumId={id}
                  showArchived={archived}
                />
              ))}
            </div>
          )}
        </Suspense>
      </div>
    </div>
  )
}
