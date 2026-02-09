import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { MessageSquare, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ForumPostForm } from "@/components/facilitator/forum-post-form"
import { ForumPostCard } from "@/components/facilitator/forum-post-card"
import { FacilitatorNav } from "@/components/layout/facilitator-nav"

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
  const { data: forum } = await supabase.from("forums").select("*").eq("id", id).eq("archived", false).single()

  if (!forum) {
    redirect("/facilitator/forums")
  }

  // Fetch forum posts with user profiles and reply counts (only non-archived replies)
  const { data: posts } = await supabase
    .from("forum_posts")
    .select(`
      *,
      profile:profiles(id, display_name, avatar_url, role),
      replies:forum_replies(count)
    `)
    .eq("forum_id", id)
    .eq("archived", false)
    .eq("replies.archived", false)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-brand-blue-dark">
      <FacilitatorNav />

      <div className="relative h-44 sm:h-52 md:h-64">
        <Image
          src="/navbarBg.png"
          alt="Background"
          fill
          className="object-cover"
          quality={100}
          priority
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center text-white">
          <Link
            href="/facilitator/forums"
            className="inline-flex items-center text-white hover:text-on-blue mb-2 sm:mb-4 text-xs sm:text-sm md:text-base transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            Back to Forums
          </Link>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 line-clamp-2">{forum.title}</h1>
          <p className="text-on-blue text-xs sm:text-sm md:text-base line-clamp-2">{forum.description}</p>
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-on-blue mt-2 sm:mt-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{posts?.length || 0} posts</span>
            </div>
          </div>
        </div>
      </div>

      <main className="relative -mt-16 sm:-mt-20 md:-mt-24 pt-10 sm:pt-12 md:pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 md:pb-8 z-20">
        {/* Create Post Form */}
        <ForumPostForm forumId={id} />

        {/* Posts List */}
        <div className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
          {posts?.map((post) => (
            <ForumPostCard key={post.id} post={post} forumId={id} />
          ))}
        </div>

        {posts?.length === 0 && (
          <div className="text-center py-8 sm:py-12 bg-white rounded-xl shadow-lg">
            <p className="text-gray-500 text-sm sm:text-base px-4">No posts yet. Be the first to start a discussion!</p>
          </div>
        )}
      </main>
    </div>
  )
}