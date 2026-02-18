import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FacilitatorNav } from "@/components/layout/facilitator-nav"
import { ParticipantsList } from "@/components/facilitator/participants-list"
import { ProgressOverview } from "@/components/facilitator/progress-overview"

export default async function FacilitatorParticipantsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch all participants
  const { data: participants } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "participant")
    .order("created_at", { ascending: false })

  // Fetch all published quests count
  const { count: totalQuests } = await supabase
    .from("quests")
    .select("*", { count: "exact", head: true })
    .eq("status", "Published")
    .eq("is_active", true)

  // Fetch all user quest data
  const participantIds = participants?.map((p) => p.id) || []
  const { data: allUserQuests } = await supabase
    .from("user_quests")
    .select("*")
    .in("user_id", participantIds)

  // Calculate stats for each participant
  const participantStats = participants?.map((participant) => {
    const userQuests = allUserQuests?.filter((uq) => uq.user_id === participant.id) || []
    const completed = userQuests.filter((uq) => uq.status === "completed").length
    const inProgress = userQuests.filter((uq) => uq.status === "in_progress").length
    
    // Check if at risk (has quests in progress with low progress)
    const atRisk = userQuests.some(
      (uq) => uq.status === "in_progress" && uq.progress < 30
    )

    return {
      participant,
      questsCompleted: completed,
      questsInProgress: inProgress,
      totalQuests: totalQuests || 0,
      isAtRisk: atRisk,
    }
  })

  // Calculate overview stats
  const activeParticipants = participantStats?.filter(
    (p) => p.questsInProgress > 0 || p.questsCompleted > 0
  ).length || 0

  const totalCompletions = participantStats?.reduce((sum, p) => sum + p.questsCompleted, 0) || 0
  const possibleCompletions = (participants?.length || 0) * (totalQuests || 1)
  const completionRate = possibleCompletions > 0 
    ? Math.round((totalCompletions / possibleCompletions) * 100)
    : 0

  const totalProgress = allUserQuests
    ?.filter((uq) => uq.status === "in_progress")
    .reduce((sum, uq) => sum + (uq.progress || 0), 0) || 0
  const inProgressCount = allUserQuests?.filter((uq) => uq.status === "in_progress").length || 1
  const averageProgress = Math.round(totalProgress / inProgressCount) || 0

  const atRiskCount = participantStats?.filter((p) => p.isAtRisk).length || 0

  const overviewStats = {
    totalParticipants: participants?.length || 0,
    activeParticipants,
    completionRate,
    averageProgress,
    atRisk: atRiskCount,
  }

  // Create questCountMap for the ParticipantsList component
  const questCountMap = new Map<string, number>()
  participantStats?.forEach((stat) => {
    questCountMap.set(stat.participant.id, stat.questsCompleted)
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Add blue background wrapper for navbar */}
      <div className="bg-blue-900">
        <FacilitatorNav />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">Participant Progress</h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600">Monitor participant progress and identify who needs help</p>
        </div>

        {/* Progress Overview */}
        <ProgressOverview stats={overviewStats} />

        {/* Participants List */}
        <ParticipantsList 
          participants={participants || []} 
          participantStats={participantStats || []}
          questCountMap={questCountMap}
        />
      </main>
    </div>
  )
}