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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 flex-grow">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-on-accent mb-2">Active Quests</h1>
          </div>
          <Button className="bg-gradient-accent-warm hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Create Quest
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      <footer className="mt-auto w-full bg-blue-900/30 backdrop-blur-sm border-t border-blue-700/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4 text-center">
            <h3 className="font-bold text-white text-lg">About MAKER</h3>
            <p className="text-sm text-blue-100 max-w-2xl mx-auto">
              A gamified learning platform for hands-on maker education, empowering participants to build, create, and innovate.
            </p>
            <div className="flex justify-center gap-8 text-sm text-blue-100">
              <a href="/facilitator/forums" className="hover:text-white transition-colors">Community Forums</a>
              <a href="/facilitator" className="hover:text-white transition-colors">Documentation</a>
            </div>
            <div className="text-sm text-blue-200 pt-4 border-t border-blue-700/30 mt-4">
              <p className="font-semibold">Department of Science and Technology</p>
              <p>Science and Technology Information Institute</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
