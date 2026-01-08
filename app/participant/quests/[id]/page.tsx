import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ParticipantNav } from "@/components/layout/participant-nav"
import { getQuestWithDetails, getUserQuestProgress } from "@/lib/actions/quests"
import { QuestContentView } from "@/components/participant/quest-content-view"

export default async function QuestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch quest with all details
  const quest = await getQuestWithDetails(id)
  
  if (!quest) {
    redirect("/participant/quests")
  }

  // Get user's progress on this quest
  const userProgress = await getUserQuestProgress(id, user.id)

  return (
    <div className="min-h-screen">
      <ParticipantNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <QuestContentView 
          quest={quest} 
          userProgress={userProgress}
        />
      </main>
    </div>
  )
}