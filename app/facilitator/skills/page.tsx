import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FacilitatorNav } from "@/components/layout/facilitator-nav"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Users } from "lucide-react"
import Image from "next/image"

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
    <div
      className="min-h-screen bg-gradient-page-bg relative flex flex-col"
      style={{
        backgroundImage: `url("/navbarBg.png")`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <FacilitatorNav />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        <div className="mb-12 text-center">
          <div className="relative flex justify-center mb-8">
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
              <Image src="/hismarty.png" alt="Owl" width={200} height={200} className="object-contain" />
            </div>
            <h1 className="text-5xl font-bold text-white drop-shadow-lg pt-48">
              Skills
            </h1>
          </div>
        </div>
      </div>

      <main className="relative z-20 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex-grow pb-8">
        <div className="flex items-center justify-end mb-8">
          <Button className="bg-brand-blue text-white hover:bg-brand-blue-hover shadow-lg">
            <Plus className="w-4 h-4 mr-2" />
            Add Skill
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {skills?.map((skill) => (
            <div
              key={skill.id}
              className="bg-card rounded-xl border p-8 hover:shadow-lg transition-shadow"
            >
              {/* Horizontal layout on desktop */}
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="text-6xl lg:text-5xl flex-shrink-0">{skill.icon || "🎯"}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-card-foreground mb-2">{skill.name}</h3>
                  <p className="text-base text-muted-foreground">{skill.description}</p>
                </div>
                <div className="lg:w-48 flex-shrink-0 flex gap-2">
                  <Button variant="outline" className="flex-1 text-interactive-primary hover:text-interactive-primary-hover h-11">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent h-11 px-4">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {skills?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-on-blue">No skills yet. Add your first skill to get started!</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto w-full bg-brand-blue-dark/30 backdrop-blur-sm border-t border-brand-blue-hover/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4 text-center">
            <h3 className="font-bold text-white text-lg">About MAKER</h3>
            <p className="text-sm text-on-blue max-w-2xl mx-auto">
              A gamified learning platform for hands-on maker education, empowering participants to build, create, and innovate.
            </p>
            <p className="text-on-blue/70 text-xs pt-2">
              &copy; 2025 MAKER Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
