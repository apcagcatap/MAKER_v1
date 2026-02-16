"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FacilitatorNav } from "@/components/layout/facilitator-nav"
import { CreateQuestModal } from "@/components/facilitator/create-quest-modal"
import { ImageViewerModal } from "@/components/facilitator/image-viewer-modal"
import { ParticipantsListDialog } from "@/components/facilitator/participants-list-dialog" 
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Users, 
  Edit, 
  Archive, 
  CheckCircle, 
  FileImage, 
  FileText,
  Calendar,
  BarChart
} from "lucide-react"
import { publishQuest, archiveQuest } from "@/lib/actions/quests"
import { toast } from "sonner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
  // Include participant data structure
  quest_participants?: Array<{ status: string }>
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
  
  // Image Viewer State
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [viewingImage, setViewingImage] = useState<{ url: string | null; title: string; alt: string }>({
    url: null,
    title: "",
    alt: "",
  })

  // Participants Dialog State
  const [participantsModalOpen, setParticipantsModalOpen] = useState(false)
  const [selectedQuestForParticipants, setSelectedQuestForParticipants] = useState<Quest | null>(null)

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

  // Count active participants (In Progress)
  const getActiveParticipantCount = (quest: Quest) => {
    if (!quest.quest_participants) return 0
    return quest.quest_participants.filter(p => p.status === 'in_progress').length
  }
  
  // Count total participants
  const getTotalParticipantCount = (quest: Quest) => {
    return quest.quest_participants?.length || 0
  }

  const handleOpenModal = (quest?: Quest) => {
    setEditingQuest(quest || null)
    setModalOpen(true)
  }

  // Open the participants list
  const handleOpenParticipants = (quest: Quest) => {
    setSelectedQuestForParticipants(quest)
    setParticipantsModalOpen(true)
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
      await archiveQuest(questId)
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
      {/* Header */}
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
            className="h-12 sm:h-14 px-6 sm:px-8 bg-[#4A90E2] hover:bg-[#357ABD] text-white font-medium rounded-xl transition-colors"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Add New Quest
          </Button>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-6 py-4 text-center text-sm font-semibold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
                    Quest Name
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
                    Participants
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
                {filteredQuests?.map((quest) => {
                  const activeCount = getActiveParticipantCount(quest)
                  const hasActive = activeCount > 0

                  return (
                    <tr key={quest.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-center" style={{ fontFamily: "Poppins, sans-serif" }}>
                        <span className="text-sm font-light text-black">{quest.title}</span>
                      </td>
                      
                      {/* Participants Column */}
                      <td className="px-6 py-4 text-center">
                        <Button
                          onClick={() => handleOpenParticipants(quest)}
                          variant="ghost"
                          size="sm"
                          className="h-auto py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium gap-2 min-w-[120px] justify-center shadow-md transition-all"
                        >
                          <Users className="w-4 h-4 text-white" />
                          <span>View</span>
                          {hasActive && (
                            <span className="flex h-2 w-2 relative ml-1">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                            </span>
                          )}
                        </Button>
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
                                : "text-gray-600"
                          }`}
                        >
                          {quest.status || "Draft"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span tabIndex={0} className="inline-block">
                                  <Button
                                    onClick={() => handleOpenModal(quest)}
                                    disabled={isLoading || hasActive}
                                    variant="ghost"
                                    size="sm"
                                    className={`h-auto py-2 px-4 rounded-lg w-20 ${
                                      hasActive 
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                                        : "bg-blue-50 hover:bg-blue-100 text-blue-600"
                                    }`}
                                  >
                                    Edit
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              {hasActive && (
                                <TooltipContent side="left">
                                  <p>Cannot edit while users are in progress</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>

                          {quest.status === "Published" ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span tabIndex={0} className="inline-block">
                                    <Button
                                      onClick={() => handleArchiveQuest(quest.id)}
                                      disabled={isLoading || hasActive}
                                      variant="ghost"
                                      size="sm"
                                      className={`h-auto py-2 px-4 rounded-lg w-20 ${
                                        hasActive 
                                          ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                                          : "bg-orange-50 hover:bg-orange-100 text-orange-600"
                                      }`}
                                    >
                                      Archive
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                {hasActive && (
                                  <TooltipContent side="left">
                                    <p>Cannot archive while users are in progress</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <Button
                              onClick={() => handlePublishQuest(quest.id)}
                              disabled={isLoading}
                              variant="ghost"
                              size="sm"
                              className="h-auto py-2 px-4 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg w-20"
                            >
                              Publish
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile View */}
        <div className="grid gap-4 lg:hidden">
          {filteredQuests?.map((quest) => {
            const activeCount = getActiveParticipantCount(quest)
            const hasActive = activeCount > 0

            return (
              <div key={quest.id} className="bg-white rounded-xl shadow-lg p-5 space-y-4 border border-gray-100">
                {/* Header: Title & Status */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight" style={{ fontFamily: "Poppins, sans-serif" }}>
                      {quest.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <BarChart className="w-3.5 h-3.5" />
                        <span className="font-medium">{quest.difficulty && quest.difficulty.charAt(0).toUpperCase() + quest.difficulty.slice(1).toLowerCase() || "Beginner"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                         <Calendar className="w-3.5 h-3.5" />
                         <span>{quest.scheduled_date ? new Date(quest.scheduled_date).toLocaleDateString() : "No Date"}</span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                      quest.status === "Published"
                        ? "bg-green-100 text-green-700"
                        : quest.status === "Draft"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {quest.status || "Draft"}
                  </span>
                </div>

                {/* Main Action: Participants */}
                <Button
                  onClick={() => handleOpenParticipants(quest)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm h-12 text-sm font-medium"
                >
                   <Users className="w-4 h-4 mr-2" />
                   View Participants
                   {hasActive && (
                      <span className="ml-2 flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                      </span>
                   )}
                </Button>

                {/* Resources: Badge & Certificate */}
                <div className="grid grid-cols-2 gap-3">
                   <Button
                      variant="outline"
                      onClick={() => handleViewImage(quest.badge_image_url, `${quest.title} Badge`, "Badge")}
                      className="w-full justify-center bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 hover:text-blue-700 h-10"
                   >
                     <FileImage className="w-4 h-4 mr-2" /> Badge
                   </Button>
                   <Button
                      variant="outline"
                      onClick={() => handleViewImage(quest.certificate_image_url, `${quest.title} Certificate`, "Certificate")}
                      className="w-full justify-center bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100 hover:text-purple-700 h-10"
                   >
                     <FileText className="w-4 h-4 mr-2" /> Certificate
                   </Button>
                </div>

                {/* Footer: Admin Actions */}
                <div className="pt-4 border-t border-gray-100 flex gap-3">
                   {/* EDIT BUTTON: Sky Blue + White Text */}
                   <Button
                      onClick={() => handleOpenModal(quest)}
                      disabled={isLoading || hasActive}
                      className={`flex-1 h-10 ${
                        hasActive 
                          ? "opacity-50 cursor-not-allowed bg-gray-200 text-gray-500" 
                          : "bg-sky-500 hover:bg-sky-600 text-white"
                      }`}
                   >
                      <Edit className="w-4 h-4 mr-2" /> Edit
                   </Button>
                   
                   {quest.status === "Published" ? (
                      /* ARCHIVE BUTTON: Red + White Text */
                      <Button
                        onClick={() => handleArchiveQuest(quest.id)}
                        disabled={isLoading || hasActive}
                        className={`flex-1 h-10 ${
                          hasActive 
                            ? "opacity-50 cursor-not-allowed bg-gray-200 text-gray-500" 
                            : "bg-red-500 hover:bg-red-600 text-white"
                        }`}
                      >
                         <Archive className="w-4 h-4 mr-2" /> Archive
                      </Button>
                   ) : (
                      /* PUBLISH BUTTON: Green + White Text */
                      <Button
                        onClick={() => handlePublishQuest(quest.id)}
                        disabled={isLoading}
                        className="flex-1 h-10 bg-green-500 hover:bg-green-600 text-white"
                      >
                         <CheckCircle className="w-4 h-4 mr-2" /> Publish
                      </Button>
                   )}
                </div>
              </div>
            )
          })}
        </div>
      </main>

      <CreateQuestModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        onQuestSaved={handleQuestSaved}
        editingQuest={editingQuest || undefined}
      />

      <ImageViewerModal
        open={imageViewerOpen}
        onOpenChange={setImageViewerOpen}
        imageUrl={viewingImage.url}
        title={viewingImage.title}
        altText={viewingImage.alt}
      />

      {/* Render the Participants Dialog */}
      {selectedQuestForParticipants && (
        <ParticipantsListDialog
          open={participantsModalOpen}
          onOpenChange={setParticipantsModalOpen}
          questId={selectedQuestForParticipants.id}
          questTitle={selectedQuestForParticipants.title}
          questLevels={selectedQuestForParticipants.levels}
        />
      )}
    </div>
  )
}