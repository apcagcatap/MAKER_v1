import "@/app/admin/admin.css"
import { Suspense } from "react"
import { getForums } from "@/lib/actions/admin-forums"
import { ForumTable } from "@/components/admin/forums/forum-table"
import { ForumToolbar } from "@/components/admin/forums/forum-toolbar"
import { CreateForumDialog } from "@/components/admin/forums/create-forum-dialog"

interface PageProps {
  searchParams: Promise<{
    q?: string
    sort?: string
  }>
}

export default async function AdminForumsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const query = typeof params.q === "string" ? params.q : ""
  const sort = typeof params.sort === "string" ? params.sort : "newest"

  const forums = await getForums(query, sort)

  return (
    <div className="admin-wrapper p-6 md:p-8 max-w-7xl mx-auto">
      <div className="admin-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="admin-title">Forum Management</h1>
          <p className="admin-subtitle">
            Manage discussion forums and categories for the community.
          </p>
        </div>
        <CreateForumDialog />
      </div>

      <div className="space-y-6">
        <Suspense fallback={null}>
          <ForumToolbar />
        </Suspense>

        <Suspense fallback={<div className="text-center py-10 text-gray-500">Loading forums...</div>}>
          <ForumTable forums={forums || []} sortOrder={sort} />
        </Suspense>
      </div>
    </div>
  )
}