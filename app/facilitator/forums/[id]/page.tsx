import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FacilitatorNav } from "@/components/layout/facilitator-nav"
import { MessageSquare, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ForumPostForm } from "@/components/facilitator/forum-post-form"
import { ForumPostCard } from "@/components/facilitator/forum-post-card"

export default async function FacilitatorForumDetailPage({ params }: { params: { id: string } }) {
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
    redirect("/facilitator/forums")
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
    <div className="min-h-screen bg-blue-900">
      {/* Header Section */}
      <div
        className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden"
        style={{ borderBottomLeftRadius: "3rem", borderBottomRightRadius: "3rem" }}
      >
        <div className="absolute inset-0 opacity-100 z-0">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url('/navbarBg.png')`,
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderBottomLeftRadius: "3rem",
              borderBottomRightRadius: "3rem",
            }}
          />
        </div>
        <div className="relative z-10">
          <FacilitatorNav />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
            <Link
              href="/facilitator/forums"
              className="inline-flex items-center text-white hover:text-blue-100 mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Forums
            </Link>
            <h1 className="text-4xl font-bold text-white mb-2">{forum.title}</h1>
            <p className="text-gray-200">{forum.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-200 mt-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>{posts?.length || 0} posts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="relative -mt-16 z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create Post Form */}
        <ForumPostForm forumId={id} />

        {/* Posts List */}
        <div className="space-y-4 mt-6">
          {posts?.map((post) => (
            <ForumPostCard key={post.id} post={post} forumId={id} />
          ))}
        </div>

        {posts?.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <p className="text-gray-500">No posts yet. Be the first to start a discussion!</p>
          </div>
        )}
      </main>
    </div>
  )
}
