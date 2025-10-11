import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminNav } from "@/components/layout/admin-nav"
import { QuestManagementCard } from "@/components/facilitator/quest-management-card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function AdminQuestsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch all quests
  const { data: allQuests } = await supabase
    .from("quests")
    .select(`
      *,
      skill:skills(*),
      user_quests(count)
    `)
    .order("created_at", { ascending: false })

  const activeQuests = allQuests?.filter((q) => q.is_active) || []
  const inactiveQuests = allQuests?.filter((q) => !q.is_active) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Quest Management</h1>
            <p className="text-gray-600">Manage all quests in the system</p>
          </div>
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Quest
          </Button>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="active">Active ({activeQuests.length})</TabsTrigger>
            <TabsTrigger value="inactive">Inactive ({inactiveQuests.length})</TabsTrigger>
            <TabsTrigger value="all">All ({allQuests?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeQuests.map((quest) => (
                <QuestManagementCard
                  key={quest.id}
                  quest={quest}
                  participantCount={quest.user_quests?.[0]?.count || 0}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="inactive">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inactiveQuests.map((quest) => (
                <QuestManagementCard
                  key={quest.id}
                  quest={quest}
                  participantCount={quest.user_quests?.[0]?.count || 0}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allQuests?.map((quest) => (
                <QuestManagementCard
                  key={quest.id}
                  quest={quest}
                  participantCount={quest.user_quests?.[0]?.count || 0}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
