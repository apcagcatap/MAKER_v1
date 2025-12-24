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
          <p className="text-on-blue">Connect with other makers and share your journey</p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forums?.map((forum) => (
            <div
              key={forum.id}
              className="bg-card rounded-xl border p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col"
            >
              <Link href={`/participant/forums/${forum.id}`} className="block mb-3">
                <h3 className="text-xl font-bold text-card-foreground hover:text-interactive-primary transition-colors">
                  {forum.title}
                </h3>
              
              <p className="text-muted-foreground mb-4 flex-grow line-clamp-2">{forum.description}</p>

              <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>{forum.posts?.[0]?.count || 0} posts</span>
                </div>
                <div className="bg-brand-blue-light rounded-lg p-2">
                  <MessageSquare className="w-5 h-5 text-brand-blue" />
                </div>
              </div>
              </Link>
            </div>
          ))}
        </div>

        {forums?.length === 0 && (
          <div className="col-span-full text-center py-12 bg-card rounded-xl shadow-lg">
            <p className="text-muted-foreground">No forums available yet. Check back soon!</p>
          </div>
        )}
      </main>
    </div>
  )
}
