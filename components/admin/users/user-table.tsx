// components/admin/users/user-table.tsx
import Link from "next/link"
import { ArrowUpDown, Archive } from "lucide-react"
import { UserRowActions } from "./user-row-actions"

interface User {
  id: string
  email: string
  display_name: string | null
  role: string
  created_at: string
  avatar_url: string | null
  archived?: boolean
}

interface UserTableProps {
  users: User[]
  sortOrder?: string
}

export function UserTable({ users, sortOrder }: UserTableProps) {
  // Helper to toggle sort order
  const nextSort = sortOrder === "oldest" ? "newest" : "oldest"

  return (
    <div className="rounded-md border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
            <tr>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">
                <Link 
                  href={`?sort=${nextSort}`} 
                  className="flex items-center gap-1 hover:text-gray-700"
                >
                  Joined
                  <ArrowUpDown className="h-3 w-3" />
                </Link>
              </th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No users found matching your criteria.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className={`hover:bg-gray-50/50 transition-colors ${user.archived ? "opacity-60" : ""}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs ${user.archived ? "bg-gray-200 text-gray-400" : "bg-[#ED262A]/10 text-[#ED262A]"}`}>
                        {user.archived ? (
                          <Archive className="h-4 w-4" />
                        ) : user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          (user.display_name?.[0] || user.email[0]).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.display_name || "Unnamed User"}
                        </div>
                        <div className="text-gray-500 text-xs">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${
                          user.role === "admin"
                            ? "bg-[#ED262A]/10 text-[#ED262A]"
                            : user.role === "facilitator"
                            ? "bg-[#004A98]/10 text-[#004A98]"
                            : "bg-[#1E1E1E]/10 text-[#1E1E1E]"
                        }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.archived ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-800"}`}>
                      {user.archived ? "Archived" : "Active"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <UserRowActions userId={user.id} currentRole={user.role} archived={user.archived} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
