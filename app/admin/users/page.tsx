import { createClient } from "@/lib/supabase/server"
import { UserTable } from "@/components/admin/users/user-table"
import { UserToolbar } from "@/components/admin/users/user-toolbar"
import { CreateUserDialog } from "@/components/admin/users/create-user-dialog"

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; sort?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  
  // Start building the query
  let query = supabase.from("profiles").select("*")

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage facilitators, participants, and system access.</p>
        </div>
        <CreateUserDialog />
      </div>
      
      <UserToolbar />
      
      <UserTable users={users || []} sortOrder={params.sort} />
    </div>
  )
}
