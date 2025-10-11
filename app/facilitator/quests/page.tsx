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
    <div className="min-h-screen bg-gray-50">
      <FacilitatorNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Active Quests</h1>
            <p className="text-gray-600">Manage and monitor all active quests</p>
          </div>
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
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
    </div>
  )
}
