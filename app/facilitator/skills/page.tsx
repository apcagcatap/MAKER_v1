import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FacilitatorNav } from "@/components/layout/facilitator-nav"
import { SkillCard } from "@/components/facilitator/skill-card"
import { CreateSkillButton } from "@/components/facilitator/create-skill-button"

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
      <div
        className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden"
        style={{ borderBottomLeftRadius: "2rem", borderBottomRightRadius: "2rem" }}
      >
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url('/navbarBg.png')`,
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderBottomLeftRadius: "2rem",
              borderBottomRightRadius: "2rem",
            }}
          />
        </div>
        <div className="relative z-10">
          <FacilitatorNav />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 md:pt-8 pb-6 sm:pb-8 md:pb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 md:mb-8 gap-3 sm:gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">Skills</h1>
                <p className="text-xs sm:text-sm md:text-base text-gray-200">Manage available skills for participants</p>
              </div>
              {/* Replaced static button with functional component */}
              <CreateSkillButton />
            </div>
          </div>
        </div>
      </div>

      <main className="relative -mt-8 sm:-mt-12 md:-mt-16 z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 bg-white rounded-lg shadow-lg mb-6 sm:mb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {skills?.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>

        {skills?.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <p className="text-gray-500 text-sm sm:text-base">No skills yet. Add your first skill to get started!</p>
          </div>
        )}
      </main>
    </div>
  )
}