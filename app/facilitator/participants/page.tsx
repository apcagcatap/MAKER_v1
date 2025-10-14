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
    <div className="min-h-screen bg-brand-blue-dark flex flex-col">
      <FacilitatorNav />

      <div className="relative bg-brand-blue-dark text-white py-16">
      </div>

      <main className="relative -mt-16 z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 bg-white rounded-lg shadow-lg flex-grow">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Participants</h1>
          <p className="text-gray-600">Monitor participant progress and engagement</p>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input placeholder="Search participants..." className="pl-10 bg-white text-gray-900 placeholder:text-gray-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

      {/* Footer */}
      <footer className="mt-auto bg-brand-blue-dark/30 backdrop-blur-sm border-t border-brand-blue-hover/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4 text-center">
            <h3 className="font-semibold text-white text-base">About MAKER</h3>
            <p className="text-sm text-on-blue max-w-2xl mx-auto">
              A gamified learning platform for hands-on maker education, empowering participants to build, create, and innovate.
            </p>
            <p className="text-on-blue/70 text-xs pt-2">
              &copy; 2025 MAKER Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
