import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminNav } from "@/components/layout/admin-nav"
import { MessageSquare, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ForumPostForm } from "@/components/admin/forum-post-form"
import { ForumPostCard } from "@/components/admin/forum-post-card"

export default async function AdminForumDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { id } = await params

  // Fetch forum details
  const { data: forum } = await supabase.from("forums").select("*").eq("id", id).single()

  if (!forum) {
    redirect("/admin/forums")
  }

  // Fetch forum posts with user profiles and reply counts
  const { data: posts } = await supabase
    .from("forum_posts")
    .select(`
      *,
      profile:profiles(id, display_name, avatar_url, role),
      replies:forum_replies(count)
    `)
    .eq("forum_id", id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/admin/forums"
          className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Forums
        </Link>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{forum.title}</h1>
          <p className="text-gray-600 mb-4">{forum.description}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>{posts?.length || 0} posts</span>
            </div>
          </div>
        </div>

        {/* Create Post Form */}
        <ForumPostForm forumId={id} />

        {/* Posts List */}
        <div className="space-y-4 mt-6">
          {posts?.map((post) => (
            <ForumPostCard key={post.id} post={post} forumId={id} />
          ))}
        </div>

        {posts?.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">No posts yet. Be the first to start a discussion!</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-brand-blue-dark/30 backdrop-blur-sm border-t border-brand-blue-hover/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              <a href="/admin/forums" className="text-on-blue hover:text-white transition-colors">
                Forums
              </a>
              <a href="/admin/settings" className="text-on-blue hover:text-white transition-colors">
                Settings
              </a>
              <a href="#" className="text-on-blue hover:text-white transition-colors">
                Documentation
              </a>
            </div>
            <p className="text-on-blue/70 text-sm">
              © 2025 MAKER Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
