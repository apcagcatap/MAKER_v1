import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FacilitatorNav } from "@/components/layout/facilitator-nav"
import { QuestManagementCard } from "@/components/facilitator/quest-management-card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function FacilitatorQuestsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch all quests with participant counts
  const { data: quests } = await supabase
    .from("quests")
    .select(`
      *,
      skill:skills(*),
      user_quests(count)
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-page-bg flex flex-col">
      <FacilitatorNav />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 flex-grow">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-on-accent mb-2">Active Quests</h1>
          </div>
          <Button className="bg-gradient-accent-warm hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Create Quest
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {quests?.map((quest) => (
            <QuestManagementCard key={quest.id} quest={quest} participantCount={quest.user_quests?.[0]?.count || 0} />
          ))}
        </div>

        {quests?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No active quests yet. Create your first quest to get started!</p>
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
