import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminNav } from "@/components/layout/admin-nav"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Users } from "lucide-react"

export default async function AdminSkillsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch all skills with user counts
  const { data: skills } = await supabase
    .from("skills")
    .select(`
      *,
      user_skills(count)
    `)
    .order("name")

  return (
    <div className="min-h-screen bg-gradient-page-bg flex flex-col">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 flex-grow">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Skills Management</h1>
          </div>
          <Button className="bg-blue-600 text-white hover:bg-blue-700 shadow-lg">
            <Plus className="w-4 h-4 mr-2" />
            Add Skill
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills?.map((skill) => (
            <div
              key={skill.id}
              className="bg-card rounded-xl border p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="text-4xl">{skill.icon || "🎯"}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-card-foreground mb-1">{skill.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{skill.description}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{skill.user_skills?.[0]?.count || 0} users learning</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 text-interactive-primary hover:text-interactive-primary-hover">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {skills?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-blue-100">No skills yet. Add your first skill to get started!</p>
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
