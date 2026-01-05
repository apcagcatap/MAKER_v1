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
  ListTodo,
  ScrollText,
  Calendar,
  Users,
  Presentation,
  MessageSquare,
  Wrench,
  User,
  GripVertical,
  Archive,
  ArchiveRestore,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { TableCell, TableRow } from "@/components/ui/table"
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
  AdminDataTable,
  AdminFormDialog,
  ConfirmDeleteDialog,
  AdminTableActions,
  AdminStatCard,
} from "@/components/admin"
import type { QuestTemplate, TaskTemplate, TaskType } from "@/lib/types"

interface QuestTemplateTask {
  id: string
  quest_template_id: string
  task_template_id: string
  sequence_order: number
  task_template?: TaskTemplate
}

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
  { key: "duration", label: "Duration" },
  { key: "actions", label: "Actions", className: "w-[100px]" },
]

export default function QuestTemplateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.id as string

  const [questTemplate, setQuestTemplate] = useState<QuestTemplate | null>(null)
  const [tasks, setTasks] = useState<QuestTemplateTask[]>([])
  const [availableTasks, setAvailableTasks] = useState<TaskTemplate[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [editTemplateOpen, setEditTemplateOpen] = useState(false)
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false)
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false)
  const [bulkAddTasksOpen, setBulkAddTasksOpen] = useState(false)
  const [deleteTaskDialogOpen, setDeleteTaskDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<QuestTemplateTask | null>(null)

  // Form states
  const [templateForm, setTemplateForm] = useState({
    title: "",
    description: "",
    estimated_duration_minutes: "",
  })

  const [taskForm, setTaskForm] = useState({
    task_template_id: "",
    sequence_order: "0",
  })

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])

  const supabase = createClient()

  const fetchQuestTemplate = useCallback(async () => {
    const { data, error } = await supabase
      .from("quest_template")
      .select("*")
      .eq("id", templateId)
      .single()

    if (error || !data) {
      router.push("/admin/quest-templates")
      return
    }

    setQuestTemplate(data)
    setTemplateForm({
      title: data.title,
      description: data.description || "",
      estimated_duration_minutes: data.estimated_duration_minutes?.toString() || "",
    })
  }, [supabase, templateId, router])

  const fetchTasks = useCallback(async () => {
    const { data } = await supabase
      .from("quest_template_task")
      .select(`*, task_template:task_template(*)`)
      .eq("quest_template_id", templateId)
      .order("sequence_order")

    if (data) setTasks(data)
  }, [supabase, templateId])

  const fetchAvailableTasks = useCallback(async () => {
    const { data } = await supabase
      .from("task_template")
      .select("*")
      .eq("is_archived", false)
      .order("title")

    const assignedTaskIds = tasks.map((t) => t.task_template_id)

    if (data) {
      setAvailableTasks(data.filter((t) => !assignedTaskIds.includes(t.id)))
    }
  }, [supabase, tasks])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchQuestTemplate()
      await fetchTasks()
      setLoading(false)
    }
    loadData()
  }, [fetchQuestTemplate, fetchTasks])

  useEffect(() => {
    if (questTemplate) {
      fetchAvailableTasks()
    }
  }, [fetchAvailableTasks, questTemplate])

  const handleUpdateTemplate = async () => {
    const { error } = await supabase
      .from("quest_template")
      .update({
        title: templateForm.title,
        description: templateForm.description || null,
        estimated_duration_minutes: templateForm.estimated_duration_minutes
          ? parseInt(templateForm.estimated_duration_minutes)
          : null,
      })
      .eq("id", templateId)

    if (!error) {
      fetchQuestTemplate()
      setEditTemplateOpen(false)
    }
  }

  const handleToggleArchive = async () => {
    if (!questTemplate) return

    const { error } = await supabase
      .from("quest_template")
      .update({ is_archived: !questTemplate.is_archived })
      .eq("id", templateId)

    if (!error) {
      fetchQuestTemplate()
    }
  }

  const handleAddTask = async () => {
    const existingOrders = tasks.map((t) => t.sequence_order)
    const nextOrder = existingOrders.length > 0 ? Math.max(...existingOrders) + 1 : 0

    const { error } = await supabase.from("quest_template_task").insert({
      quest_template_id: templateId,
      task_template_id: taskForm.task_template_id,
      sequence_order: parseInt(taskForm.sequence_order) || nextOrder,
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
      .from("quest_template_task")
      .update({
        sequence_order: parseInt(taskForm.sequence_order) || 0,
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
      quest_template_id: templateId,
      task_template_id,
      sequence_order: nextOrder++,
    }))

    const { error } = await supabase.from("quest_template_task").insert(newTasks)

    if (!error) {
      fetchTasks()
      setBulkAddTasksOpen(false)
      setSelectedTaskIds([])
    }
  }

  const handleDeleteTask = async () => {
    if (!selectedTask) return

    const { error } = await supabase
      .from("quest_template_task")
      .delete()
      .eq("id", selectedTask.id)

    if (!error) {
      fetchTasks()
      setDeleteTaskDialogOpen(false)
      setSelectedTask(null)
    }
  }

  const resetTaskForm = () => {
    setTaskForm({
      task_template_id: "",
      sequence_order: "0",
    })
  }

  const openEditTaskDialog = (task: QuestTemplateTask) => {
    setSelectedTask(task)
    setTaskForm({
      task_template_id: task.task_template_id,
      sequence_order: task.sequence_order.toString(),
    })
    setEditTaskDialogOpen(true)
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "-"
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const calculateTotalDuration = () => {
    return tasks.reduce((total, task) => {
      return total + (task.task_template?.estimated_duration_minutes || 0)
    }, 0)
  }

  const renderTaskRow = (task: QuestTemplateTask) => {
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
            <p className="font-medium">{task.task_template?.title}</p>
            {task.task_template?.description && (
              <p className="text-xs text-slate-500 truncate max-w-xs">
                {task.task_template.description}
              </p>
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
          <span className="text-sm">
            {formatDuration(task.task_template?.estimated_duration_minutes || null)}
          </span>
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

  if (loading || !questTemplate) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/quest-templates">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link href="/admin/quest-templates" className="hover:text-blue-600">
              Quest Templates
            </Link>
            <span>/</span>
            <span>{questTemplate.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{questTemplate.title}</h1>
            {questTemplate.is_archived && (
              <Badge variant="outline" className="bg-slate-100 text-slate-600">
                <Archive className="w-3 h-3 mr-1" />
                Archived
              </Badge>
            )}
          </div>
          {questTemplate.description && (
            <p className="text-sm text-slate-500 mt-1">{questTemplate.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleToggleArchive}
            className={questTemplate.is_archived ? "text-green-600" : "text-slate-600"}
          >
            {questTemplate.is_archived ? (
              <>
                <ArchiveRestore className="w-4 h-4 mr-2" />
                Restore
              </>
            ) : (
              <>
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => setEditTemplateOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Edit Template
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ListTodo className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Tasks</p>
                <p className="font-medium">{tasks.length} tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Est. Duration</p>
                <p className="font-medium">
                  {formatDuration(questTemplate.estimated_duration_minutes || null)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Calculated Duration</p>
                <p className="font-medium">{formatDuration(calculateTotalDuration())}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Template Tasks</h3>
            <p className="text-sm text-slate-500">
              Define the default task sequence for this quest template
            </p>
          </div>
          <div className="flex gap-2">
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
          emptyMessage="No tasks added yet. Add tasks to define the quest structure."
          renderRow={renderTaskRow}
        />
      </div>

      {/* Edit Template Dialog */}
      <AdminFormDialog
        open={editTemplateOpen}
        onOpenChange={setEditTemplateOpen}
        title="Edit Quest Template"
        description="Update the quest template details"
        onSubmit={handleUpdateTemplate}
        submitLabel="Save Changes"
      >
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={templateForm.title}
            onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
            placeholder="Quest title"
          />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={templateForm.description}
            onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
            placeholder="Describe the quest..."
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>Estimated Duration (minutes)</Label>
          <Input
            type="number"
            min="1"
            value={templateForm.estimated_duration_minutes}
            onChange={(e) =>
              setTemplateForm({ ...templateForm, estimated_duration_minutes: e.target.value })
            }
            placeholder="e.g., 60"
          />
        </div>
      </AdminFormDialog>

      {/* Add Task Dialog */}
      <AdminFormDialog
        open={addTaskDialogOpen}
        onOpenChange={setAddTaskDialogOpen}
        title="Add Task to Template"
        description="Select a task template to add to this quest"
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
          <Label>Sequence Order</Label>
          <Input
            type="number"
            min="0"
            value={taskForm.sequence_order}
            onChange={(e) => setTaskForm({ ...taskForm, sequence_order: e.target.value })}
          />
        </div>
      </AdminFormDialog>

      {/* Edit Task Dialog */}
      <AdminFormDialog
        open={editTaskDialogOpen}
        onOpenChange={setEditTaskDialogOpen}
        title="Edit Task"
        description="Update task settings"
        onSubmit={handleEditTask}
        submitLabel="Save Changes"
      >
        <div className="space-y-2">
          <Label>Task</Label>
          <Input value={selectedTask?.task_template?.title || ""} disabled />
        </div>
        <div className="space-y-2">
          <Label>Sequence Order</Label>
          <Input
            type="number"
            min="0"
            value={taskForm.sequence_order}
            onChange={(e) => setTaskForm({ ...taskForm, sequence_order: e.target.value })}
          />
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
        description={`Are you sure you want to remove "${selectedTask?.task_template?.title}" from this quest template?`}
        onConfirm={handleDeleteTask}
        confirmLabel="Remove"
      />
    </div>
  )
}
