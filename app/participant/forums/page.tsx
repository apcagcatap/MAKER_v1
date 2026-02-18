import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ParticipantNav } from "@/components/layout/participant-nav"
import { MessageSquare } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default async function ForumsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch all forums with post counts (only non-archived posts)
  const { data: forums } = await supabase
    .from("forums")
    .select(`
      *,
      posts:forum_posts(count)
    `)
    .eq("archived", false)
    .eq("posts.archived", false)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
      {/* Header Section with Background */}
      <div className="relative h-48 sm:h-52">
        <Image
          src="/navbarBg.png"
          alt="Background"
          fill
          className="object-cover"
          quality={100}
          priority
        />
        {/* Navbar on top of background */}
        <div className="absolute top-0 left-0 right-0 z-20">
          <ParticipantNav />
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 text-white">Community Forums</h1>
          <p className="text-xs sm:text-sm text-white/90">Connect with other makers and share your journey</p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {forums?.map((forum) => (
            <Link 
              key={forum.id}
              href={`/participant/forums/${forum.id}`}
              className="bg-card rounded-xl border p-4 sm:p-5 md:p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col"
            >
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-card-foreground hover:text-interactive-primary transition-colors mb-2 sm:mb-3">
                {forum.title}
              </h3>
              
              <p className="text-muted-foreground mb-3 sm:mb-4 flex-grow line-clamp-2 text-xs sm:text-sm md:text-base">
                {forum.description}
              </p>

              <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground border-t pt-3 sm:pt-4">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{forum.posts?.[0]?.count || 0} posts</span>
                </div>
                <div className="bg-brand-blue-light rounded-lg p-1.5 sm:p-2">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-brand-blue" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {forums?.length === 0 && (
          <div className="col-span-full text-center py-8 sm:py-12 bg-card rounded-xl shadow-lg">
            <p className="text-muted-foreground text-sm sm:text-base">No forums available yet. Check back soon!</p>
          </div>
        )}
      </main>
    </div>
  )
}