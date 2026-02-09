import Link from "next/link"
import { ArrowUpDown, Archive } from "lucide-react"
import { QuestRowActions } from "./quest-row-actions"

// Define a compatible interface for the table
interface Quest {
  id: string
  title: string
  description: string | null
  difficulty: string | null
  skill_id: string | null
  is_active: boolean
  badge_image_url: string | null
  certificate_image_url: string | null
  materials_needed: string | null
  general_instructions: string | null
  levels: any
  scheduled_date: string | null
  status: string | null
  xp_reward: string | null
  created_at: string
  archived?: boolean
}

interface QuestTableProps {
  quests: Quest[]
  sortOrder?: string
}

export function QuestTable({ quests, sortOrder }: QuestTableProps) {
  const nextSort = sortOrder === "oldest" ? "newest" : "oldest"

  return (
    <div className="rounded-md border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
            <tr>
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Difficulty</th>
              <th className="px-6 py-3">XP</th>
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
            {quests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No quests found.
                </td>
              </tr>
            ) : (
              quests.map((quest) => (
                <tr key={quest.id} className={`hover:bg-gray-50/50 transition-colors ${quest.archived ? "opacity-60" : ""}`}>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      {quest.archived && <Archive className="h-4 w-4 text-gray-400 shrink-0" />}
                      {quest.title}
                    </div>
                  </td>
                  <td className="px-6 py-4">{quest.difficulty}</td>
                  <td className="px-6 py-4">{quest.xp_reward}</td>
                  <td className="px-6 py-4">
                    {quest.archived ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        Archived
                      </span>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${quest.status === 'Published' ? 'bg-green-100 text-green-800' : quest.status === 'Archived' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {quest.status || 'Draft'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{new Date(quest.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <QuestRowActions quest={quest} />
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