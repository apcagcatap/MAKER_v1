import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FacilitatorNav } from "@/components/layout/facilitator-nav"
import { ArrowLeft, Trash2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function FacilitatorForumDetailPage({ params }: { params: { id: string } }) {
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

  // Fetch forum posts with user profiles
  const { data: posts } = await supabase
    .from("forum_posts")
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq("forum_id", id)
    .order("created_at", { ascending: false })

  if (!forum) {
    redirect("/facilitator/forums")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <FacilitatorNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/facilitator/forums"
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Forums
        </Link>

        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{forum.title}</h1>
          <p className="text-gray-600">{forum.description}</p>
        </div>

        <div className="space-y-4">
          {posts?.map((post) => (
            <div key={post.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {post.profile?.display_name?.[0] || "U"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {post.profile?.display_name || "Unknown User"}
                      </span>
                      <span className="text-sm text-gray-500">{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-gray-700">{post.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {posts?.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">No posts yet in this forum.</p>
          </div>
        )}
      </main>
    </div>
  )
}
