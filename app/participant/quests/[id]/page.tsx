import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ParticipantNav } from "@/components/layout/participant-nav"
import type { Quest, UserQuest, QuestPage, Task, LearningResource } from "@/lib/types"
import QuestFlow from "@/components/participant/quest-flow"

interface QuestFlowPageProps {
  params: { id: string }
}

export default async function QuestFlowPage({ params }: QuestFlowPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const questId = params.id

  const { data: quest } = await supabase
    .from("quests")
    .select("*, skill:skills(*)")
    .eq("id", questId)
    .single<Quest & { skill: any }>()

  if (!quest) redirect("/participant/quests")

  const { data: existingUserQuest } = await supabase
    .from("user_quests")
    .select("*")
    .eq("user_id", user.id)
    .eq("quest_id", questId)
    .maybeSingle<UserQuest>()

  const { data: pageNumbers } = await supabase
    .from("quest_pages")
    .select("page_number")
    .eq("quest_id", questId)
    .order("page_number", { ascending: true })

  const pageNumberList = (pageNumbers || []).map((p: any) => p.page_number)

  const [{ data: pages }, { data: tasks }, { data: resources }] = await Promise.all([
    supabase
      .from("quest_pages")
      .select("*")
      .eq("quest_id", questId)
      .order("page_number", { ascending: true })
      .returns<QuestPage[]>(),
    pageNumberList.length
      ? supabase.from("tasks").select("*").in("page_number", pageNumberList).returns<Task[]>()
      : Promise.resolve({ data: [] as Task[] }),
    supabase.from("learning_resource").select("*").eq("quest_id", questId).returns<LearningResource[]>(),
  ])

  return (
    <div className="min-h-screen">
      <ParticipantNav />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <QuestFlow
          quest={quest}
          initialUserQuest={existingUserQuest || null}
          pages={(pages as QuestPage[]) || []}
          tasks={(tasks as Task[]) || []}
          resources={(resources as LearningResource[]) || []}
        />
      </main>
    </div>
  )
}
