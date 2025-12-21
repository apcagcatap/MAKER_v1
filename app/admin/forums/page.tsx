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
    <div className="min-h-screen bg-gradient-page-bg flex flex-col">
      {/* Header Section */}
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
          <AdminNav />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-24">
            <div className="flex items-center justify-between">
              <h1 className="text-5xl font-bold text-white">Forums Management</h1>
              <CreateForumDialog />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forums?.map((forum) => (
            <div
              key={forum.id}
              className="bg-card rounded-xl border p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col"
            >
              <Link href={`/admin/forums/${forum.id}`} className="block mb-3">
                <h3 className="text-xl font-bold text-card-foreground hover:text-interactive-primary transition-colors">
                  {forum.title}
                </h3>
              </Link>
              <p className="text-muted-foreground mb-4 flex-grow line-clamp-2">{forum.description}</p>

              <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>{forum.posts?.[0]?.count || 0} posts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-interactive-primary hover:text-interactive-primary-hover">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {forums?.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-on-blue">No forums yet. Create your first forum to get started!</p>
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
