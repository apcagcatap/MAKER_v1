import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { QuestsTableWrapper } from "@/components/facilitator/quests-table-wrapper"

export default async function FacilitatorQuestsPage({
  searchParams,
}: {
  searchParams: { edit?: string }
}) {
  const supabase = await createClient()

  // Allow access without authentication during development
  // const {
  //   data: { user },
  // } = await supabase.auth.getUser()
  //
  // if (!user) {
  //   redirect("/auth/login")
  // }

  const { data: quests } = await supabase
    .from("quests")
    .select("*")
    .order("created_at", { ascending: false })

  const questToEdit = searchParams.edit
    ? quests?.find((q) => q.id === searchParams.edit)
    : null

  return <QuestsTableWrapper initialQuests={quests || []} initialEditingQuestId={questToEdit?.id || null} />
}
