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
  // Fetch learning resources for quest
  let learningResources: any[] = []
  try {
    const { data } = await supabase
      .from("learning_resources")
      .select("*")
      .eq("quest_id", questId)
      .order("order_index", { ascending: true })
    learningResources = data || []
  } catch (error) {
    console.error("Error fetching learning resources:", error)
  }

  // Fetch fastest completions for quest - TOP 10
  let fastestCompletions: any[] = []
  try {
    console.log('🔍 Fetching completions for quest:', questId)

    // DIRECT SQL-LIKE QUERY using LEFT JOIN
    const { data: rawData, error: queryError } = await supabase
      .rpc('get_fastest_completions', { 
        p_quest_id: questId,
        p_limit: 10 
      })

    if (queryError) {
      console.log('⚠️ RPC function not available, falling back to manual query')
      
      // FALLBACK: Manual query with separate fetches
      const { data: completionsData, error: completionsError } = await supabase
        .from("user_quests")
        .select("completed_at, completion_time, completion_time_seconds, user_id")
        .eq("quest_id", questId)
        .eq("status", "completed")
        .not("completed_at", "is", null)
        .not("completion_time_seconds", "is", null)
        .gt("completion_time_seconds", 0)
        .order("completion_time_seconds", { ascending: true })
        .limit(10)

      if (completionsError) {
        console.error("❌ Error fetching completions:", completionsError)
        return { learningResources, fastestCompletions: [] }
      }

      console.log('🏆 Completions found:', completionsData?.length || 0)

      if (completionsData && completionsData.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(completionsData.map((c: any) => c.user_id))]
        console.log('👥 Fetching profiles for user IDs:', userIds)
        
        // Fetch profiles with explicit columns
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", userIds)

        console.log('📊 Profiles fetched:', {
          requested: userIds.length,
          received: profilesData?.length || 0,
          error: profilesError,
          data: profilesData
        })

        if (profilesError) {
          console.error("❌ Profiles fetch error:", profilesError)
        }

        // Create lookup map
        const profilesMap = new Map<string, any>()
        if (profilesData) {
          profilesData.forEach((p: any) => {
            profilesMap.set(p.id, p)
          })
        }

        console.log('🗺️ Profiles map size:', profilesMap.size)
        console.log('🗺️ Profiles map entries:', Array.from(profilesMap.entries()))

        // Map to final format
        fastestCompletions = completionsData.map((completion: any) => {
          const profile = profilesMap.get(completion.user_id)
          const totalSeconds = completion.completion_time_seconds ?? (completion.completion_time * 60)
          
          console.log('🔗 Mapping user:', {
            user_id: completion.user_id,
            has_profile: !!profile,
            display_name: profile?.display_name || 'NOT FOUND',
            avatar: profile?.avatar_url || 'NONE',
            seconds: totalSeconds
          })

          return {
            user: {
              id: completion.user_id,
              full_name: profile?.display_name || "Unknown User",
              avatar_url: profile?.avatar_url || null
            },
            completed_at: completion.completed_at,
            duration_seconds: totalSeconds,
          }
        })

        console.log('✅ Final completions array:', fastestCompletions.length)
        console.log('✅ First completion:', fastestCompletions[0])
      }
    } else {
      // Use RPC result
      console.log('✅ Using RPC result:', rawData)
      fastestCompletions = rawData?.map((row: any) => ({
        user: {
          id: row.user_id,
          full_name: row.display_name || "Unknown User",
          avatar_url: row.avatar_url || null
        },
        completed_at: row.completed_at,
        duration_seconds: row.completion_time_seconds,
      })) || []
    }

  } catch (error) {
    console.error("❌ Unexpected error in getQuestData:", error)
  }

  console.log('🎯 Returning fastestCompletions count:', fastestCompletions.length)
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

  // Fetch data for ALL quests
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
        {questsWithData.length > 0 ? (
          <div className="space-y-16 mb-16">
            {questsWithData.map((item, index) => (
              <div key={item.quest.id}>
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