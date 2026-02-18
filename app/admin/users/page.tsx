import "@/app/admin/admin.css"
import { createClient } from "@/lib/supabase/server"
import { UserTable } from "@/components/admin/users/user-table"
import { UserToolbar } from "@/components/admin/users/user-toolbar"
import { CreateUserDialog } from "@/components/admin/users/create-user-dialog"

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; sort?: string; archived?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  
  // Start building the query
  let query = supabase.from("profiles").select("*")

  // Filter by archive status
  const archivedFilter = params.archived || "active"
  if (archivedFilter === "archived") {
    query = query.eq("archived", true)
  } else if (archivedFilter === "all") {
    // Show everything
  } else {
    // Default: only show non-archived
    query = query.eq("archived", false)
  }

  // Apply Search
  if (params.q) {
    // Search in email or display_name
    query = query.or(`email.ilike.%${params.q}%,display_name.ilike.%${params.q}%`)
  }

  // Apply Role Filter
  if (params.role && params.role !== "all") {
    query = query.eq("role", params.role)
  }

  // Apply Sorting
  if (params.sort === "oldest") {
    query = query.order("created_at", { ascending: true })
  } else {
    // Default to newest first
    query = query.order("created_at", { ascending: false })
  }

  const { data: users } = await query

  return (
    <div className="admin-wrapper p-4 md:p-6">
      <div className="admin-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="admin-title">User Management</h1>
          <p className="admin-subtitle">Manage facilitators, participants, and system access.</p>
        </div>
        <CreateUserDialog />
      </div>
      
      <div className="space-y-4">
        <UserToolbar />
        <UserTable users={users || []} sortOrder={params.sort} />
      </div>
    </div>
  )
}
