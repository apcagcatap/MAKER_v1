import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminNav } from "@/components/layout/admin-nav"
import { UserTableRow } from "@/components/admin/user-table-row"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, Filter } from "lucide-react"

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch all users
  const { data: users } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-page-bg flex flex-col">
      <AdminNav />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 flex-grow">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">User Management</h1>
          </div>
          <Button className="bg-brand-blue hover:bg-brand-blue-hover text-white shadow-lg">
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input placeholder="Search users..." className="pl-10 bg-white text-gray-900 placeholder:text-gray-400" />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        <div className="bg-card rounded-xl border shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-8 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">
                  User
                </th>
                <th className="px-8 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">
                  Role
                </th>
                <th className="px-8 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">
                  Level
                </th>
                <th className="px-8 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">XP</th>
                <th className="px-8 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">
                  Joined
                </th>
                <th className="px-8 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user) => (
                <UserTableRow key={user.id} user={user} />
              ))}
            </tbody>
          </table>
        </div>

        {users?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-on-blue">No users found.</p>
          </div>
        )}
      </main>

        {/* Footer */}
        <footer className="mt-auto w-full bg-brand-blue-dark/30 backdrop-blur-sm border-t border-brand-blue-hover/30 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="space-y-4 text-center">
            <h3 className="font-bold text-white text-lg">About MAKER</h3>
            <p className="text-sm text-on-blue max-w-2xl mx-auto">
              A gamified learning platform for hands-on maker education, empowering participants to build, create, and innovate.
            </p>
            <div className="text-sm text-on-blue pt-4 border-t border-brand-blue-hover/30 mt-4">
              <p className="font-semibold">Department of Science and Technology</p>
              <p>Science and Technology Information Institute</p>
            </div>
          </div></div></footer>
    </div>
  )
}
