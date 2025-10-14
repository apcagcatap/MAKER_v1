import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ParticipantNav } from "@/components/layout/participant-nav"
import { MessageSquare, Clock } from "lucide-react"
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

  // Fetch all forums with post counts
  const { data: forums } = await supabase
    .from("forums")
    .select(`
      *,
      posts:forum_posts(count)
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-page-bg flex flex-col">
      <ParticipantNav />

      <div className="relative h-48">
        <Image
          src="/navbarBg.png"
          alt="Background"
          layout="fill"
          objectFit="cover"
          quality={100}
          className="absolute inset-0 z-0"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 text-white">
          <h1 className="text-4xl font-bold mb-2">Community Forums</h1>
          <p className="text-blue-100">Connect with other makers and share your journey</p>
        </div>
      </div>

      <main className="relative -mt-16 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-8 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {forums?.map((forum) => (
            <Link
              key={forum.id}
              href={`/participant/forums/${forum.id}`}
              className="block bg-card rounded-xl shadow-lg p-6 hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col"
            >
              <h3 className="text-xl font-bold text-card-foreground mb-2">{forum.title}</h3>
              <p className="text-muted-foreground mb-4 flex-grow line-clamp-2">{forum.description}</p>

              <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>{forum.posts?.[0]?.count || 0} posts</span>
                </div>
                <div className="bg-blue-100 rounded-lg p-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {forums?.length === 0 && (
          <div className="col-span-full text-center py-12 bg-card rounded-xl shadow-lg">
            <p className="text-muted-foreground">No forums available yet. Check back soon!</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-blue-900/30 backdrop-blur-sm border-t border-blue-700/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4 text-center">
            <h3 className="font-semibold text-white text-base">About MAKER</h3>
            <p className="text-sm text-blue-100 max-w-2xl mx-auto">
              A gamified learning platform for hands-on maker education, empowering participants to build, create, and innovate.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              <a href="/participant/forums" className="text-blue-200 hover:text-white transition-colors text-sm">
                Forums
              </a>
              <a href="#" className="text-blue-200 hover:text-white transition-colors text-sm">
                Documentation
              </a>
            </div>
            <p className="text-blue-300/70 text-xs pt-2">
              &copy; 2025 MAKER Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
