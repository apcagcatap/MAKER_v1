import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { QuestsTableWrapper } from "@/components/facilitator/quests-table-wrapper"

export default async function FacilitatorQuestsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }> 
}) {

  const params = await searchParams
  
  const supabase = await createClient()

  const { data: quests } = await supabase
    .from("quests")
    .select("*")
    .order("created_at", { ascending: false })

  // ✅ Use params.edit instead of searchParams.edit
  const questToEdit = params.edit
    ? quests?.find((q) => q.id === params.edit)
    : null

  return <QuestsTableWrapper initialQuests={quests || []} initialEditingQuestId={questToEdit?.id || null} />
}