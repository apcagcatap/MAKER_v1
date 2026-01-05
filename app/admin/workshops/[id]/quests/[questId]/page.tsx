"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import {
  ArrowLeft,
  Clock,
  Plus,
  Trash2,
  Settings,
  Play,
  CheckCircle2,
  Lock,
  ListTodo,
  ScrollText,
  Calendar,
  Users,
  Presentation,
  MessageSquare,
  Wrench,
  User,
  SkipForward,
  GripVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { TableCell, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
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
  AdminDataTable,
  AdminFormDialog,
  ConfirmDeleteDialog,
  AdminTableActions,
  AdminStatCard,
} from "@/components/admin"
import type {
  Workshop,
  WorkshopQuest,
  WorkshopTask,
  QuestTemplate,
  TaskTemplate,
  WorkshopItemStatus,
  TaskType,
} from "@/lib/types"

interface WorkshopTaskWithDetails extends WorkshopTask {
  task_template: TaskTemplate
}

interface WorkshopQuestWithDetails extends WorkshopQuest {
  quest_template: QuestTemplate
  workshop: Workshop
}

const STATUS_OPTIONS: { value: WorkshopItemStatus; label: string; color: string; icon: React.ReactNode }[] = [
  { value: "locked", label: "Locked", color: "bg-slate-100 text-slate-700", icon: <Lock className="w-3 h-3" /> },
  { value: "open", label: "Open", color: "bg-blue-100 text-blue-700", icon: <Play className="w-3 h-3" /> },
  { value: "in_progress", label: "In Progress", color: "bg-amber-100 text-amber-700", icon: <Clock className="w-3 h-3" /> },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="w-3 h-3" /> },
  { value: "skipped", label: "Skipped", color: "bg-slate-100 text-slate-500", icon: <SkipForward className="w-3 h-3" /> },
]

const TASK_TYPE_ICONS: Record<TaskType, React.ReactNode> = {
  individual: <User className="w-4 h-4" />,
  group: <Users className="w-4 h-4" />,
  presentation: <Presentation className="w-4 h-4" />,
  discussion: <MessageSquare className="w-4 h-4" />,
  hands_on: <Wrench className="w-4 h-4" />,
}

const TASK_TABLE_COLUMNS = [
  { key: "order", label: "#", className: "w-[50px]" },
  { key: "task", label: "Task" },
  { key: "type", label: "Type" },
  { key: "schedule", label: "Schedule" },
  { key: "unlock", label: "Unlock" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions", className: "w-[100px]" },
]

export default function WorkshopQuestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const workshopId = params.id as string
  const questId = params.questId as string

  const [workshopQuest, setWorkshopQuest] = useState<WorkshopQuestWithDetails | null>(null)
  const [tasks, setTasks] = useState<WorkshopTaskWithDetails[]>([])
  const [availableTasks, setAvailableTasks] = useState<TaskTemplate[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [editQuestOpen, setEditQuestOpen] = useState(false)
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false)
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false)
  const [bulkAddTasksOpen, setBulkAddTasksOpen] = useState(false)
  const [deleteTaskDialogOpen, setDeleteTaskDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<WorkshopTaskWithDetails | null>(null)

  // Form states
  const [questForm, setQuestForm] = useState({
    custom_title: "",
    custom_description: "",
    sequence_order: "0",
    status: "locked" as WorkshopItemStatus,
    scheduled_start: "",
    scheduled_end: "",
  })

  const [taskForm, setTaskForm] = useState({
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

  const fetchWorkshopQuest = useCallback(async () => {
    const { data, error } = await supabase
      .from("workshop_quest")
      .select(`*, quest_template:quest_template(*), workshop:workshop(*)`)
      .eq("id", questId)
      .single()

    if (error || !data) {
      router.push(`/admin/workshops/${workshopId}`)
      return
    }

    setWorkshopQuest(data as WorkshopQuestWithDetails)
    setQuestForm({
      custom_title: data.custom_title || "",
      custom_description: data.custom_description || "",
      sequence_order: data.sequence_order.toString(),
      status: data.status,
      scheduled_start: data.scheduled_start || "",
      scheduled_end: data.scheduled_end || "",
    })
  }, [supabase, questId, workshopId, router])

  const fetchTasks = useCallback(async () => {
    const { data } = await supabase
      .from("workshop_task")
      .select(`*, task_template:task_template(*)`)
      .eq("workshop_quest_id", questId)
      .order("sequence_order")

    if (data) setTasks(data as WorkshopTaskWithDetails[])
  }, [supabase, questId])

  const fetchAvailableTasks = useCallback(async () => {
    // Get tasks from the quest template
    const { data: questTemplateTasks } = await supabase
      .from("quest_template_task")
      .select(`task_template:task_template(*)`)
      .eq("quest_template_id", workshopQuest?.quest_template_id)
      .order("sequence_order")

    // Also get all task templates for manual selection
    const { data: allTasks } = await supabase
      .from("task_template")
      .select("*")
      .eq("is_archived", false)
      .order("title")

    const assignedTaskIds = tasks.map((t) => t.task_template_id)
    
    if (allTasks) {
      setAvailableTasks(allTasks.filter((t) => !assignedTaskIds.includes(t.id)))
    }
  }, [supabase, workshopQuest?.quest_template_id, tasks])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchWorkshopQuest()
      await fetchTasks()
      setLoading(false)
    }
    loadData()
  }, [fetchWorkshopQuest, fetchTasks])

  useEffect(() => {
    if (workshopQuest) {
      fetchAvailableTasks()
    }
  }, [fetchAvailableTasks, workshopQuest])

  const handleUpdateQuest = async () => {
    const { error } = await supabase
      .from("workshop_quest")
      .update({
        custom_title: questForm.custom_title || null,
        custom_description: questForm.custom_description || null,
        sequence_order: parseInt(questForm.sequence_order) || 0,
        status: questForm.status,
        scheduled_start: questForm.scheduled_start || null,
        scheduled_end: questForm.scheduled_end || null,
      })
      .eq("id", questId)

    if (!error) {
      fetchWorkshopQuest()
      setEditQuestOpen(false)
    }
  }

  const handleAddTask = async () => {
    const existingOrders = tasks.map((t) => t.sequence_order)
    const nextOrder = existingOrders.length > 0 ? Math.max(...existingOrders) + 1 : 0

    const { error } = await supabase.from("workshop_task").insert({
      workshop_quest_id: questId,
      task_template_id: taskForm.task_template_id,
      custom_title: taskForm.custom_title || null,
      custom_description: taskForm.custom_description || null,
      custom_instructions: taskForm.custom_instructions || null,
      sequence_order: parseInt(taskForm.sequence_order) || nextOrder,
      status: taskForm.status,
      scheduled_start: taskForm.scheduled_start || null,
      scheduled_end: taskForm.scheduled_end || null,
      duration_minutes: taskForm.duration_minutes ? parseInt(taskForm.duration_minutes) : null,
      auto_unlock: taskForm.auto_unlock,
      unlock_on_previous_complete: taskForm.unlock_on_previous_complete,
    })

    if (!error) {
      fetchTasks()
      setAddTaskDialogOpen(false)
      resetTaskForm()
    }
  }

  const handleEditTask = async () => {
    if (!selectedTask) return

    const { error } = await supabase
      .from("workshop_task")
      .update({
        custom_title: taskForm.custom_title || null,
        custom_description: taskForm.custom_description || null,
        custom_instructions: taskForm.custom_instructions || null,
        sequence_order: parseInt(taskForm.sequence_order) || 0,
        status: taskForm.status,
        scheduled_start: taskForm.scheduled_start || null,
        scheduled_end: taskForm.scheduled_end || null,
        duration_minutes: taskForm.duration_minutes ? parseInt(taskForm.duration_minutes) : null,
        auto_unlock: taskForm.auto_unlock,
        unlock_on_previous_complete: taskForm.unlock_on_previous_complete,
      })
      .eq("id", selectedTask.id)

    if (!error) {
      fetchTasks()
      setEditTaskDialogOpen(false)
      setSelectedTask(null)
      resetTaskForm()
    }
  }

  const handleBulkAddTasks = async () => {
    if (selectedTaskIds.length === 0) return

    const existingOrders = tasks.map((t) => t.sequence_order)
    let nextOrder = existingOrders.length > 0 ? Math.max(...existingOrders) + 1 : 0

    const newTasks = selectedTaskIds.map((task_template_id) => ({
      workshop_quest_id: questId,
      task_template_id,
      sequence_order: nextOrder++,
      status: "locked" as const,
      auto_unlock: false,
      unlock_on_previous_complete: true,
    }))

    const { error } = await supabase.from("workshop_task").insert(newTasks)

    if (!error) {
      fetchTasks()
      setBulkAddTasksOpen(false)
      setSelectedTaskIds([])
    }
  }

  const handleDeleteTask = async () => {
    if (!selectedTask) return

    const { error } = await supabase.from("workshop_task").delete().eq("id", selectedTask.id)

    if (!error) {
      fetchTasks()
      setDeleteTaskDialogOpen(false)
      setSelectedTask(null)
    }
  }

  const handleImportFromTemplate = async () => {
    if (!workshopQuest?.quest_template_id) return

    // Get tasks from the quest template
    const { data: templateTasks } = await supabase
      .from("quest_template_task")
      .select(`*, task_template:task_template(*)`)
      .eq("quest_template_id", workshopQuest.quest_template_id)
      .order("sequence_order")

    if (!templateTasks || templateTasks.length === 0) return

    const existingTaskTemplateIds = tasks.map((t) => t.task_template_id)
    const newTasks = templateTasks
      .filter((tt) => !existingTaskTemplateIds.includes(tt.task_template_id))
      .map((tt, index) => ({
        workshop_quest_id: questId,
        task_template_id: tt.task_template_id,
        sequence_order: tasks.length + index,
        status: "locked" as const,
        auto_unlock: false,
        unlock_on_previous_complete: true,
      }))

    if (newTasks.length > 0) {
      const { error } = await supabase.from("workshop_task").insert(newTasks)
      if (!error) fetchTasks()
    }
  }

  const resetTaskForm = () => {
    setTaskForm({
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

  const openEditTaskDialog = (task: WorkshopTaskWithDetails) => {
    setSelectedTask(task)
    setTaskForm({
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
    setEditTaskDialogOpen(true)
  }

  const getStatusConfig = (status: WorkshopItemStatus) => {
    return STATUS_OPTIONS.find((opt) => opt.value === status) || STATUS_OPTIONS[0]
  }

  const formatDateTime = (dateTimeString: string | null) => {
    if (!dateTimeString) return null
    return new Date(dateTimeString).toLocaleString("en-US", {
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
    const displayTitle = task.custom_title || task.task_template?.title
    const statusConfig = getStatusConfig(task.status)
    const taskType = task.task_template?.task_type

    return (
      <TableRow key={task.id}>
        <TableCell className="font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-slate-300" />
            {task.sequence_order}
          </div>
        </TableCell>
        <TableCell>
          <div>
            <p className="font-medium">{displayTitle}</p>
            {task.custom_title && (
              <p className="text-xs text-slate-500">from: {task.task_template?.title}</p>
            )}
          </div>
        </TableCell>
        <TableCell>
          {taskType ? (
            <Badge variant="outline" className="gap-1">
              {TASK_TYPE_ICONS[taskType]}
              {taskType.replace("_", " ")}
            </Badge>
          ) : (
            <span className="text-slate-400">-</span>
          )}
        </TableCell>
        <TableCell>
          {task.scheduled_start || task.scheduled_end || task.duration_minutes ? (
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
              {task.duration_minutes && (
                <div className="text-xs text-slate-500">
                  Duration: {formatDuration(task.duration_minutes)}
                </div>
              )}
            </div>
          ) : (
            <span className="text-slate-400 text-sm">Not scheduled</span>
          )}
        </TableCell>
        <TableCell>
          <div className="text-xs space-y-1">
            {task.auto_unlock && (
              <Badge variant="outline" className="bg-blue-50 text-blue-600 text-xs">
                Auto
              </Badge>
            )}
            {task.unlock_on_previous_complete && (
              <Badge variant="outline" className="bg-purple-50 text-purple-600 text-xs">
                Chain
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          <Badge className={`${statusConfig.color} hover:${statusConfig.color} gap-1`}>
            {statusConfig.icon}
            {statusConfig.label}
          </Badge>
        </TableCell>
        <TableCell>
          <AdminTableActions
            actions={[
              {
                label: "Edit",
                icon: <Settings className="w-4 h-4 mr-2" />,
                onClick: () => openEditTaskDialog(task),
              },
              {
                label: "Remove",
                icon: <Trash2 className="w-4 h-4 mr-2" />,
                onClick: () => {
                  setSelectedTask(task)
                  setDeleteTaskDialogOpen(true)
                },
                variant: "destructive",
              },
            ]}
          />
        </TableCell>
      </TableRow>
    )
  }

  if (loading || !workshopQuest) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  const questStatusConfig = getStatusConfig(workshopQuest.status)
  const displayQuestTitle = workshopQuest.custom_title || workshopQuest.quest_template?.title

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/workshops/${workshopId}`}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link href={`/admin/workshops/${workshopId}`} className="hover:text-blue-600">
              {workshopQuest.workshop?.name}
            </Link>
            <span>/</span>
            <span>Quest</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{displayQuestTitle}</h1>
            <Badge className={`${questStatusConfig.color} hover:${questStatusConfig.color}`}>
              {questStatusConfig.icon}
              {questStatusConfig.label}
            </Badge>
          </div>
          {workshopQuest.custom_title && (
            <p className="text-sm text-slate-500 mt-1">
              Based on template: {workshopQuest.quest_template?.title}
            </p>
          )}
        </div>
        <Button variant="outline" onClick={() => setEditQuestOpen(true)}>
          <Settings className="w-4 h-4 mr-2" />
          Quest Settings
        </Button>
      </div>

      {/* Quest Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Workshop</p>
                <p className="font-medium">{workshopQuest.workshop?.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Play className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Starts</p>
                <p className="font-medium">
                  {formatDateTime(workshopQuest.scheduled_start) || "Not set"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Clock className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Ends</p>
                <p className="font-medium">
                  {formatDateTime(workshopQuest.scheduled_end) || "Not set"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ListTodo className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Tasks</p>
                <p className="font-medium">{tasks.length} tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AdminStatCard
          icon={Lock}
          iconBgColor="bg-slate-100"
          iconColor="text-slate-600"
          value={tasks.filter((t) => t.status === "locked").length}
          label="Locked"
        />
        <AdminStatCard
          icon={Play}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          value={tasks.filter((t) => t.status === "open").length}
          label="Open"
        />
        <AdminStatCard
          icon={Clock}
          iconBgColor="bg-amber-100"
          iconColor="text-amber-600"
          value={tasks.filter((t) => t.status === "in_progress").length}
          label="In Progress"
        />
        <AdminStatCard
          icon={CheckCircle2}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
          value={tasks.filter((t) => t.status === "completed").length}
          label="Completed"
        />
      </div>

      {/* Tasks Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Tasks</h3>
            <p className="text-sm text-slate-500">
              Manage tasks and their scheduling for this quest
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleImportFromTemplate}>
              <ScrollText className="w-4 h-4 mr-2" />
              Import from Template
            </Button>
            <Button variant="outline" onClick={() => setBulkAddTasksOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Bulk Add
            </Button>
            <Button onClick={() => setAddTaskDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>

        <AdminDataTable
          title="Tasks"
          icon={ListTodo}
          columns={TASK_TABLE_COLUMNS}
          data={tasks}
          loading={false}
          emptyMessage="No tasks added yet. Add tasks or import from the quest template."
          renderRow={renderTaskRow}
        />
      </div>

      {/* Edit Quest Dialog */}
      <AdminFormDialog
        open={editQuestOpen}
        onOpenChange={setEditQuestOpen}
        title="Quest Settings"
        description="Update quest scheduling and status"
        onSubmit={handleUpdateQuest}
        submitLabel="Save Changes"
      >
        <div className="space-y-2">
          <Label>Custom Title (optional)</Label>
          <Input
            value={questForm.custom_title}
            onChange={(e) => setQuestForm({ ...questForm, custom_title: e.target.value })}
            placeholder="Override the template title"
          />
        </div>
        <div className="space-y-2">
          <Label>Custom Description (optional)</Label>
          <Textarea
            value={questForm.custom_description}
            onChange={(e) => setQuestForm({ ...questForm, custom_description: e.target.value })}
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
              value={questForm.sequence_order}
              onChange={(e) => setQuestForm({ ...questForm, sequence_order: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={questForm.status}
              onValueChange={(value: WorkshopItemStatus) =>
                setQuestForm({ ...questForm, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.slice(0, 4).map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
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
              value={questForm.scheduled_start}
              onChange={(e) => setQuestForm({ ...questForm, scheduled_start: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Scheduled End</Label>
            <Input
              type="datetime-local"
              value={questForm.scheduled_end}
              onChange={(e) => setQuestForm({ ...questForm, scheduled_end: e.target.value })}
            />
          </div>
        </div>
      </AdminFormDialog>

      {/* Add Task Dialog */}
      <AdminFormDialog
        open={addTaskDialogOpen}
        onOpenChange={setAddTaskDialogOpen}
        title="Add Task"
        description="Select a task template and configure scheduling"
        onSubmit={handleAddTask}
        submitLabel="Add Task"
        submitDisabled={!taskForm.task_template_id}
      >
        <div className="space-y-2">
          <Label>Task Template</Label>
          <Select
            value={taskForm.task_template_id}
            onValueChange={(value) => setTaskForm({ ...taskForm, task_template_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a task" />
            </SelectTrigger>
            <SelectContent>
              {availableTasks.map((task) => (
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
            value={taskForm.custom_title}
            onChange={(e) => setTaskForm({ ...taskForm, custom_title: e.target.value })}
            placeholder="Override the template title"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Sequence Order</Label>
            <Input
              type="number"
              min="0"
              value={taskForm.sequence_order}
              onChange={(e) => setTaskForm({ ...taskForm, sequence_order: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              min="1"
              value={taskForm.duration_minutes}
              onChange={(e) => setTaskForm({ ...taskForm, duration_minutes: e.target.value })}
              placeholder="e.g., 30"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Scheduled Start</Label>
            <Input
              type="datetime-local"
              value={taskForm.scheduled_start}
              onChange={(e) => setTaskForm({ ...taskForm, scheduled_start: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Scheduled End</Label>
            <Input
              type="datetime-local"
              value={taskForm.scheduled_end}
              onChange={(e) => setTaskForm({ ...taskForm, scheduled_end: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto Unlock</Label>
              <p className="text-xs text-slate-500">Unlock automatically at scheduled start</p>
            </div>
            <Switch
              checked={taskForm.auto_unlock}
              onCheckedChange={(checked) => setTaskForm({ ...taskForm, auto_unlock: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Chain Unlock</Label>
              <p className="text-xs text-slate-500">Unlock when previous task completes</p>
            </div>
            <Switch
              checked={taskForm.unlock_on_previous_complete}
              onCheckedChange={(checked) =>
                setTaskForm({ ...taskForm, unlock_on_previous_complete: checked })
              }
            />
          </div>
        </div>
      </AdminFormDialog>

      {/* Edit Task Dialog */}
      <AdminFormDialog
        open={editTaskDialogOpen}
        onOpenChange={setEditTaskDialogOpen}
        title="Edit Task"
        description="Update task settings and scheduling"
        onSubmit={handleEditTask}
        submitLabel="Save Changes"
      >
        <div className="space-y-2">
          <Label>Custom Title (optional)</Label>
          <Input
            value={taskForm.custom_title}
            onChange={(e) => setTaskForm({ ...taskForm, custom_title: e.target.value })}
            placeholder="Override the template title"
          />
        </div>
        <div className="space-y-2">
          <Label>Custom Description (optional)</Label>
          <Textarea
            value={taskForm.custom_description}
            onChange={(e) => setTaskForm({ ...taskForm, custom_description: e.target.value })}
            placeholder="Override the template description"
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label>Custom Instructions (optional)</Label>
          <Textarea
            value={taskForm.custom_instructions}
            onChange={(e) => setTaskForm({ ...taskForm, custom_instructions: e.target.value })}
            placeholder="Override the template instructions"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Order</Label>
            <Input
              type="number"
              min="0"
              value={taskForm.sequence_order}
              onChange={(e) => setTaskForm({ ...taskForm, sequence_order: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Duration</Label>
            <Input
              type="number"
              min="1"
              value={taskForm.duration_minutes}
              onChange={(e) => setTaskForm({ ...taskForm, duration_minutes: e.target.value })}
              placeholder="min"
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={taskForm.status}
              onValueChange={(value: WorkshopItemStatus) =>
                setTaskForm({ ...taskForm, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
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
              value={taskForm.scheduled_start}
              onChange={(e) => setTaskForm({ ...taskForm, scheduled_start: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Scheduled End</Label>
            <Input
              type="datetime-local"
              value={taskForm.scheduled_end}
              onChange={(e) => setTaskForm({ ...taskForm, scheduled_end: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto Unlock</Label>
              <p className="text-xs text-slate-500">Unlock automatically at scheduled start</p>
            </div>
            <Switch
              checked={taskForm.auto_unlock}
              onCheckedChange={(checked) => setTaskForm({ ...taskForm, auto_unlock: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Chain Unlock</Label>
              <p className="text-xs text-slate-500">Unlock when previous task completes</p>
            </div>
            <Switch
              checked={taskForm.unlock_on_previous_complete}
              onCheckedChange={(checked) =>
                setTaskForm({ ...taskForm, unlock_on_previous_complete: checked })
              }
            />
          </div>
        </div>
      </AdminFormDialog>

      {/* Bulk Add Tasks Dialog */}
      <Dialog open={bulkAddTasksOpen} onOpenChange={setBulkAddTasksOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Add Tasks</DialogTitle>
            <DialogDescription>Select multiple task templates to add at once</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Task Templates ({selectedTaskIds.length} selected)</Label>
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                {availableTasks.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">
                    No more task templates available.
                  </div>
                ) : (
                  availableTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 border-b last:border-b-0"
                    >
                      <Checkbox
                        checked={selectedTaskIds.includes(task.id)}
                        onCheckedChange={() =>
                          setSelectedTaskIds((prev) =>
                            prev.includes(task.id)
                              ? prev.filter((id) => id !== task.id)
                              : [...prev, task.id]
                          )
                        }
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{task.title}</p>
                          {task.task_type && (
                            <Badge variant="outline" className="text-xs">
                              {task.task_type.replace("_", " ")}
                            </Badge>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-slate-500 truncate">{task.description}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAddTasksOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAddTasks} disabled={selectedTaskIds.length === 0}>
              Add {selectedTaskIds.length} Task{selectedTaskIds.length !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Task Confirmation */}
      <ConfirmDeleteDialog
        open={deleteTaskDialogOpen}
        onOpenChange={setDeleteTaskDialogOpen}
        title="Remove Task"
        description={`Are you sure you want to remove "${selectedTask?.custom_title || selectedTask?.task_template?.title}" from this quest?`}
        onConfirm={handleDeleteTask}
        confirmLabel="Remove"
      />
    </div>
  )
}
