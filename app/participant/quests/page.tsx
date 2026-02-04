import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ParticipantNav } from "@/components/layout/participant-nav"
import { QuestCard } from "@/components/participant/quest-card"
import { FeaturedQuestCard } from "@/components/participant/featured-quest-card"
import { FastestCompletions } from "@/components/participant/fastest-completions"
import { ResourceCard } from "@/components/participant/resource-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPublishedQuests } from "@/lib/actions/quests"

async function getQuestData(supabase: any, questId: string) {
  // Fetch learning resources for quest (will be empty if table doesn't exist yet)
  let learningResources: any[] = []
  try {
    const { data } = await supabase
      .from("learning_resources")
      .select("*")
      .eq("quest_id", questId)
      .order("order_index", { ascending: true })
    learningResources = data || []
  } catch (error) {
    // Table doesn't exist yet - this is expected
  }

  // Fetch fastest completions for quest
  let fastestCompletions: any[] = []
  try {
    const { data: completionsData } = await supabase
      .from("user_quests")
      .select(`
        completed_at,
        started_at,
        completion_time,
        user_id,
        profiles!user_quests_user_id_fkey (
          id,
          display_name,
          avatar_url
        )
      `)
      .eq("quest_id", questId)
      .eq("status", "completed")
      .not("completed_at", "is", null)
      .not("completion_time", "is", null)
      .order("completion_time", { ascending: true })
      .limit(3)

    // Map completions to the format expected by FastestCompletions component
    fastestCompletions = completionsData?.map((completion: any) => {
      return {
        user: {
          id: completion.user_id,
          full_name: completion.profiles?.display_name || "Unknown User",
          avatar_url: completion.profiles?.avatar_url || null
        },
        completed_at: completion.completed_at,
        duration_minutes: completion.completion_time || undefined,
      }
    }) || []
  } catch (error) {
    console.log("Error fetching completions:", error)
  }

  return { learningResources, fastestCompletions }
}

export default async function QuestsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const allQuests = await getPublishedQuests()
  
  console.log("🚀 Total published quests:", allQuests?.length)

  // Fetch user's quest progress
  const { data: userQuests } = await supabase.from("user_quests").select("*").eq("user_id", user.id)

  const userQuestsMap = new Map(userQuests?.map((uq) => [uq.quest_id, uq]) || [])

  const notStarted = allQuests?.filter((q) => !userQuestsMap.has(q.id)) || []
  const inProgress = allQuests?.filter((q) => userQuestsMap.get(q.id)?.status === "in_progress") || []
  const completed = allQuests?.filter((q) => userQuestsMap.get(q.id)?.status === "completed") || []

  // Fetch data for all quests
  const questsWithData = await Promise.all(
    (allQuests || []).map(async (quest) => {
      const data = await getQuestData(supabase, quest.id)
      return {
        quest,
        ...data,
        userQuest: userQuestsMap.get(quest.id)
      }
    })
  )

  return (
    <div className="min-h-screen">
      <ParticipantNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured Quest Sections - One for each published quest */}
        {questsWithData.length > 0 ? (
          <div className="space-y-16 mb-16">
            {questsWithData.map((item, index) => (
              <div key={item.quest.id}>
                {/* Featured Quest Section */}
                <div className="mb-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2">
                      <FeaturedQuestCard
                        quest={item.quest}
                        userQuest={item.userQuest}
                      />
                    </div>
                    <div>
                      <FastestCompletions completions={item.fastestCompletions} />
                    </div>
                  </div>

                  {/* Explore Resources Section - Only shows if learning_resources table exists and has data */}
                  {item.learningResources.length > 0 && (
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-6">Explore Resources</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {item.learningResources.map((resource: any) => (
                          <ResourceCard key={resource.id} resource={resource} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Separator between quests (not on last item) */}
                {index < questsWithData.length - 1 && (
                  <div className="border-t border-white/10 pt-8"></div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 mb-16">
            <div className="w-16 h-16 bg-blue-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎯</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              No Quests Available
            </h3>
            <p className="text-blue-200">
              Check back soon for exciting new challenges!
            </p>
          </div>
        )}
      </main>
    </div>
  )
}