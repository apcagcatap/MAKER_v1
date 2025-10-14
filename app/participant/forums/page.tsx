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
    <div className="min-h-screen bg-blue-900">
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
          <h1 className="text-4xl font-bold mb-2">Forums</h1>
          <p className="text-blue-100">Connect with other makers and share your journey</p>
        </div>
      </div>

      <main className="relative -mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="space-y-4">
          {forums?.map((forum) => (
            <Link
              key={forum.id}
              href={`/participant/forums/${forum.id}`}
              className="block bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{forum.title}</h3>
                  <p className="text-gray-600 mb-4">{forum.description}</p>

                  <div className="flex items-center gap-6 text-sm text-gray-500">
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

                <div className="bg-purple-100 rounded-lg p-3">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {forums?.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <p className="text-gray-500">No forums available yet. Check back soon!</p>
          </div>
        )}
      </main>
    </div>
  )
}
