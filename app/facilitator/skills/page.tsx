import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FacilitatorNav } from "@/components/layout/facilitator-nav"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2 } from "lucide-react"

export default async function FacilitatorSkillsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch all skills
  const { data: skills } = await supabase.from("skills").select("*").order("name")

  return (
    <div className="min-h-screen bg-blue-900">
      <FacilitatorNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 bg-white rounded-lg shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Skills</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage available skills for participants</p>
          </div>
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Skill
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {skills?.map((skill) => (
            <div
              key={skill.id}
              className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-3 sm:gap-4 mb-4">
                <div className="text-3xl sm:text-4xl">{skill.icon || "🎯"}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 break-words">{skill.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{skill.description}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 bg-transparent text-sm sm:text-base h-9 sm:h-10">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent h-9 sm:h-10 px-3">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {skills?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm sm:text-base">No skills yet. Add your first skill to get started!</p>
          </div>
        )}
      </main>
    </div>
  )
}