import { MessageSquare, ArrowUpDown, Archive } from "lucide-react"
import Link from "next/link"
import { ForumRowActions } from "./forum-row-actions"
import type { Forum } from "./forum-form"

interface ForumTableProps {
  forums: (Forum & { archived?: boolean })[]
  sortOrder?: string
}

export function ForumTable({ forums, sortOrder }: ForumTableProps) {
  const nextSort = sortOrder === "oldest" ? "newest" : "oldest"

  return (
    <div className="rounded-md border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
            <tr>
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">
                <Link
                  href={`?sort=${nextSort}`}
                  className="flex items-center gap-1 hover:text-gray-700"
                >
                  Created
                  <ArrowUpDown className="h-3 w-3" />
                </Link>
              </th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {forums.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <MessageSquare className="w-8 h-8 text-gray-300" />
                    <p>No forums found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              forums.map((forum) => (
                <tr key={forum.id} className={`hover:bg-gray-50/50 transition-colors group ${forum.archived ? "opacity-60" : ""}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${forum.archived ? "bg-gray-200 text-gray-400" : "bg-[#ED262A]/10 text-[#ED262A]"}`}>
                        {forum.archived ? <Archive className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                      </div>
                      <Link href={`/admin/forums/${forum.id}`} className="font-medium text-gray-900 hover:text-[#ED262A] transition-colors hover:underline">
                        {forum.title}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 max-w-md truncate">
                    {forum.description || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${forum.archived ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-800"}`}>
                      {forum.archived ? "Archived" : "Active"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                    {new Date(forum.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ForumRowActions forum={forum} />
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
