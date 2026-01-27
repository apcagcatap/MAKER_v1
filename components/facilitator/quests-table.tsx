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

  useEffect(() => {
    setQuests(initialQuests || [])
  }, [initialQuests])

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
    if (!confirm("Are you sure you want to delete this quest? This action cannot be undone.")) return

    setIsLoading(true)
    try {
      await deleteQuest(questId)
      setQuests(prevQuests => prevQuests.filter((q) => q.id !== questId))
      toast.success("Quest deleted successfully")
      router.refresh()
    } catch (error) {
      console.error("Delete quest error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete quest")
      router.refresh()
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
      const updatedQuest = await publishQuest(questId)
      setQuests(prevQuests =>
        prevQuests.map((q) =>
          q.id === questId ? { ...q, status: "Published" } : q
        )
      )
      toast.success("Quest published successfully")
      router.refresh()
    } catch (error) {
      console.error("Publish quest error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to publish quest")
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  const handleArchiveQuest = async (questId: string) => {
    if (!confirm("Are you sure you want to archive this quest?")) return
    
    setIsLoading(true)
    try {
      const updatedQuest = await archiveQuest(questId)
      setQuests(prevQuests =>
        prevQuests.map((q) =>
          q.id === questId ? { ...q, status: "Archived" } : q
        )
      )
      toast.success("Quest archived successfully")
      router.refresh()
    } catch (error) {
      console.error("Archive quest error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to archive quest")
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setEditingQuest(null)
  }

  const handleQuestSaved = () => {
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
          borderBottomLeftRadius: "3rem",
          borderBottomRightRadius: "3rem",
        }}
      >
        <div className="relative z-10 flex flex-col">
          <FacilitatorNav />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12 sm:pb-16">
            <div className="flex items-center justify-center">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white" style={{ fontFamily: "Poppins, sans-serif" }}>Quests</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Search and Add Button */}
        <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-full sm:max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="search"
              placeholder="Search quests by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 sm:h-14 bg-white border-gray-300"
            />
          </div>
          <Button
            onClick={() => handleOpenModal()}
            className="h-12 sm:h-14 px-6 sm:px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold whitespace-nowrap w-full sm:w-auto"
          >
            Add New Quests
          </Button>
        </div>

        {/* Mobile Card View (visible only on small screens) */}
        <div className="lg:hidden space-y-4">
          {filteredQuests?.map((quest) => (
            <div key={quest.id} className="bg-white rounded-xl shadow-lg p-4 space-y-3">
              {/* Quest Name */}
              <div className="border-b pb-2">
                <h3 className="font-semibold text-gray-900 text-base" style={{ fontFamily: "Poppins, sans-serif" }}>
                  {quest.title}
                </h3>
              </div>

              {/* Details Grid */}
              <div className="space-y-3 text-sm">
                {/* Badge & Certificate */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-gray-500 text-xs mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>Badge</p>
                    <Button
                      onClick={() => handleViewImage(quest.badge_image_url, `${quest.title} Badge`, "Badge")}
                      variant="ghost"
                      size="sm"
                      className="w-full h-auto py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      View Badge
                    </Button>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>Certificate</p>
                    <Button
                      onClick={() => handleViewImage(quest.certificate_image_url, `${quest.title} Certificate`, "Certificate")}
                      variant="ghost"
                      size="sm"
                      className="w-full h-auto py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg text-xs"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      View Certificate
                    </Button>
                  </div>
                </div>

                {/* Difficulty & Scheduled */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-gray-500 text-xs" style={{ fontFamily: "Poppins, sans-serif" }}>Difficulty</p>
                    <p className="text-gray-900 font-light" style={{ fontFamily: "Poppins, sans-serif" }}>
                      {quest.difficulty && quest.difficulty.charAt(0).toUpperCase() + quest.difficulty.slice(1).toLowerCase() || "Beginner"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs" style={{ fontFamily: "Poppins, sans-serif" }}>Scheduled For</p>
                    <p className="text-gray-900 font-light" style={{ fontFamily: "Poppins, sans-serif" }}>
                      {quest.scheduled_date ? new Date(quest.scheduled_date).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <p className="text-gray-500 text-xs mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      quest.status === "Published"
                        ? "bg-green-100 text-green-700"
                        : quest.status === "Draft"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {quest.status || "Draft"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  onClick={() => handleOpenModal(quest)}
                  disabled={isLoading}
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-auto py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Edit
                </Button>
                {quest.status === "Published" ? (
                  <Button
                    onClick={() => handleArchiveQuest(quest.id)}
                    disabled={isLoading}
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-auto py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    Archive
                  </Button>
                ) : (
                  <Button
                    onClick={() => handlePublishQuest(quest.id)}
                    disabled={isLoading}
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-auto py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    Publish
                  </Button>
                )}
                <button
                  onClick={() => handleDeleteQuest(quest.id)}
                  disabled={isLoading}
                  className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {filteredQuests?.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl">
              <p className="text-gray-500" style={{ fontFamily: "Poppins, sans-serif" }}>
                {searchQuery ? "No quests match your search." : "No quests yet. Create your first quest to get started!"}
              </p>
            </div>
          )}
        </div>

        {/* Desktop Table View (visible only on large screens) */}
        <div className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-6 py-4 text-center text-sm font-semibold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
                    Quest Name
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
                    Badge
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
                    <td className="px-6 py-4 text-center" style={{ fontFamily: "Poppins, sans-serif" }}>
                      <span className="text-sm font-light text-black">{quest.title}</span>
                    </td>
                    <td className="px-6 py-4 text-center" style={{ fontFamily: "Poppins, sans-serif" }}>
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
                          quest.status === "Published"
                            ? "text-green-600"
                            : quest.status === "Draft"
                              ? "text-yellow-600"
                              : quest.status === "Archived"
                                ? "text-gray-600"
                                : "text-gray-600"
                        }`}
                      >
                        {quest.status || "Draft"}
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
                        {quest.status === "Published" ? (
                          <Button
                            onClick={() => handleArchiveQuest(quest.id)}
                            disabled={isLoading}
                            variant="ghost"
                            size="sm"
                            className="h-auto py-2 px-4 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg w-20"
                            style={{ font: "300 14px/20px Poppins, sans-serif" }}
                          >
                            {isLoading ? "..." : "Archive"}
                          </Button>
                        ) : quest.status === "Archived" ? (
                          <Button
                            onClick={() => handlePublishQuest(quest.id)}
                            disabled={isLoading}
                            variant="ghost"
                            size="sm"
                            className="h-auto py-2 px-4 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg w-20"
                            style={{ font: "300 14px/20px Poppins, sans-serif" }}
                          >
                            {isLoading ? "..." : "Publish"}
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
                            {isLoading ? "..." : "Publish"}
                          </Button>
                        )}
                        <button
                          onClick={() => handleDeleteQuest(quest.id)}
                          disabled={isLoading}
                          className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredQuests?.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500" style={{ fontFamily: "Poppins, sans-serif" }}>
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