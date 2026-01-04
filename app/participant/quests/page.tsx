import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ParticipantNav } from "@/components/layout/participant-nav"
import { QuestCard } from "@/components/participant/quest-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function QuestsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch all quests with skill details
  const { data: allQuests } = await supabase
    .from("quests")
    .select(`
      *,
      skill:skills(*)
    `)
    .eq("is_active", true)
    // Exclude drafts from being shown on the public participant page.
    .or('status.is.null,status.neq.Draft')
    .order("created_at", { ascending: false })

  // Fetch user's quest progress
  const { data: userQuests } = await supabase.from("user_quests").select("*").eq("user_id", user.id)

  const userQuestsMap = new Map(userQuests?.map((uq) => [uq.quest_id, uq]) || [])

  const notStarted = allQuests?.filter((q) => !userQuestsMap.has(q.id)) || []
  const inProgress = allQuests?.filter((q) => userQuestsMap.get(q.id)?.status === "in_progress") || []
  const completed = allQuests?.filter((q) => userQuestsMap.get(q.id)?.status === "completed") || []

  return (
    <div className="min-h-screen">
      <ParticipantNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Quests</h1>
          <p className="text-white">Complete quests to earn XP and level up your skills</p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Quests ({allQuests?.length || 0})</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress ({inProgress.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allQuests?.map((quest) => (
                <QuestCard key={quest.id} quest={quest} userQuest={userQuestsMap.get(quest.id)} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="in-progress">
            {inProgress.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inProgress.map((quest) => (
                  <QuestCard key={quest.id} quest={quest} userQuest={userQuestsMap.get(quest.id)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No quests in progress. Start a new quest to begin learning!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completed.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completed.map((quest) => (
                  <QuestCard key={quest.id} quest={quest} userQuest={userQuestsMap.get(quest.id)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No completed quests yet. Keep working on your active quests!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
