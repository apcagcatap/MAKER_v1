import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FacilitatorNav } from "@/components/layout/facilitator-nav"
import { MessageSquare, Clock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { CreateForumDialog } from "@/components/facilitator/create-forum-dialog"

export default async function FacilitatorForumsPage() {
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
    <div className="min-h-screen bg-blue-900 flex flex-col">
      {/* Header Section with Greeting */}
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
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Forums</h1>
                <p className="text-gray-200">Manage community discussions</p>
              </div>
              <CreateForumDialog />
            </div>
          </div>
        </div>
      </div>

      <main className="relative -mt-16 z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 bg-white rounded-lg shadow-lg flex-grow">
        <div className="space-y-4">
          {forums?.map((forum) => (
            <Link
              key={forum.id}
              href={`/facilitator/forums/${forum.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
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
          <div className="text-center py-12">
            <p className="text-gray-500">No forums yet. Create your first forum to get started!</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto w-full bg-blue-900/30 backdrop-blur-sm border-t border-blue-700/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4 text-center">
            <h3 className="font-bold text-white text-lg">About MAKER</h3>
            <p className="text-sm text-blue-100 max-w-2xl mx-auto">
              A gamified learning platform for hands-on maker education, empowering participants to build, create, and innovate.
            </p>
            <div className="flex justify-center gap-8 text-sm text-blue-100">
              <a href="/facilitator/forums" className="hover:text-white transition-colors">Community Forums</a>
              <a href="/facilitator" className="hover:text-white transition-colors">Documentation</a>
            </div>
            <div className="text-sm text-blue-200 pt-4 border-t border-blue-700/30 mt-4">
              <p className="font-semibold">Department of Science and Technology</p>
              <p>Science and Technology Information Institute</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
