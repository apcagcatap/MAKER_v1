"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FacilitatorNav } from "@/components/layout/facilitator-nav"
import { CreateQuestModal } from "@/components/facilitator/create-quest-modal"
import { ImageViewerModal } from "@/components/facilitator/image-viewer-modal"
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

interface QuestsTableProps {
  initialQuests: Quest[]
  initialEditingQuest?: Quest | null
  initialModalOpen?: boolean
  onQuestsUpdated?: (quests: Quest[]) => void
}

export function QuestsTable({
  initialQuests,
  initialEditingQuest = null,
  initialModalOpen = false,
  onQuestsUpdated,
}: QuestsTableProps) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(initialModalOpen)
  const [editingQuest, setEditingQuest] = useState<Quest | null>(initialEditingQuest || null)
  const [searchQuery, setSearchQuery] = useState("")
  const [quests, setQuests] = useState<Quest[]>(initialQuests || [])
  const [isLoading, setIsLoading] = useState(false)
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [viewingImage, setViewingImage] = useState<{ url: string | null; title: string; alt: string }>({
    url: null,
    title: "",
    alt: "",
  })

  // Update quests when initialQuests changes (e.g., after refresh)
  useEffect(() => {
    setQuests(initialQuests || [])
  }, [initialQuests])

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
      // Refresh the page to ensure database is synced
      setTimeout(() => router.refresh(), 300)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete quest")
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewImage = (imageUrl: string | null, title: string, alt: string) => {
    if (!imageUrl) {
      toast.error("No image available")
      return
    }
    setViewingImage({ url: imageUrl, title, alt })
    setImageViewerOpen(true)
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

  const handleQuestSaved = () => {
    // Refresh the page to get updated quests
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#004A98]">
      {/* Header with background image */}
      <div
        className="relative overflow-hidden flex flex-col"
        style={{
          backgroundImage: `url('/navbarBg.png')`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderBottomLeftRadius: "190px",
          borderBottomRightRadius: "190px",
        }}
      >
        <div className="relative z-10 flex flex-col">
          <FacilitatorNav />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
            <div className="flex items-center justify-center">
              <h1 className="text-5xl font-semibold text-white" style={{ fontFamily: "Poppins, sans-serif" }}>Quests</h1>
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
                <th className="px-6 py-4 text-center text-sm font-semibold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
                  <h1>Badge</h1>
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>Certificate</th>
                <th className="px-6 py-4 text-center text-sm text-black" style={{ font: "600 14px/20px Poppins, sans-serif" }}>Difficulty</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>Scheduled For</th>
                <th className="px-6 py-4 text-center text-sm text-black" style={{ font: "600 14px/20px Poppins, sans-serif" }}>Status</th>
                <th className="px-6 py-4 text-center text-sm text-black" style={{ font: "600 14px/20px Poppins, sans-serif" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuests?.map((quest) => (
                <tr key={quest.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-sm font-light text-black text-center">{quest.title}</span>
                      <Button
                        onClick={() =>
                          handleViewImage(quest.badge_image_url, `${quest.title} Badge`, "Badge")
                        }
                        variant="ghost"
                        size="sm"
                        className="h-auto py-2 px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-light"
                      >
                        View Badge
                      </Button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center" style={{ fontFamily: "Poppins, sans-serif" }}>
                    <Button
                      onClick={() =>
                        handleViewImage(quest.certificate_image_url, `${quest.title} Certificate`, "Certificate")
                      }
                      variant="ghost"
                      size="sm"
                      className="h-auto py-2 px-4 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg text-sm font-light"
                    >
                      View Certificate
                    </Button>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-light text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
                    <p>{quest.difficulty && quest.difficulty.charAt(0).toUpperCase() + quest.difficulty.slice(1).toLowerCase() || "Beginner - Intermediate"}</p>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-light text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
                    {quest.scheduled_date ? new Date(quest.scheduled_date).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-6 py-4 text-center" style={{ fontFamily: "Poppins, sans-serif" }}>
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
                        className="h-auto py-2 px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg w-20"
                        style={{ font: "300 14px/20px Poppins, sans-serif" }}
                      >
                        Edit
                      </Button>
                      {quest.status === "published" ? (
                        <Button
                          onClick={() => handleArchiveQuest(quest.id)}
                          disabled={isLoading}
                          variant="ghost"
                          size="sm"
                          className="h-auto py-2 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg w-20"
                          style={{ font: "300 14px/20px Poppins, sans-serif" }}
                        >
                          Archive
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handlePublishQuest(quest.id)}
                          disabled={isLoading}
                          variant="ghost"
                          size="sm"
                          className="h-auto py-2 px-4 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg w-20"
                          style={{ font: "300 14px/20px Poppins, sans-serif" }}
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
        onQuestSaved={handleQuestSaved}
        editingQuest={editingQuest || undefined}
      />

      {/* Image Viewer Modal */}
      <ImageViewerModal
        open={imageViewerOpen}
        onOpenChange={setImageViewerOpen}
        imageUrl={viewingImage.url}
        title={viewingImage.title}
        altText={viewingImage.alt}
      />
    </div>
  )
}
