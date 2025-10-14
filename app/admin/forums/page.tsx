import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminNav } from "@/components/layout/admin-nav"
import { MessageSquare, Clock, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CreateForumDialog } from "@/components/admin/create-forum-dialog"

export default async function AdminForumsPage() {
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
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Forums Management</h1>
          </div>
          <CreateForumDialog />
        </div>

        <div className="space-y-4">
          {forums?.map((forum) => (
            <div
              key={forum.id}
              className="bg-card rounded-xl border p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Link href={`/admin/forums/${forum.id}`} className="block mb-2">
                    <h3 className="text-xl font-bold text-card-foreground hover:text-interactive-primary transition-colors">
                      {forum.title}
                    </h3>
                  </Link>
                  <p className="text-muted-foreground mb-4">{forum.description}</p>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
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

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="text-interactive-primary hover:text-interactive-primary-hover">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {forums?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-blue-100">No forums yet. Create your first forum to get started!</p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-blue-700/30 text-center">
          <div className="space-y-4">
            <h3 className="font-bold text-white text-lg">About MAKER</h3>
            <p className="text-sm text-blue-100 max-w-2xl mx-auto">
              A gamified learning platform for hands-on maker education, empowering participants to build, create, and innovate.
            </p>
            <div className="flex justify-center gap-8 text-sm text-blue-100">
              <a href="/admin/forums" className="hover:text-white transition-colors">Community Forums</a>
              <a href="/admin/settings" className="hover:text-white transition-colors">Documentation</a>
            </div>
            <div className="text-sm text-blue-200 pt-4 border-t border-blue-700/30 mt-4">
              <p className="font-semibold">Department of Science and Technology</p>
              <p>Science and Technology Information Institute</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
