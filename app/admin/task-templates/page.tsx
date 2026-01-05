"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Plus,
  ListTodo,
  Clock,
  ScrollText,
  Archive,
  ArchiveRestore,
  Users,
  Presentation,
  MessageSquare,
  Wrench,
  User,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AdminPageHeader,
  AdminSearchCard,
  AdminDataTable,
  AdminFormDialog,
  AdminQuickLinkCard,
  ConfirmDeleteDialog,
  EditDeleteActions,
} from "@/components/admin"
import type { TaskTemplate, TaskType } from "@/lib/types"

interface TaskTemplateWithCounts extends TaskTemplate {
  quest_count?: number
}

const TASK_TYPE_OPTIONS: { value: TaskType; label: string; icon: React.ReactNode }[] = [
  { value: "individual", label: "Individual", icon: <User className="w-4 h-4" /> },
  { value: "group", label: "Group", icon: <Users className="w-4 h-4" /> },
  { value: "presentation", label: "Presentation", icon: <Presentation className="w-4 h-4" /> },
  { value: "discussion", label: "Discussion", icon: <MessageSquare className="w-4 h-4" /> },
  { value: "hands_on", label: "Hands-on", icon: <Wrench className="w-4 h-4" /> },
]

const TASK_TEMPLATE_COLUMNS = [
  { key: "title", label: "Title" },
  { key: "type", label: "Type" },
  { key: "description", label: "Description" },
  { key: "duration", label: "Est. Duration" },
  { key: "quests", label: "In Quests" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions", className: "w-[100px]" },
]

export default function TaskTemplatesPage() {
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplateWithCounts[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<TaskTemplateWithCounts[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showArchived, setShowArchived] = useState(false)

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplateWithCounts | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    task_type: "" as TaskType | "",
    estimated_duration_minutes: "",
  })

  const supabase = createClient()

  const fetchTaskTemplates = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from("task_template")
      .select("*")
      .order("created_at", { ascending: false })

    if (!showArchived) {
      query = query.eq("is_archived", false)
    }

    const { data, error } = await query

    if (!error && data) {
      // Fetch counts for each template
      const templatesWithCounts = await Promise.all(
        data.map(async (template) => {
          const { count: questCount } = await supabase
            .from("quest_template_task")
            .select("*", { count: "exact", head: true })
            .eq("task_template_id", template.id)

          return {
            ...template,
            quest_count: questCount || 0,
          }
        })
      )

      setTaskTemplates(templatesWithCounts)
      setFilteredTemplates(templatesWithCounts)
    }
    setLoading(false)
  }, [supabase, showArchived])

  useEffect(() => {
    fetchTaskTemplates()
  }, [fetchTaskTemplates])

  useEffect(() => {
    const filtered = searchQuery
      ? taskTemplates.filter(
          (template) =>
            template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : taskTemplates

    setFilteredTemplates(filtered)
  }, [searchQuery, taskTemplates])

  const handleCreateTemplate = async () => {
    const { error } = await supabase.from("task_template").insert({
      title: formData.title,
      description: formData.description || null,
      instructions: formData.instructions || null,
      task_type: formData.task_type || null,
      estimated_duration_minutes: formData.estimated_duration_minutes
        ? parseInt(formData.estimated_duration_minutes)
        : null,
    })

    if (!error) {
      fetchTaskTemplates()
      setCreateDialogOpen(false)
      resetForm()
    }
  }

  const handleEditTemplate = async () => {
    if (!selectedTemplate) return

    const { error } = await supabase
      .from("task_template")
      .update({
        title: formData.title,
        description: formData.description || null,
        instructions: formData.instructions || null,
        task_type: formData.task_type || null,
        estimated_duration_minutes: formData.estimated_duration_minutes
          ? parseInt(formData.estimated_duration_minutes)
          : null,
      })
      .eq("id", selectedTemplate.id)

    if (!error) {
      fetchTaskTemplates()
      setEditDialogOpen(false)
      setSelectedTemplate(null)
      resetForm()
    }
  }

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return

    const { error } = await supabase
      .from("task_template")
      .delete()
      .eq("id", selectedTemplate.id)

    if (!error) {
      fetchTaskTemplates()
      setDeleteDialogOpen(false)
      setSelectedTemplate(null)
    }
  }

  const handleToggleArchive = async (template: TaskTemplateWithCounts) => {
    const { error } = await supabase
      .from("task_template")
      .update({ is_archived: !template.is_archived })
      .eq("id", template.id)

    if (!error) fetchTaskTemplates()
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      instructions: "",
      task_type: "",
      estimated_duration_minutes: "",
    })
  }

  const openEditDialog = (template: TaskTemplateWithCounts) => {
    setSelectedTemplate(template)
    setFormData({
      title: template.title,
      description: template.description || "",
      instructions: template.instructions || "",
      task_type: template.task_type || "",
      estimated_duration_minutes: template.estimated_duration_minutes?.toString() || "",
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (template: TaskTemplateWithCounts) => {
    setSelectedTemplate(template)
    setDeleteDialogOpen(true)
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "-"
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const getTaskTypeIcon = (taskType: TaskType | null) => {
    const option = TASK_TYPE_OPTIONS.find((opt) => opt.value === taskType)
    return option?.icon || null
  }

  const getTaskTypeLabel = (taskType: TaskType | null) => {
    const option = TASK_TYPE_OPTIONS.find((opt) => opt.value === taskType)
    return option?.label || "-"
  }

  const renderTemplateRow = (template: TaskTemplateWithCounts) => (
    <TableRow key={template.id} className={template.is_archived ? "opacity-60" : ""}>
      <TableCell className="font-medium">{template.title}</TableCell>
      <TableCell>
        {template.task_type ? (
          <Badge variant="outline" className="gap-1">
            {getTaskTypeIcon(template.task_type)}
            {getTaskTypeLabel(template.task_type)}
          </Badge>
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell className="max-w-xs truncate">
        {template.description || "-"}
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          <Clock className="w-3 h-3 mr-1" />
          {formatDuration(template.estimated_duration_minutes)}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">
          <ScrollText className="w-3 h-3 mr-1" />
          {template.quest_count}
        </Badge>
      </TableCell>
      <TableCell>
        {template.is_archived ? (
          <Badge variant="outline" className="text-slate-500">
            Archived
          </Badge>
        ) : (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            Active
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleToggleArchive(template)}
            title={template.is_archived ? "Restore" : "Archive"}
          >
            {template.is_archived ? (
              <ArchiveRestore className="w-4 h-4" />
            ) : (
              <Archive className="w-4 h-4" />
            )}
          </Button>
          <EditDeleteActions
            onEdit={() => openEditDialog(template)}
            onDelete={() => openDeleteDialog(template)}
          />
        </div>
      </TableCell>
    </TableRow>
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Task Templates"
        description="Create and manage reusable task templates"
        actionLabel="Create Template"
        actionIcon={Plus}
        onAction={() => setCreateDialogOpen(true)}
      />

      <AdminQuickLinkCard
        href="/admin/quest-templates"
        icon={ScrollText}
        iconBgColor="bg-amber-100"
        iconColor="text-amber-600"
        title="Manage Quest Templates"
        description="Create quest templates and assign tasks to them"
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <AdminSearchCard
            placeholder="Search task templates..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
        <div className="flex items-center gap-2 p-4 bg-white border rounded-lg">
          <Switch
            checked={showArchived}
            onCheckedChange={setShowArchived}
            id="show-archived"
          />
          <Label htmlFor="show-archived" className="text-sm cursor-pointer">
            Show archived
          </Label>
        </div>
      </div>

      <AdminDataTable
        title="Task Templates"
        icon={ListTodo}
        columns={TASK_TEMPLATE_COLUMNS}
        data={filteredTemplates}
        loading={loading}
        emptyMessage="No task templates found. Create your first template to get started."
        renderRow={renderTemplateRow}
      />

      {/* Create Dialog */}
      <AdminFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        title="Create Task Template"
        description="Create a reusable task template that can be added to quests."
        onSubmit={handleCreateTemplate}
        submitLabel="Create Template"
        submitDisabled={!formData.title}
      >
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter task title"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="task_type">Task Type</Label>
          <Select
            value={formData.task_type}
            onValueChange={(value: TaskType) =>
              setFormData({ ...formData, task_type: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select task type" />
            </SelectTrigger>
            <SelectContent>
              {TASK_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of the task"
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="instructions">Instructions</Label>
          <Textarea
            id="instructions"
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            placeholder="Detailed instructions for participants"
            rows={4}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration">Estimated Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            min="1"
            value={formData.estimated_duration_minutes}
            onChange={(e) =>
              setFormData({ ...formData, estimated_duration_minutes: e.target.value })
            }
            placeholder="e.g., 30"
          />
        </div>
      </AdminFormDialog>

      {/* Edit Dialog */}
      <AdminFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        title="Edit Task Template"
        description="Update the task template details."
        onSubmit={handleEditTemplate}
        submitLabel="Save Changes"
        submitDisabled={!formData.title}
      >
        <div className="space-y-2">
          <Label htmlFor="edit-title">Title</Label>
          <Input
            id="edit-title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter task title"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-task_type">Task Type</Label>
          <Select
            value={formData.task_type}
            onValueChange={(value: TaskType) =>
              setFormData({ ...formData, task_type: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select task type" />
            </SelectTrigger>
            <SelectContent>
              {TASK_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-description">Description</Label>
          <Textarea
            id="edit-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of the task"
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-instructions">Instructions</Label>
          <Textarea
            id="edit-instructions"
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            placeholder="Detailed instructions for participants"
            rows={4}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-duration">Estimated Duration (minutes)</Label>
          <Input
            id="edit-duration"
            type="number"
            min="1"
            value={formData.estimated_duration_minutes}
            onChange={(e) =>
              setFormData({ ...formData, estimated_duration_minutes: e.target.value })
            }
            placeholder="e.g., 30"
          />
        </div>
      </AdminFormDialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Task Template"
        description={`Are you sure you want to delete "${selectedTemplate?.title}"? This will also remove all quest associations. Consider archiving instead. This action cannot be undone.`}
        onConfirm={handleDeleteTemplate}
      />
    </div>
  )
}
