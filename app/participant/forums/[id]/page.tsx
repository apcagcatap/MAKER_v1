import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ParticipantNav } from "@/components/layout/participant-nav"
import { MessageSquare, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ForumPostForm } from "@/components/participant/forum-post-form"
import { ForumPostCard } from "@/components/participant/forum-post-card"

export default async function ForumDetailPage({ params }: { params: { id: string } }) {
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
    redirect("/participant/forums")
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
    <div className="min-h-screen bg-brand-blue-dark">
      <ParticipantNav />

      <div className="relative h-64">
        <Image
          src="/navbarBg.png"
          alt="Background"
          layout="fill"
          objectFit="cover"
          quality={100}
          className="absolute inset-0 z-0"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 text-white">
          <Link
            href="/participant/forums"
            className="inline-flex items-center text-white hover:text-on-blue mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Forums
          </Link>
          <h1 className="text-4xl font-bold mb-2">{forum.title}</h1>
          <p className="text-on-blue">{forum.description}</p>
          <div className="flex items-center gap-4 text-sm text-on-blue mt-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>{posts?.length || 0} posts</span>
            </div>
          </div>
        </div>
      </div>

      <main className="relative -mt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 z-20">
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
