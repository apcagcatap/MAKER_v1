import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { QuestsTable } from "@/components/facilitator/quests-table"

export default async function FacilitatorQuestsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: quests } = await supabase
    .from("quests")
    .select("*")
    .order("created_at", { ascending: false })

  return <QuestsTable initialQuests={quests || []} />
}
