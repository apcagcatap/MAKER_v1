"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { FacilitatorNav } from "@/components/layout/facilitator-nav"
import { CreateQuestModal } from "@/components/facilitator/create-quest-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Trash2 } from "lucide-react"
import { deleteQuest, publishQuest, archiveQuest } from "@/lib/actions/quests"
import { toast } from "sonner"

interface Quest {
  id: string
  title: string
  description: string
  difficulty: string
  scheduled_date: string | null
  badge_image_url: string | null
  certificate_image_url: string | null
  status: string
  materials_needed: string
  general_instructions: string
  levels: Array<{ title: string; description: string }>
  created_at: string
}

export function QuestsTable({ initialQuests }: { initialQuests: Quest[] }) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [quests, setQuests] = useState<Quest[]>(initialQuests || [])
  const [isLoading, setIsLoading] = useState(false)

  // Filter quests based on search query
  const filteredQuests = useMemo(() => {
    if (!searchQuery.trim()) return quests

    const query = searchQuery.toLowerCase()
    return quests.filter((quest) =>
      quest.title.toLowerCase().includes(query) ||
      quest.description.toLowerCase().includes(query)
    )
  }, [quests, searchQuery])

  const handleOpenModal = (quest?: Quest) => {
    setEditingQuest(quest || null)
    setModalOpen(true)
  }

  const handleDeleteQuest = async (questId: string) => {
    if (!confirm("Are you sure you want to delete this quest?")) return

    setIsLoading(true)
    try {
      await deleteQuest(questId)
      setQuests(quests.filter((q) => q.id !== questId))
      toast.success("Quest deleted successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete quest")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublishQuest = async (questId: string) => {
    setIsLoading(true)
    try {
      await publishQuest(questId)
      setQuests(
        quests.map((q) =>
          q.id === questId ? { ...q, status: "published" } : q
        )
      )
      toast.success("Quest published successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to publish quest")
    } finally {
      setIsLoading(false)
    }
  }

  const handleArchiveQuest = async (questId: string) => {
    setIsLoading(true)
    try {
      await archiveQuest(questId)
      setQuests(
        quests.map((q) =>
          q.id === questId ? { ...q, status: "archived" } : q
        )
      )
      toast.success("Quest archived successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to archive quest")
    } finally {
      setIsLoading(false)
    }
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setEditingQuest(null)
  }

  return (
    <div className="min-h-screen bg-[#004A98]">
      {/* Header with background image */}
      <div
        className="relative overflow-hidden"
        style={{
          backgroundImage: `url('/navbarBg.png')`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderBottomLeftRadius: "190px",
          borderBottomRightRadius: "190px",
        }}
      >
        <div className="relative z-10">
          <FacilitatorNav />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
            <div className="flex items-center justify-center">
              <h1 className="text-5xl font-light text-white">Quests</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Add Button */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="search"
              placeholder="Search quests by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-14 bg-white border-gray-300"
            />
          </div>
          <Button
            onClick={() => handleOpenModal()}
            className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold whitespace-nowrap"
          >
            Add New Quests
          </Button>
        </div>

        {/* Quests Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="px-6 py-4 text-center text-sm font-light text-black">Badge</th>
                <th className="px-6 py-4 text-center text-sm font-light text-black">Certificate</th>
                <th className="px-6 py-4 text-center text-sm font-light text-black">Difficulty</th>
                <th className="px-6 py-4 text-center text-sm font-light text-black">Scheduled For</th>
                <th className="px-6 py-4 text-center text-sm font-light text-black">Status</th>
                <th className="px-6 py-4 text-center text-sm font-light text-black">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuests?.map((quest) => (
                <tr key={quest.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-sm font-light text-black text-center">{quest.title}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto py-2 px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-light"
                      >
                        View Badge
                      </Button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto py-2 px-4 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg text-sm font-light"
                    >
                      View Certificate
                    </Button>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-light text-black">
                    {quest.difficulty || "Beginner - Intermediate"}
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-light text-black">
                    {quest.scheduled_date ? new Date(quest.scheduled_date).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`text-sm font-light ${
                        quest.status === "published"
                          ? "text-green-600"
                          : quest.status === "draft"
                            ? "text-yellow-600"
                            : "text-gray-600"
                      }`}
                    >
                      {quest.status === "published"
                        ? "Published"
                        : quest.status === "draft"
                          ? "Draft"
                          : quest.status || "Draft"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-2">
                      <Button
                        onClick={() => handleOpenModal(quest)}
                        disabled={isLoading}
                        variant="ghost"
                        size="sm"
                        className="h-auto py-2 px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-light w-20"
                      >
                        Edit
                      </Button>
                      {quest.status === "published" ? (
                        <Button
                          onClick={() => handleArchiveQuest(quest.id)}
                          disabled={isLoading}
                          variant="ghost"
                          size="sm"
                          className="h-auto py-2 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-light w-20"
                        >
                          Archive
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handlePublishQuest(quest.id)}
                          disabled={isLoading}
                          variant="ghost"
                          size="sm"
                          className="h-auto py-2 px-4 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg text-sm font-light w-20"
                        >
                          Publish
                        </Button>
                      )}
                      <button
                        onClick={() => handleDeleteQuest(quest.id)}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredQuests?.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchQuery ? "No quests match your search." : "No quests yet. Create your first quest to get started!"}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Quest Modal */}
      <CreateQuestModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        editingQuest={editingQuest || undefined}
      />
    </div>
  )
}
