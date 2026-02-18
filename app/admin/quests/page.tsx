import "@/app/admin/admin.css"
import { Suspense } from "react"
import { getQuests } from "@/lib/actions/admin-quests"
import { QuestTable } from "@/components/admin/quests/quest-table"
import { QuestToolbar } from "@/components/admin/quests/quest-toolbar"
import { CreateQuestDialog } from "@/components/admin/quests/create-quest-dialog"

interface PageProps {
  searchParams: Promise<{
    q?: string
    status?: string
    sort?: string
    archived?: string
  }>
}

export default async function AdminQuestsPage({ searchParams }: PageProps) {
  const params = await searchParams
  // Extract and sanitize search params
  const query = typeof params.q === "string" ? params.q : ""
  const status = typeof params.status === "string" ? params.status : "all"
  const sort = typeof params.sort === "string" ? params.sort : "newest"
  const archived = typeof params.archived === "string" ? params.archived : "active"

  // Fetch data on the server
  const quests = await getQuests(query, status, sort, archived)

  return (
    <div className="admin-wrapper p-4 md:p-6">
      <div className="admin-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="admin-title">Quest Management</h1>
          <p className="admin-subtitle">
            Create, edit, and manage quests for users.
          </p>
        </div>
        <CreateQuestDialog />
      </div>

      <div className="space-y-4">
        {/* Search and Filter Toolbar */}
        <QuestToolbar />

        {/* Data Table with Suspense boundary */}
        <Suspense fallback={<div className="text-center py-10 text-gray-500">Loading quests...</div>}>
          <QuestTable quests={quests} sortOrder={sort} />
        </Suspense>
      </div>
    </div>
  )
}