import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FacilitatorNav } from "@/components/layout/facilitator-nav"
import { MessageSquare, Clock } from "lucide-react"
import Link from "next/link"
import { CreateForumDialog } from "@/components/facilitator/create-forum-dialog"
import { DeleteForumButton } from "@/components/facilitator/delete-forum-button"
import { EditForumDialog } from "@/components/facilitator/edit-forum-dialog"

export default async function FacilitatorForumsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: forums } = await supabase
    .from("forums")
    .select(`
      *,
      posts:forum_posts(count)
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-blue-900">
      <div
        className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden"
        style={{ borderBottomLeftRadius: "3rem", borderBottomRightRadius: "3rem" }}
      >
        <div className="absolute inset-0 z-0">
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-8 sm:pb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Forums</h1>
                <p className="text-sm sm:text-base text-gray-200">Manage community discussions</p>
              </div>
              <CreateForumDialog />
            </div>
          </div>
        </div>
      </div>

      <main className="relative -mt-12 sm:-mt-16 z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 bg-white rounded-lg shadow-lg mb-10">
        <div className="space-y-4">
          {forums?.map((forum) => (
            <div key={forum.id} className="relative group">
              {/* Action Container */}
              <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-30 flex items-center gap-2">
                <EditForumDialog forum={forum} />
                <DeleteForumButton forumId={forum.id} />
              </div>

              <Link
                href={`/facilitator/forums/${forum.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-all hover:border-blue-200"
              >
                <div className="flex items-start gap-3 sm:gap-5">
                  <div className="hidden sm:flex bg-purple-100 rounded-xl p-3 sm:p-4 shrink-0">
                    <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  </div>

                  <div className="flex-1 pr-16 sm:pr-24 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 break-words">{forum.title}</h3>
                    <p className="text-gray-600 mb-3 sm:mb-4 line-clamp-2 text-sm sm:text-base">
                      {forum.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 text-xs sm:text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        <span>{forum.posts?.[0]?.count || 0} posts</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Created: {new Date(forum.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {forums?.length === 0 && (
          <div className="text-center py-16 sm:py-20">
            <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium text-sm sm:text-base">No forums yet.</p>
            <p className="text-gray-400 text-xs sm:text-sm">Create your first forum to get started!</p>
          </div>
        )}
      </main>
    </div>
  )
}