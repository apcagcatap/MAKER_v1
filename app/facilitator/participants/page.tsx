import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FacilitatorNav } from "@/components/layout/facilitator-nav"
import { ParticipantsList } from "@/components/facilitator/participants-list"

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

  // Fetch quest completion counts for each participant
  const participantIds = participants?.map((p) => p.id) || []
  const { data: questCounts } = await supabase
    .from("user_quests")
    .select("user_id")
    .eq("status", "completed")
    .in("user_id", participantIds)

  const questCountMap = new Map<string, number>()
  questCounts?.forEach((qc) => {
    questCountMap.set(qc.user_id, (questCountMap.get(qc.user_id) || 0) + 1)
  })

  return (
    <div className="min-h-screen bg-blue-900">
      <FacilitatorNav />

      <div className="relative bg-blue-900 text-white py-16">
      </div>

      <main className="relative -mt-16 z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white rounded-lg shadow-lg">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Participants</h1>
              <p className="text-gray-600">Monitor participant progress and engagement</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-purple-500 text-white px-6 py-4 rounded-xl shadow-lg">
              <p className="text-sm opacity-90">Total Participants</p>
              <p className="text-4xl font-bold">{participants?.length || 0}</p>
            </div>
          </div>
        </div>

        <ParticipantsList 
          participants={participants || []} 
          questCountMap={questCountMap}
        />
      </main>
    </div>
  )
}