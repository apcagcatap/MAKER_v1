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
    <div className="min-h-screen bg-brand-blue-dark flex flex-col">
      {/* Header Section with Greeting */}
      <div
        className="bg-gradient-to-br from-brand-blue-dark via-brand-blue-dark to-brand-blue-dark relative overflow-hidden"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forums?.map((forum) => (
            <Link
              key={forum.id}
              href={`/facilitator/forums/${forum.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all hover:-translate-y-1 flex flex-col"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">{forum.title}</h3>
              <p className="text-gray-600 mb-4 flex-grow line-clamp-2">{forum.description}</p>

              <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>{forum.posts?.[0]?.count || 0} posts</span>
                </div>
                <div className="bg-brand-blue-light rounded-lg p-2">
                  <MessageSquare className="w-5 h-5 text-brand-blue" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {forums?.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No forums yet. Create your first forum to get started!</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-brand-blue-dark/30 backdrop-blur-sm border-t border-brand-blue-hover/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4 text-center">
            <h3 className="font-semibold text-white text-base">About MAKER</h3>
            <p className="text-sm text-on-blue max-w-2xl mx-auto">
              A gamified learning platform for hands-on maker education, empowering participants to build, create, and innovate.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              <a href="/participant/forums" className="text-on-blue hover:text-white transition-colors text-sm">
                Forums
              </a>
              <a href="#" className="text-on-blue hover:text-white transition-colors text-sm">
                Documentation
              </a>
            </div>
            <p className="text-on-blue/70 text-xs pt-2">
              &copy; 2025 MAKER Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
