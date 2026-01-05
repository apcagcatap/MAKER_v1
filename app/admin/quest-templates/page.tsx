"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Plus, ScrollText, Clock, ListTodo, Archive, ArchiveRestore, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  AdminPageHeader,
  AdminSearchCard,
  AdminDataTable,
  AdminFormDialog,
  AdminQuickLinkCard,
  ConfirmDeleteDialog,
  EditDeleteActions,
} from "@/components/admin"
import type { QuestTemplate } from "@/lib/types"

interface QuestTemplateWithCounts extends QuestTemplate {
  task_count?: number
  workshop_count?: number
}

const QUEST_TEMPLATE_COLUMNS = [
  { key: "title", label: "Title" },
  { key: "description", label: "Description" },
  { key: "duration", label: "Est. Duration" },
  { key: "tasks", label: "Tasks" },
  { key: "workshops", label: "In Workshops" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions", className: "w-[100px]" },
]

export default function QuestTemplatesPage() {
  const router = useRouter()
  const [questTemplates, setQuestTemplates] = useState<QuestTemplateWithCounts[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<QuestTemplateWithCounts[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showArchived, setShowArchived] = useState(false)

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<QuestTemplateWithCounts | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    estimated_duration_minutes: "",
  })

  const supabase = createClient()

  const fetchQuestTemplates = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from("quest_template")
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
          const { count: taskCount } = await supabase
            .from("quest_template_task")
            .select("*", { count: "exact", head: true })
            .eq("quest_template_id", template.id)

          const { count: workshopCount } = await supabase
            .from("workshop_quest")
            .select("*", { count: "exact", head: true })
            .eq("quest_template_id", template.id)

          return {
            ...template,
            task_count: taskCount || 0,
            workshop_count: workshopCount || 0,
          }
        })
      )

      setQuestTemplates(templatesWithCounts)
      setFilteredTemplates(templatesWithCounts)
    }
    setLoading(false)
  }, [supabase, showArchived])

  useEffect(() => {
    fetchQuestTemplates()
  }, [fetchQuestTemplates])

  useEffect(() => {
    const filtered = searchQuery
      ? questTemplates.filter(
          (template) =>
            template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : questTemplates

    setFilteredTemplates(filtered)
  }, [searchQuery, questTemplates])

  const handleCreateTemplate = async () => {
    const { error } = await supabase.from("quest_template").insert({
      title: formData.title,
      description: formData.description || null,
      estimated_duration_minutes: formData.estimated_duration_minutes
        ? parseInt(formData.estimated_duration_minutes)
        : null,
    })

    if (!error) {
      fetchQuestTemplates()
      setCreateDialogOpen(false)
      resetForm()
    }
  }

  const handleEditTemplate = async () => {
    if (!selectedTemplate) return

    const { error } = await supabase
      .from("quest_template")
      .update({
        title: formData.title,
        description: formData.description || null,
        estimated_duration_minutes: formData.estimated_duration_minutes
          ? parseInt(formData.estimated_duration_minutes)
          : null,
      })
      .eq("id", selectedTemplate.id)

    if (!error) {
      fetchQuestTemplates()
      setEditDialogOpen(false)
      setSelectedTemplate(null)
      resetForm()
    }
  }

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return

    try {
      console.log("Attempting to delete quest template:", selectedTemplate.id)
      
      const { data, error, status } = await supabase
        .from("quest_template")
        .delete()
        .eq("id", selectedTemplate.id)
        .select()

      console.log("Delete response:", { data, error, status })

      if (status === 409) {
        toast.error("Permission denied: You need admin privileges to delete templates")
        setDeleteDialogOpen(false)
        return
      }

      if (error) {
        console.error("Delete error:", error)
        toast.error(`Failed to delete: ${error.message} (Code: ${error.code})`)
        return
      }

      if (!data || data.length === 0) {
        toast.error("Delete failed: Permission denied or template not found")
        setDeleteDialogOpen(false)
        return
      }

      toast.success("Quest template deleted successfully")
      fetchQuestTemplates()
      setDeleteDialogOpen(false)
      setSelectedTemplate(null)
    } catch (err) {
      console.error("Delete exception:", err)
      toast.error("An unexpected error occurred while deleting")
    }
  }

  const handleToggleArchive = async (template: QuestTemplateWithCounts) => {
    const { error } = await supabase
      .from("quest_template")
      .update({ is_archived: !template.is_archived })
      .eq("id", template.id)

    if (!error) fetchQuestTemplates()
  }

  const resetForm = () => {
    setFormData({ title: "", description: "", estimated_duration_minutes: "" })
  }

  const openEditDialog = (template: QuestTemplateWithCounts) => {
    setSelectedTemplate(template)
    setFormData({
      title: template.title,
      description: template.description || "",
      estimated_duration_minutes: template.estimated_duration_minutes?.toString() || "",
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (template: QuestTemplateWithCounts) => {
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

  const renderTemplateRow = (template: QuestTemplateWithCounts) => (
    <TableRow
      key={template.id}
      className={`cursor-pointer hover:bg-slate-50 ${template.is_archived ? "opacity-60" : ""}`}
      onClick={() => router.push(`/admin/quest-templates/${template.id}`)}
    >
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {template.title}
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </div>
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
          <ListTodo className="w-3 h-3 mr-1" />
          {template.task_count}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">
          {template.workshop_count}
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
      <TableCell onClick={(e) => e.stopPropagation()}>
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
        title="Quest Templates"
        description="Create and manage reusable quest templates"
        actionLabel="Create Template"
        actionIcon={Plus}
        onAction={() => setCreateDialogOpen(true)}
      />

      <AdminQuickLinkCard
        href="/admin/task-templates"
        icon={ListTodo}
        iconBgColor="bg-purple-100"
        iconColor="text-purple-600"
        title="Manage Task Templates"
        description="Create reusable task templates that can be added to quests"
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <AdminSearchCard
            placeholder="Search quest templates..."
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
        title="Quest Templates"
        icon={ScrollText}
        columns={QUEST_TEMPLATE_COLUMNS}
        data={filteredTemplates}
        loading={loading}
        emptyMessage="No quest templates found. Create your first template to get started."
        renderRow={renderTemplateRow}
      />

      {/* Create Dialog */}
      <AdminFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        title="Create Quest Template"
        description="Create a reusable quest template. You can add tasks to it later."
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
            placeholder="Enter quest title"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter quest description (optional)"
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
            placeholder="e.g., 60"
          />
        </div>
      </AdminFormDialog>

      {/* Edit Dialog */}
      <AdminFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        title="Edit Quest Template"
        description="Update the quest template details."
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
            placeholder="Enter quest title"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-description">Description</Label>
          <Textarea
            id="edit-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter quest description (optional)"
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
            placeholder="e.g., 60"
          />
        </div>
      </AdminFormDialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Quest Template"
        description={`Are you sure you want to delete "${selectedTemplate?.title}"? This will also remove all task associations. Consider archiving instead if this template is used in workshops. This action cannot be undone.`}
        onConfirm={handleDeleteTemplate}
      />
    </div>
  )
}
