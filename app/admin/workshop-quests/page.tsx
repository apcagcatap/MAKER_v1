"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, ScrollText, Calendar, Link as LinkIcon, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AdminPageHeader,
  AdminFilterCard,
  AdminDataTable,
  AdminFormDialog,
  AdminStatCard,
  ConfirmDeleteDialog,
  AdminTableActions,
} from "@/components/admin"
import type { Workshop, Quest, WorkshopQuest } from "@/lib/types"

interface WorkshopQuestWithDetails extends WorkshopQuest {
  quest: Quest
  workshop: Workshop
}

const ASSIGNMENT_TABLE_COLUMNS = [
  { key: "workshop", label: "Workshop" },
  { key: "quest", label: "Quest" },
  { key: "description", label: "Quest Description" },
  { key: "actions", label: "Actions", className: "w-[80px]" },
]

export default function WorkshopQuestsPage() {
  const [workshopQuests, setWorkshopQuests] = useState<WorkshopQuestWithDetails[]>([])
  const [filteredWorkshopQuests, setFilteredWorkshopQuests] = useState<WorkshopQuestWithDetails[]>([])
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [workshopFilter, setWorkshopFilter] = useState<string>("all")

  // Dialog states
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<WorkshopQuestWithDetails | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    workshop_id: "",
    quest_id: "",
  })
  const [selectedQuestIds, setSelectedQuestIds] = useState<string[]>([])

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)

    const { data: workshopsData } = await supabase
      .from("workshop")
      .select("*")
      .order("name")

    if (workshopsData) setWorkshops(workshopsData)

    const { data: questsData } = await supabase
      .from("quest")
      .select("*")
      .order("title")

    if (questsData) setQuests(questsData)

    const { data: assignmentsData } = await supabase
      .from("workshop_quest")
      .select(`*, quest:quest(*), workshop:workshop(*)`)

    if (assignmentsData) {
      setWorkshopQuests(assignmentsData as WorkshopQuestWithDetails[])
      setFilteredWorkshopQuests(assignmentsData as WorkshopQuestWithDetails[])
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    let filtered = workshopQuests

    if (searchQuery) {
      filtered = filtered.filter(
        (wq) =>
          wq.quest?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          wq.workshop?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (workshopFilter !== "all") {
      filtered = filtered.filter((wq) => wq.workshop_id === workshopFilter)
    }

    setFilteredWorkshopQuests(filtered)
  }, [searchQuery, workshopFilter, workshopQuests])

  const handleAssignQuest = async () => {
    const { error } = await supabase.from("workshop_quest").insert({
      workshop_id: formData.workshop_id,
      quest_id: formData.quest_id,
    })

    if (!error) {
      fetchData()
      setAssignDialogOpen(false)
      resetForm()
    }
  }

  const handleBulkAssign = async () => {
    if (!formData.workshop_id || selectedQuestIds.length === 0) return

    const assignments = selectedQuestIds.map((quest_id) => ({
      workshop_id: formData.workshop_id,
      quest_id,
    }))

    const { error } = await supabase.from("workshop_quest").insert(assignments)

    if (!error) {
      fetchData()
      setBulkAssignDialogOpen(false)
      setFormData({ workshop_id: "", quest_id: "" })
      setSelectedQuestIds([])
    }
  }

  const handleDeleteAssignment = async () => {
    if (!selectedAssignment) return

    const { error } = await supabase
      .from("workshop_quest")
      .delete()
      .eq("workshop_id", selectedAssignment.workshop_id)
      .eq("quest_id", selectedAssignment.quest_id)

    if (!error) {
      fetchData()
      setDeleteDialogOpen(false)
      setSelectedAssignment(null)
    }
  }

  const resetForm = () => {
    setFormData({ workshop_id: "", quest_id: "" })
  }

  const openDeleteDialog = (assignment: WorkshopQuestWithDetails) => {
    setSelectedAssignment(assignment)
    setDeleteDialogOpen(true)
  }

  const getAvailableQuests = () => {
    if (!formData.workshop_id) return quests
    const assignedQuestIds = workshopQuests
      .filter((wq) => wq.workshop_id === formData.workshop_id)
      .map((wq) => wq.quest_id)
    return quests.filter((q) => !assignedQuestIds.includes(q.id))
  }

  const toggleQuestSelection = (questId: string) => {
    setSelectedQuestIds((prev) =>
      prev.includes(questId) ? prev.filter((id) => id !== questId) : [...prev, questId]
    )
  }

  const renderAssignmentRow = (assignment: WorkshopQuestWithDetails) => (
    <TableRow key={`${assignment.workshop_id}-${assignment.quest_id}`}>
      <TableCell>
        <Badge variant="outline">
          <Calendar className="w-3 h-3 mr-1" />
          {assignment.workshop?.name || "Unknown Workshop"}
        </Badge>
      </TableCell>
      <TableCell className="font-medium">
        {assignment.quest?.title || "Unknown Quest"}
      </TableCell>
      <TableCell className="max-w-md truncate">
        {assignment.quest?.description || "-"}
      </TableCell>
      <TableCell>
        <AdminTableActions
          actions={[
            {
              label: "Remove",
              icon: <Trash2 className="w-4 h-4 mr-2" />,
              onClick: () => openDeleteDialog(assignment),
              variant: "destructive",
            },
          ]}
        />
      </TableCell>
    </TableRow>
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Workshop Quest Assignments"
        description="Assign quests to workshops"
        actionLabel="Assign Quest"
        actionIcon={Plus}
        onAction={() => setAssignDialogOpen(true)}
      />

      {/* Extra action button for bulk assign */}
      <div className="flex justify-end -mt-4">
        <Button variant="outline" onClick={() => setBulkAssignDialogOpen(true)}>
          <LinkIcon className="w-4 h-4 mr-2" />
          Bulk Assign
        </Button>
      </div>

      <AdminFilterCard
        searchPlaceholder="Search quests or workshops..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            placeholder: "Filter by workshop",
            value: workshopFilter,
            onChange: setWorkshopFilter,
            options: workshops.map((w) => ({ value: w.id, label: w.name })),
            allLabel: "All Workshops",
          },
        ]}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AdminStatCard
          icon={Calendar}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          value={workshops.length}
          label="Total Workshops"
        />
        <AdminStatCard
          icon={ScrollText}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
          value={quests.length}
          label="Total Quests"
        />
        <AdminStatCard
          icon={LinkIcon}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
          value={workshopQuests.length}
          label="Total Assignments"
        />
      </div>

      <AdminDataTable
        title="Quest Assignments"
        icon={ScrollText}
        columns={ASSIGNMENT_TABLE_COLUMNS}
        data={filteredWorkshopQuests}
        loading={loading}
        emptyMessage="No quest assignments found. Assign quests to workshops to get started."
        renderRow={renderAssignmentRow}
      />

      {/* Assign Quest Dialog */}
      <AdminFormDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        title="Assign Quest to Workshop"
        description="Select a workshop and quest to create an assignment."
        onSubmit={handleAssignQuest}
        submitLabel="Assign Quest"
        submitDisabled={!formData.workshop_id || !formData.quest_id}
      >
        <div className="space-y-2">
          <Label>Workshop</Label>
          <Select
            value={formData.workshop_id}
            onValueChange={(value) =>
              setFormData({ ...formData, workshop_id: value, quest_id: "" })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a workshop" />
            </SelectTrigger>
            <SelectContent>
              {workshops.map((workshop) => (
                <SelectItem key={workshop.id} value={workshop.id}>
                  {workshop.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Quest</Label>
          <Select
            value={formData.quest_id}
            onValueChange={(value) => setFormData({ ...formData, quest_id: value })}
            disabled={!formData.workshop_id}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={formData.workshop_id ? "Select a quest" : "Select a workshop first"}
              />
            </SelectTrigger>
            <SelectContent>
              {getAvailableQuests().map((quest) => (
                <SelectItem key={quest.id} value={quest.id}>
                  {quest.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </AdminFormDialog>

      {/* Bulk Assign Dialog */}
      <Dialog open={bulkAssignDialogOpen} onOpenChange={setBulkAssignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Assign Quests</DialogTitle>
            <DialogDescription>
              Select a workshop and multiple quests to assign at once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Workshop</Label>
              <Select
                value={formData.workshop_id}
                onValueChange={(value) => {
                  setFormData({ ...formData, workshop_id: value })
                  setSelectedQuestIds([])
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a workshop" />
                </SelectTrigger>
                <SelectContent>
                  {workshops.map((workshop) => (
                    <SelectItem key={workshop.id} value={workshop.id}>
                      {workshop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.workshop_id && (
              <div className="space-y-2">
                <Label>Select Quests ({selectedQuestIds.length} selected)</Label>
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {getAvailableQuests().length === 0 ? (
                    <div className="p-4 text-center text-slate-500">
                      All quests are already assigned to this workshop.
                    </div>
                  ) : (
                    getAvailableQuests().map((quest) => (
                      <div
                        key={quest.id}
                        className="flex items-center gap-3 p-3 hover:bg-slate-50 border-b last:border-b-0"
                      >
                        <Checkbox
                          checked={selectedQuestIds.includes(quest.id)}
                          onCheckedChange={() => toggleQuestSelection(quest.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{quest.title}</p>
                          {quest.description && (
                            <p className="text-sm text-slate-500 truncate">
                              {quest.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkAssign}
              disabled={!formData.workshop_id || selectedQuestIds.length === 0}
            >
              Assign {selectedQuestIds.length} Quest{selectedQuestIds.length !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remove Quest from Workshop"
        description={`Are you sure you want to remove "${selectedAssignment?.quest?.title}" from "${selectedAssignment?.workshop?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteAssignment}
        confirmLabel="Remove"
      />
    </div>
  )
}
