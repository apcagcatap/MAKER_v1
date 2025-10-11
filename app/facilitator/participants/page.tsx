import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FacilitatorNav } from "@/components/layout/facilitator-nav"
import { ParticipantCard } from "@/components/facilitator/participant-card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

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
    <div className="min-h-screen bg-gray-50">
      <FacilitatorNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Participants</h1>
          <p className="text-gray-600">Monitor participant progress and engagement</p>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input placeholder="Search participants..." className="pl-10" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {participants?.map((participant) => (
            <ParticipantCard
              key={participant.id}
              participant={participant}
              questsCompleted={questCountMap.get(participant.id) || 0}
            />
          ))}
        </div>

        {participants?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No participants yet.</p>
          </div>
        )}
      </main>
    </div>
  )
}
