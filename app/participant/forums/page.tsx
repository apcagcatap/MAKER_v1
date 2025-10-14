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
    <div className="min-h-screen bg-gradient-page-bg">
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

      <main className="relative -mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="space-y-4">
          {forums?.map((forum) => (
            <Link
              key={forum.id}
              href={`/participant/forums/${forum.id}`}
              className="block bg-card rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-card-foreground mb-2">{forum.title}</h3>
                  <p className="text-muted-foreground mb-4">{forum.description}</p>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>{forum.posts?.[0]?.count || 0} posts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Last activity: {new Date(forum.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-100 rounded-lg p-3">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {forums?.length === 0 && (
          <div className="text-center py-12 bg-card rounded-xl shadow-lg">
            <p className="text-muted-foreground">No forums available yet. Check back soon!</p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border text-center">
          <div className="space-y-2">
            <h3 className="font-bold text-card-foreground">About MAKER</h3>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              A gamified learning platform for hands-on maker education, empowering participants to build, create, and innovate.
            </p>
            <div className="text-sm text-muted-foreground pt-4">
              <p>Department of Science and Technology</p>
              <p>Science and Technology Information Institute</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
