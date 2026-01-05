"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Plus,
  ListTodo,
  Calendar,
  Clock,
  Play,
  Lock,
  CheckCircle2,
  Settings,
  Trash2,
  ScrollText,
  SkipForward,
  Unlock,
  Timer,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
import type {
  Workshop,
  TaskTemplate,
  WorkshopQuest,
  WorkshopTask,
  WorkshopItemStatus,
  QuestTemplate,
} from "@/lib/types"

interface WorkshopQuestWithDetails extends WorkshopQuest {
  quest_template: QuestTemplate
  workshop: Workshop
}

interface WorkshopTaskWithDetails extends WorkshopTask {
  task_template: TaskTemplate
  workshop_quest: WorkshopQuestWithDetails
}

const STATUS_OPTIONS: {
  value: WorkshopItemStatus
  label: string
  color: string
  icon: React.ReactNode
}[] = [
  {
    value: "locked",
    label: "Locked",
    color: "bg-slate-100 text-slate-700",
    icon: <Lock className="w-3 h-3" />,
  },
  {
    value: "open",
    label: "Open",
    color: "bg-blue-100 text-blue-700",
    icon: <Unlock className="w-3 h-3" />,
  },
  {
    value: "in_progress",
    label: "In Progress",
    color: "bg-amber-100 text-amber-700",
    icon: <Play className="w-3 h-3" />,
  },
  {
    value: "completed",
    label: "Completed",
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  {
    value: "skipped",
    label: "Skipped",
    color: "bg-orange-100 text-orange-700",
    icon: <SkipForward className="w-3 h-3" />,
  },
]

const TASK_TABLE_COLUMNS = [
  { key: "quest", label: "Quest" },
  { key: "task", label: "Task" },
  { key: "schedule", label: "Schedule" },
  { key: "duration", label: "Duration" },
  { key: "status", label: "Status" },
  { key: "unlock", label: "Unlock Settings" },
  { key: "actions", label: "Actions", className: "w-[100px]" },
]

export default function WorkshopTasksPage() {
  const searchParams = useSearchParams()
  const questFilterParam = searchParams.get("quest")

  const [workshopTasks, setWorkshopTasks] = useState<WorkshopTaskWithDetails[]>([])
  const [filteredTasks, setFilteredTasks] = useState<WorkshopTaskWithDetails[]>([])
  const [workshopQuests, setWorkshopQuests] = useState<WorkshopQuestWithDetails[]>([])
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [questFilter, setQuestFilter] = useState<string>(questFilterParam || "all")

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [bulkAddDialogOpen, setBulkAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<WorkshopTaskWithDetails | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    workshop_quest_id: questFilterParam || "",
    task_template_id: "",
    custom_title: "",
    custom_description: "",
    custom_instructions: "",
    sequence_order: "0",
    status: "locked" as WorkshopItemStatus,
    scheduled_start: "",
    scheduled_end: "",
    duration_minutes: "",
    auto_unlock: false,
    unlock_on_previous_complete: true,
  })
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)

    // Fetch workshop quests with details
    const { data: questsData } = await supabase
      .from("workshop_quest")
      .select(`*, quest_template:quest_template(*), workshop:workshop(*)`)
      .order("sequence_order")

    if (questsData) setWorkshopQuests(questsData as WorkshopQuestWithDetails[])

    // Fetch task templates
    const { data: templatesData } = await supabase
      .from("task_template")
      .select("*")
      .eq("is_archived", false)
      .order("title")

    if (templatesData) setTaskTemplates(templatesData)

    // Fetch workshop tasks with details
    const { data: tasksData } = await supabase
      .from("workshop_task")
      .select(
        `*, task_template:task_template(*), workshop_quest:workshop_quest(*, quest_template:quest_template(*), workshop:workshop(*))`
      )
      .order("sequence_order")

    if (tasksData) {
      setWorkshopTasks(tasksData as WorkshopTaskWithDetails[])
      setFilteredTasks(tasksData as WorkshopTaskWithDetails[])
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    let filtered = workshopTasks

    if (searchQuery) {
      filtered = filtered.filter(
        (task) =>
          task.task_template?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.custom_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.workshop_quest?.quest_template?.title
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      )
    }

    if (questFilter !== "all") {
      filtered = filtered.filter((task) => task.workshop_quest_id === questFilter)
    }

    setFilteredTasks(filtered)
  }, [searchQuery, questFilter, workshopTasks])

  const handleAddTask = async () => {
    const { error } = await supabase.from("workshop_task").insert({
      workshop_quest_id: formData.workshop_quest_id,
      task_template_id: formData.task_template_id,
      custom_title: formData.custom_title || null,
      custom_description: formData.custom_description || null,
      custom_instructions: formData.custom_instructions || null,
      sequence_order: parseInt(formData.sequence_order) || 0,
      status: formData.status,
      scheduled_start: formData.scheduled_start || null,
      scheduled_end: formData.scheduled_end || null,
      duration_minutes: formData.duration_minutes
        ? parseInt(formData.duration_minutes)
        : null,
      auto_unlock: formData.auto_unlock,
      unlock_on_previous_complete: formData.unlock_on_previous_complete,
    })

    if (!error) {
      fetchData()
      setAddDialogOpen(false)
      resetForm()
    }
  }

  const handleEditTask = async () => {
    if (!selectedTask) return

    const { error } = await supabase
      .from("workshop_task")
      .update({
        custom_title: formData.custom_title || null,
        custom_description: formData.custom_description || null,
        custom_instructions: formData.custom_instructions || null,
        sequence_order: parseInt(formData.sequence_order) || 0,
        status: formData.status,
        scheduled_start: formData.scheduled_start || null,
        scheduled_end: formData.scheduled_end || null,
        duration_minutes: formData.duration_minutes
          ? parseInt(formData.duration_minutes)
          : null,
        auto_unlock: formData.auto_unlock,
        unlock_on_previous_complete: formData.unlock_on_previous_complete,
      })
      .eq("id", selectedTask.id)

    if (!error) {
      fetchData()
      setEditDialogOpen(false)
      setSelectedTask(null)
      resetForm()
    }
  }

  const handleBulkAdd = async () => {
    if (!formData.workshop_quest_id || selectedTaskIds.length === 0) return

    // Get current max sequence order
    const existingTasks = workshopTasks.filter(
      (t) => t.workshop_quest_id === formData.workshop_quest_id
    )
    let nextOrder =
      existingTasks.length > 0
        ? Math.max(...existingTasks.map((t) => t.sequence_order)) + 1
        : 0

    const tasks = selectedTaskIds.map((task_template_id) => ({
      workshop_quest_id: formData.workshop_quest_id,
      task_template_id,
      sequence_order: nextOrder++,
      status: "locked" as const,
      auto_unlock: false,
      unlock_on_previous_complete: true,
    }))

    const { error } = await supabase.from("workshop_task").insert(tasks)

    if (!error) {
      fetchData()
      setBulkAddDialogOpen(false)
      setFormData({ ...formData, workshop_quest_id: questFilterParam || "" })
      setSelectedTaskIds([])
    }
  }

  const handleDeleteTask = async () => {
    if (!selectedTask) return

    const { error } = await supabase
      .from("workshop_task")
      .delete()
      .eq("id", selectedTask.id)

    if (!error) {
      fetchData()
      setDeleteDialogOpen(false)
      setSelectedTask(null)
    }
  }

  const resetForm = () => {
    setFormData({
      workshop_quest_id: questFilterParam || "",
      task_template_id: "",
      custom_title: "",
      custom_description: "",
      custom_instructions: "",
      sequence_order: "0",
      status: "locked",
      scheduled_start: "",
      scheduled_end: "",
      duration_minutes: "",
      auto_unlock: false,
      unlock_on_previous_complete: true,
    })
  }

  const openEditDialog = (task: WorkshopTaskWithDetails) => {
    setSelectedTask(task)
    setFormData({
      workshop_quest_id: task.workshop_quest_id,
      task_template_id: task.task_template_id,
      custom_title: task.custom_title || "",
      custom_description: task.custom_description || "",
      custom_instructions: task.custom_instructions || "",
      sequence_order: task.sequence_order.toString(),
      status: task.status,
      scheduled_start: task.scheduled_start || "",
      scheduled_end: task.scheduled_end || "",
      duration_minutes: task.duration_minutes?.toString() || "",
      auto_unlock: task.auto_unlock,
      unlock_on_previous_complete: task.unlock_on_previous_complete,
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (task: WorkshopTaskWithDetails) => {
    setSelectedTask(task)
    setDeleteDialogOpen(true)
  }

  const getAvailableTaskTemplates = () => {
    if (!formData.workshop_quest_id) return taskTemplates
    const assignedTaskIds = workshopTasks
      .filter((t) => t.workshop_quest_id === formData.workshop_quest_id)
      .map((t) => t.task_template_id)
    return taskTemplates.filter((t) => !assignedTaskIds.includes(t.id))
  }

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
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

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "-"
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const renderTaskRow = (task: WorkshopTaskWithDetails) => {
    const statusConfig = getStatusConfig(task.status)
    const displayTitle = task.custom_title || task.task_template?.title
    const questTitle =
      task.workshop_quest?.custom_title || task.workshop_quest?.quest_template?.title

    return (
      <TableRow key={task.id}>
        <TableCell>
          <div>
            <Badge variant="outline" className="mb-1">
              <ScrollText className="w-3 h-3 mr-1" />
              {questTitle}
            </Badge>
            <p className="text-xs text-slate-500">
              {task.workshop_quest?.workshop?.name}
            </p>
          </div>
        </TableCell>
        <TableCell>
          <div>
            <p className="font-medium">{displayTitle || "Unknown Task"}</p>
            {task.custom_title && (
              <p className="text-xs text-slate-500">
                (from: {task.task_template?.title})
              </p>
            )}
            <p className="text-xs text-slate-400">Order: {task.sequence_order}</p>
          </div>
        </TableCell>
        <TableCell>
          {task.scheduled_start || task.scheduled_end ? (
            <div className="text-sm space-y-1">
              {task.scheduled_start && (
                <div className="flex items-center gap-1 text-green-600">
                  <Play className="w-3 h-3" />
                  {formatDateTime(task.scheduled_start)}
                </div>
              )}
              {task.scheduled_end && (
                <div className="flex items-center gap-1 text-red-600">
                  <Clock className="w-3 h-3" />
                  {formatDateTime(task.scheduled_end)}
                </div>
              )}
            </div>
          ) : (
            <span className="text-slate-400 text-sm">Not scheduled</span>
          )}
        </TableCell>
        <TableCell>
          <Badge variant="outline">
            <Timer className="w-3 h-3 mr-1" />
            {formatDuration(
              task.duration_minutes || task.task_template?.estimated_duration_minutes
            )}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge
            className={`${statusConfig.color} hover:${statusConfig.color} gap-1`}
          >
            {statusConfig.icon}
            {statusConfig.label}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex flex-col gap-1 text-xs">
            {task.auto_unlock && (
              <Badge variant="outline" className="w-fit text-blue-600">
                <Clock className="w-3 h-3 mr-1" />
                Auto-unlock
              </Badge>
            )}
            {task.unlock_on_previous_complete && (
              <Badge variant="outline" className="w-fit text-green-600">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Chain unlock
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          <AdminTableActions
            actions={[
              {
                label: "Edit",
                icon: <Settings className="w-4 h-4 mr-2" />,
                onClick: () => openEditDialog(task),
              },
              {
                label: "Remove",
                icon: <Trash2 className="w-4 h-4 mr-2" />,
                onClick: () => openDeleteDialog(task),
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
        title="Workshop Tasks"
        description="Manage task scheduling within workshop quests"
        actionLabel="Add Task"
        actionIcon={Plus}
        onAction={() => setAddDialogOpen(true)}
      />

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AdminQuickLinkCard
          href="/admin/task-templates"
          icon={ListTodo}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
          title="Task Templates"
          description="Create and manage reusable task templates"
        />
        <AdminQuickLinkCard
          href="/admin/workshop-quests"
          icon={ScrollText}
          iconBgColor="bg-amber-100"
          iconColor="text-amber-600"
          title="Workshop Quests"
          description="Manage quest assignments and scheduling"
        />
      </div>

      {/* Extra action button for bulk add */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setBulkAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Bulk Add Tasks
        </Button>
      </div>

      <AdminFilterCard
        searchPlaceholder="Search tasks..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            placeholder: "Filter by quest",
            value: questFilter,
            onChange: setQuestFilter,
            options: workshopQuests.map((wq) => ({
              value: wq.id,
              label: `${wq.workshop?.name} - ${wq.custom_title || wq.quest_template?.title}`,
            })),
            allLabel: "All Quests",
          },
        ]}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AdminStatCard
          icon={ScrollText}
          iconBgColor="bg-amber-100"
          iconColor="text-amber-600"
          value={workshopQuests.length}
          label="Workshop Quests"
        />
        <AdminStatCard
          icon={ListTodo}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
          value={taskTemplates.length}
          label="Task Templates"
        />
        <AdminStatCard
          icon={Calendar}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
          value={workshopTasks.length}
          label="Scheduled Tasks"
        />
      </div>

      <AdminDataTable
        title="Workshop Tasks"
        icon={ListTodo}
        columns={TASK_TABLE_COLUMNS}
        data={filteredTasks}
        loading={loading}
        emptyMessage="No tasks found. Add tasks to workshop quests to get started."
        renderRow={renderTaskRow}
      />

      {/* Add Task Dialog */}
      <AdminFormDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        title="Add Task to Quest"
        description="Select a workshop quest and task template. Configure scheduling and unlock behavior."
        onSubmit={handleAddTask}
        submitLabel="Add Task"
        submitDisabled={!formData.workshop_quest_id || !formData.task_template_id}
      >
        <div className="space-y-2">
          <Label>Workshop Quest</Label>
          <Select
            value={formData.workshop_quest_id}
            onValueChange={(value) =>
              setFormData({ ...formData, workshop_quest_id: value, task_template_id: "" })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a workshop quest" />
            </SelectTrigger>
            <SelectContent>
              {workshopQuests.map((wq) => (
                <SelectItem key={wq.id} value={wq.id}>
                  {wq.workshop?.name} - {wq.custom_title || wq.quest_template?.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Task Template</Label>
          <Select
            value={formData.task_template_id}
            onValueChange={(value) =>
              setFormData({ ...formData, task_template_id: value })
            }
            disabled={!formData.workshop_quest_id}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  formData.workshop_quest_id
                    ? "Select a task template"
                    : "Select a quest first"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {getAvailableTaskTemplates().map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  {task.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Custom Title (optional)</Label>
          <Input
            value={formData.custom_title}
            onChange={(e) =>
              setFormData({ ...formData, custom_title: e.target.value })
            }
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
              onChange={(e) =>
                setFormData({ ...formData, sequence_order: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              min="1"
              value={formData.duration_minutes}
              onChange={(e) =>
                setFormData({ ...formData, duration_minutes: e.target.value })
              }
              placeholder="Override template duration"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Scheduled Start</Label>
            <Input
              type="datetime-local"
              value={formData.scheduled_start}
              onChange={(e) =>
                setFormData({ ...formData, scheduled_start: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Scheduled End</Label>
            <Input
              type="datetime-local"
              value={formData.scheduled_end}
              onChange={(e) =>
                setFormData({ ...formData, scheduled_end: e.target.value })
              }
            />
          </div>
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
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-unlock at scheduled time</Label>
              <p className="text-xs text-slate-500">
                Automatically unlock this task when scheduled_start time is reached
              </p>
            </div>
            <Switch
              checked={formData.auto_unlock}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, auto_unlock: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Chain unlock on previous completion</Label>
              <p className="text-xs text-slate-500">
                Unlock this task when the previous task in sequence is completed
              </p>
            </div>
            <Switch
              checked={formData.unlock_on_previous_complete}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, unlock_on_previous_complete: checked })
              }
            />
          </div>
        </div>
      </AdminFormDialog>

      {/* Edit Task Dialog */}
      <AdminFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        title="Edit Task"
        description="Update task scheduling and configuration."
        onSubmit={handleEditTask}
        submitLabel="Save Changes"
      >
        <div className="space-y-2">
          <Label>Custom Title (optional)</Label>
          <Input
            value={formData.custom_title}
            onChange={(e) =>
              setFormData({ ...formData, custom_title: e.target.value })
            }
            placeholder="Override the template title"
          />
        </div>
        <div className="space-y-2">
          <Label>Custom Description (optional)</Label>
          <Textarea
            value={formData.custom_description}
            onChange={(e) =>
              setFormData({ ...formData, custom_description: e.target.value })
            }
            placeholder="Override the template description"
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label>Custom Instructions (optional)</Label>
          <Textarea
            value={formData.custom_instructions}
            onChange={(e) =>
              setFormData({ ...formData, custom_instructions: e.target.value })
            }
            placeholder="Override the template instructions"
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
              onChange={(e) =>
                setFormData({ ...formData, sequence_order: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              min="1"
              value={formData.duration_minutes}
              onChange={(e) =>
                setFormData({ ...formData, duration_minutes: e.target.value })
              }
              placeholder="Override template duration"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Scheduled Start</Label>
            <Input
              type="datetime-local"
              value={formData.scheduled_start}
              onChange={(e) =>
                setFormData({ ...formData, scheduled_start: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Scheduled End</Label>
            <Input
              type="datetime-local"
              value={formData.scheduled_end}
              onChange={(e) =>
                setFormData({ ...formData, scheduled_end: e.target.value })
              }
            />
          </div>
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
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-unlock at scheduled time</Label>
              <p className="text-xs text-slate-500">
                Automatically unlock when scheduled_start time is reached
              </p>
            </div>
            <Switch
              checked={formData.auto_unlock}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, auto_unlock: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Chain unlock on previous completion</Label>
              <p className="text-xs text-slate-500">
                Unlock when the previous task is completed
              </p>
            </div>
            <Switch
              checked={formData.unlock_on_previous_complete}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, unlock_on_previous_complete: checked })
              }
            />
          </div>
        </div>
      </AdminFormDialog>

      {/* Bulk Add Dialog */}
      <Dialog open={bulkAddDialogOpen} onOpenChange={setBulkAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Add Tasks</DialogTitle>
            <DialogDescription>
              Select a workshop quest and multiple task templates to add at once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Workshop Quest</Label>
              <Select
                value={formData.workshop_quest_id}
                onValueChange={(value) => {
                  setFormData({ ...formData, workshop_quest_id: value })
                  setSelectedTaskIds([])
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a workshop quest" />
                </SelectTrigger>
                <SelectContent>
                  {workshopQuests.map((wq) => (
                    <SelectItem key={wq.id} value={wq.id}>
                      {wq.workshop?.name} - {wq.custom_title || wq.quest_template?.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.workshop_quest_id && (
              <div className="space-y-2">
                <Label>Select Task Templates ({selectedTaskIds.length} selected)</Label>
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {getAvailableTaskTemplates().length === 0 ? (
                    <div className="p-4 text-center text-slate-500">
                      All task templates are already added to this quest.
                    </div>
                  ) : (
                    getAvailableTaskTemplates().map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 p-3 hover:bg-slate-50 border-b last:border-b-0"
                      >
                        <Checkbox
                          checked={selectedTaskIds.includes(task.id)}
                          onCheckedChange={() => toggleTaskSelection(task.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{task.title}</p>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            {task.task_type && <Badge variant="outline">{task.task_type}</Badge>}
                            {task.estimated_duration_minutes && (
                              <span>{formatDuration(task.estimated_duration_minutes)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkAdd}
              disabled={!formData.workshop_quest_id || selectedTaskIds.length === 0}
            >
              Add {selectedTaskIds.length} Task{selectedTaskIds.length !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remove Task"
        description={`Are you sure you want to remove "${selectedTask?.custom_title || selectedTask?.task_template?.title}" from the quest? This action cannot be undone.`}
        onConfirm={handleDeleteTask}
        confirmLabel="Remove"
      />
    </div>
  )
}
