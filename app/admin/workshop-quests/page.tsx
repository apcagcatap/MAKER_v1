"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  Plus,
  ScrollText,
  Calendar,
  Link as LinkIcon,
  Trash2,
  Clock,
  Play,
  Lock,
  CheckCircle2,
  ListTodo,
  Settings,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  AdminQuickLinkCard,
} from "@/components/admin"
import type { Workshop, QuestTemplate, WorkshopQuest, WorkshopItemStatus } from "@/lib/types"

interface WorkshopQuestWithDetails extends WorkshopQuest {
  quest_template: QuestTemplate
  workshop: Workshop
  task_count?: number
}

const STATUS_OPTIONS: { value: WorkshopItemStatus; label: string; color: string; icon: React.ReactNode }[] = [
  { value: "locked", label: "Locked", color: "bg-slate-100 text-slate-700", icon: <Lock className="w-3 h-3" /> },
  { value: "open", label: "Open", color: "bg-blue-100 text-blue-700", icon: <Play className="w-3 h-3" /> },
  { value: "in_progress", label: "In Progress", color: "bg-amber-100 text-amber-700", icon: <Clock className="w-3 h-3" /> },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="w-3 h-3" /> },
]

const ASSIGNMENT_TABLE_COLUMNS = [
  { key: "workshop", label: "Workshop" },
  { key: "quest", label: "Quest" },
  { key: "schedule", label: "Schedule" },
  { key: "status", label: "Status" },
  { key: "tasks", label: "Tasks" },
  { key: "actions", label: "Actions", className: "w-[100px]" },
]

export default function WorkshopQuestsPage() {
  const searchParams = useSearchParams()
  const initialWorkshopFilter = searchParams.get("workshop") || "all"
  
  const [workshopQuests, setWorkshopQuests] = useState<WorkshopQuestWithDetails[]>([])
  const [filteredWorkshopQuests, setFilteredWorkshopQuests] = useState<WorkshopQuestWithDetails[]>([])
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [questTemplates, setQuestTemplates] = useState<QuestTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [workshopFilter, setWorkshopFilter] = useState<string>(initialWorkshopFilter)

  // Dialog states
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<WorkshopQuestWithDetails | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    workshop_id: initialWorkshopFilter !== "all" ? initialWorkshopFilter : "",
    quest_template_id: "",
    custom_title: "",
    custom_description: "",
    sequence_order: "0",
    status: "locked" as WorkshopItemStatus,
    scheduled_start: "",
    scheduled_end: "",
  })
  const [selectedQuestIds, setSelectedQuestIds] = useState<string[]>([])

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)

    const { data: workshopsData } = await supabase
      .from("workshop")
      .select("*")
      .order("event_date", { ascending: false })

    if (workshopsData) setWorkshops(workshopsData)

    const { data: questsData } = await supabase
      .from("quest_template")
      .select("*")
      .eq("is_archived", false)
      .order("title")

    if (questsData) setQuestTemplates(questsData)

    const { data: assignmentsData } = await supabase
      .from("workshop_quest")
      .select(`*, quest_template:quest_template(*), workshop:workshop(*)`)
      .order("sequence_order")

    if (assignmentsData) {
      // Fetch task counts
      const assignmentsWithCounts = await Promise.all(
        assignmentsData.map(async (assignment) => {
          const { count } = await supabase
            .from("workshop_task")
            .select("*", { count: "exact", head: true })
            .eq("workshop_quest_id", assignment.id)

          return { ...assignment, task_count: count || 0 }
        })
      )

      setWorkshopQuests(assignmentsWithCounts as WorkshopQuestWithDetails[])
      setFilteredWorkshopQuests(assignmentsWithCounts as WorkshopQuestWithDetails[])
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
          wq.quest_template?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          wq.custom_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          wq.workshop?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (workshopFilter !== "all") {
      filtered = filtered.filter((wq) => wq.workshop_id === workshopFilter)
    }

    setFilteredWorkshopQuests(filtered)
  }, [searchQuery, workshopFilter, workshopQuests])

  const handleAssignQuest = async () => {
    // Insert the workshop_quest record
    const { data: workshopQuestData, error } = await supabase
      .from("workshop_quest")
      .insert({
        workshop_id: formData.workshop_id,
        quest_template_id: formData.quest_template_id,
        custom_title: formData.custom_title || null,
        custom_description: formData.custom_description || null,
        sequence_order: parseInt(formData.sequence_order) || 0,
        status: formData.status,
        scheduled_start: formData.scheduled_start || null,
        scheduled_end: formData.scheduled_end || null,
      })
      .select()
      .single()

    if (!error && workshopQuestData) {
      // Automatically import tasks from the quest template
      const { data: templateTasks } = await supabase
        .from("quest_template_task")
        .select("*")
        .eq("quest_template_id", formData.quest_template_id)
        .order("sequence_order")

      if (templateTasks && templateTasks.length > 0) {
        const workshopTasks = templateTasks.map((tt, index) => ({
          workshop_quest_id: workshopQuestData.id,
          task_template_id: tt.task_template_id,
          sequence_order: tt.sequence_order ?? index,
          status: "locked" as const,
          auto_unlock: false,
          unlock_on_previous_complete: true,
        }))

        const { error: taskError } = await supabase.from("workshop_task").insert(workshopTasks)
        if (taskError) {
          console.error("Error importing tasks from template:", taskError)
        }
      }

      fetchData()
      setAssignDialogOpen(false)
      resetForm()
    } else if (error) {
      console.error("Error assigning quest to workshop:", error)
    }
  }

  const handleEditQuest = async () => {
    if (!selectedAssignment) return

    const { error } = await supabase
      .from("workshop_quest")
      .update({
        custom_title: formData.custom_title || null,
        custom_description: formData.custom_description || null,
        sequence_order: parseInt(formData.sequence_order) || 0,
        status: formData.status,
        scheduled_start: formData.scheduled_start || null,
        scheduled_end: formData.scheduled_end || null,
      })
      .eq("id", selectedAssignment.id)

    if (!error) {
      fetchData()
      setEditDialogOpen(false)
      setSelectedAssignment(null)
      resetForm()
    }
  }

  const handleBulkAssign = async () => {
    if (!formData.workshop_id || selectedQuestIds.length === 0) return

    // Get current max sequence order
    const existingQuests = workshopQuests.filter(
      (wq) => wq.workshop_id === formData.workshop_id
    )
    let nextOrder = existingQuests.length > 0
      ? Math.max(...existingQuests.map((wq) => wq.sequence_order)) + 1
      : 0

    const assignments = selectedQuestIds.map((quest_template_id) => ({
      workshop_id: formData.workshop_id,
      quest_template_id,
      sequence_order: nextOrder++,
      status: "locked" as const,
    }))

    // Insert all workshop_quests and get the created records
    const { data: createdQuests, error } = await supabase
      .from("workshop_quest")
      .insert(assignments)
      .select()

    if (!error && createdQuests) {
      // For each created workshop_quest, import tasks from its template
      for (const workshopQuest of createdQuests) {
        const { data: templateTasks } = await supabase
          .from("quest_template_task")
          .select("*")
          .eq("quest_template_id", workshopQuest.quest_template_id)
          .order("sequence_order")

        if (templateTasks && templateTasks.length > 0) {
          const workshopTasks = templateTasks.map((tt, index) => ({
            workshop_quest_id: workshopQuest.id,
            task_template_id: tt.task_template_id,
            sequence_order: tt.sequence_order ?? index,
            status: "locked" as const,
            auto_unlock: false,
            unlock_on_previous_complete: true,
          }))

          const { error: taskError } = await supabase.from("workshop_task").insert(workshopTasks)
          if (taskError) {
            console.error("Error importing tasks from template:", taskError)
          }
        }
      }

      fetchData()
      setBulkAssignDialogOpen(false)
      setFormData({ ...formData, workshop_id: "", quest_template_id: "" })
      setSelectedQuestIds([])
    } else if (error) {
      console.error("Error bulk assigning quests:", error)
    }
  }

  const handleDeleteAssignment = async () => {
    if (!selectedAssignment) return

    const { error } = await supabase
      .from("workshop_quest")
      .delete()
      .eq("id", selectedAssignment.id)

    if (!error) {
      fetchData()
      setDeleteDialogOpen(false)
      setSelectedAssignment(null)
    }
  }

  const resetForm = () => {
    setFormData({
      workshop_id: "",
      quest_template_id: "",
      custom_title: "",
      custom_description: "",
      sequence_order: "0",
      status: "locked",
      scheduled_start: "",
      scheduled_end: "",
    })
  }

  const openEditDialog = (assignment: WorkshopQuestWithDetails) => {
    setSelectedAssignment(assignment)
    setFormData({
      workshop_id: assignment.workshop_id,
      quest_template_id: assignment.quest_template_id,
      custom_title: assignment.custom_title || "",
      custom_description: assignment.custom_description || "",
      sequence_order: assignment.sequence_order.toString(),
      status: assignment.status,
      scheduled_start: assignment.scheduled_start || "",
      scheduled_end: assignment.scheduled_end || "",
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (assignment: WorkshopQuestWithDetails) => {
    setSelectedAssignment(assignment)
    setDeleteDialogOpen(true)
  }

  const getAvailableQuests = () => {
    if (!formData.workshop_id) return questTemplates
    const assignedQuestIds = workshopQuests
      .filter((wq) => wq.workshop_id === formData.workshop_id)
      .map((wq) => wq.quest_template_id)
    return questTemplates.filter((q) => !assignedQuestIds.includes(q.id))
  }

  const toggleQuestSelection = (questId: string) => {
    setSelectedQuestIds((prev) =>
      prev.includes(questId) ? prev.filter((id) => id !== questId) : [...prev, questId]
    )
  }

  const getStatusConfig = (status: WorkshopItemStatus) => {
    return STATUS_OPTIONS.find((opt) => opt.value === status) || STATUS_OPTIONS[0]
  }

  const formatDateTime = (dateTimeString: string | null) => {
    if (!dateTimeString) return null
    const date = new Date(dateTimeString)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const renderAssignmentRow = (assignment: WorkshopQuestWithDetails) => {
    const statusConfig = getStatusConfig(assignment.status)
    const displayTitle = assignment.custom_title || assignment.quest_template?.title

    return (
      <TableRow key={assignment.id}>
        <TableCell>
          <Badge variant="outline">
            <Calendar className="w-3 h-3 mr-1" />
            {assignment.workshop?.name || "Unknown Workshop"}
          </Badge>
        </TableCell>
        <TableCell>
          <div>
            <p className="font-medium">{displayTitle || "Unknown Quest"}</p>
            {assignment.custom_title && (
              <p className="text-xs text-slate-500">
                (from: {assignment.quest_template?.title})
              </p>
            )}
            <p className="text-xs text-slate-400">Order: {assignment.sequence_order}</p>
          </div>
        </TableCell>
        <TableCell>
          {assignment.scheduled_start || assignment.scheduled_end ? (
            <div className="text-sm space-y-1">
              {assignment.scheduled_start && (
                <div className="flex items-center gap-1 text-green-600">
                  <Play className="w-3 h-3" />
                  {formatDateTime(assignment.scheduled_start)}
                </div>
              )}
              {assignment.scheduled_end && (
                <div className="flex items-center gap-1 text-red-600">
                  <Clock className="w-3 h-3" />
                  {formatDateTime(assignment.scheduled_end)}
                </div>
              )}
            </div>
          ) : (
            <span className="text-slate-400 text-sm">Not scheduled</span>
          )}
        </TableCell>
        <TableCell>
          <Badge className={`${statusConfig.color} hover:${statusConfig.color} gap-1`}>
            {statusConfig.icon}
            {statusConfig.label}
          </Badge>
        </TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-purple-600 hover:text-purple-700"
          >
            <a href={`/admin/workshop-tasks?quest=${assignment.id}`}>
              <ListTodo className="w-4 h-4 mr-1" />
              {assignment.task_count} task{assignment.task_count !== 1 ? "s" : ""}
            </a>
          </Button>
        </TableCell>
        <TableCell>
          <AdminTableActions
            actions={[
              {
                label: "Edit Schedule",
                icon: <Settings className="w-4 h-4 mr-2" />,
                onClick: () => openEditDialog(assignment),
              },
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
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Workshop Quest Assignments"
        description="Assign quest templates to workshops and configure scheduling"
        actionLabel="Assign Quest"
        actionIcon={Plus}
        onAction={() => setAssignDialogOpen(true)}
      />

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AdminQuickLinkCard
          href="/admin/quest-templates"
          icon={ScrollText}
          iconBgColor="bg-amber-100"
          iconColor="text-amber-600"
          title="Quest Templates"
          description="Create and manage reusable quest templates"
        />
        <AdminQuickLinkCard
          href="/admin/workshop-tasks"
          icon={ListTodo}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
          title="Workshop Tasks"
          description="Manage task scheduling within workshop quests"
        />
      </div>

      {/* Extra action button for bulk assign */}
      <div className="flex justify-end">
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
          value={questTemplates.length}
          label="Quest Templates"
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
        description="Select a workshop and quest template. You can customize the title and schedule."
        onSubmit={handleAssignQuest}
        submitLabel="Assign Quest"
        submitDisabled={!formData.workshop_id || !formData.quest_template_id}
      >
        <div className="space-y-2">
          <Label>Workshop</Label>
          <Select
            value={formData.workshop_id}
            onValueChange={(value) =>
              setFormData({ ...formData, workshop_id: value, quest_template_id: "" })
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
          <Label>Quest Template</Label>
          <Select
            value={formData.quest_template_id}
            onValueChange={(value) => setFormData({ ...formData, quest_template_id: value })}
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
        <div className="space-y-2">
          <Label>Custom Title (optional)</Label>
          <Input
            value={formData.custom_title}
            onChange={(e) => setFormData({ ...formData, custom_title: e.target.value })}
            placeholder="Override the template title"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Sequence Order</Label>
            <Input
              type="number"
              min="0"
              value={formData.sequence_order}
              onChange={(e) => setFormData({ ...formData, sequence_order: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: WorkshopItemStatus) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Scheduled Start</Label>
            <Input
              type="datetime-local"
              value={formData.scheduled_start}
              onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Scheduled End</Label>
            <Input
              type="datetime-local"
              value={formData.scheduled_end}
              onChange={(e) => setFormData({ ...formData, scheduled_end: e.target.value })}
            />
          </div>
        </div>
      </AdminFormDialog>

      {/* Edit Quest Dialog */}
      <AdminFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        title="Edit Quest Assignment"
        description="Update the quest scheduling and status."
        onSubmit={handleEditQuest}
        submitLabel="Save Changes"
      >
        <div className="space-y-2">
          <Label>Custom Title (optional)</Label>
          <Input
            value={formData.custom_title}
            onChange={(e) => setFormData({ ...formData, custom_title: e.target.value })}
            placeholder="Override the template title"
          />
        </div>
        <div className="space-y-2">
          <Label>Custom Description (optional)</Label>
          <Textarea
            value={formData.custom_description}
            onChange={(e) => setFormData({ ...formData, custom_description: e.target.value })}
            placeholder="Override the template description"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Sequence Order</Label>
            <Input
              type="number"
              min="0"
              value={formData.sequence_order}
              onChange={(e) => setFormData({ ...formData, sequence_order: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: WorkshopItemStatus) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Scheduled Start</Label>
            <Input
              type="datetime-local"
              value={formData.scheduled_start}
              onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Scheduled End</Label>
            <Input
              type="datetime-local"
              value={formData.scheduled_end}
              onChange={(e) => setFormData({ ...formData, scheduled_end: e.target.value })}
            />
          </div>
        </div>
      </AdminFormDialog>

      {/* Bulk Assign Dialog */}
      <Dialog open={bulkAssignDialogOpen} onOpenChange={setBulkAssignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Assign Quests</DialogTitle>
            <DialogDescription>
              Select a workshop and multiple quest templates to assign at once.
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
                <Label>Select Quest Templates ({selectedQuestIds.length} selected)</Label>
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {getAvailableQuests().length === 0 ? (
                    <div className="p-4 text-center text-slate-500">
                      All quest templates are already assigned to this workshop.
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
        description={`Are you sure you want to remove "${selectedAssignment?.custom_title || selectedAssignment?.quest_template?.title}" from "${selectedAssignment?.workshop?.name}"? This will also remove all associated tasks. This action cannot be undone.`}
        onConfirm={handleDeleteAssignment}
        confirmLabel="Remove"
      />
    </div>
  )
}
