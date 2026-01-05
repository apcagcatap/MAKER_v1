"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, ScrollText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { TableCell, TableRow } from "@/components/ui/table"
import {
  AdminPageHeader,
  AdminSearchCard,
  AdminDataTable,
  AdminFormDialog,
  ConfirmDeleteDialog,
  EditDeleteActions,
} from "@/components/admin"
import type { Quest } from "@/lib/types"

const QUEST_TABLE_COLUMNS = [
  { key: "title", label: "Title" },
  { key: "description", label: "Description" },
  { key: "created_at", label: "Created At" },
  { key: "actions", label: "Actions", className: "w-[80px]" },
]

export default function QuestManagementPage() {
  const [quests, setQuests] = useState<Quest[]>([])
  const [filteredQuests, setFilteredQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  })

  const supabase = createClient()

  const fetchQuests = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("quest")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setQuests(data)
      setFilteredQuests(data)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchQuests()
  }, [fetchQuests])

  useEffect(() => {
    const filtered = searchQuery
      ? quests.filter(
          (quest) =>
            quest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            quest.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : quests

    setFilteredQuests(filtered)
  }, [searchQuery, quests])

  const handleCreateQuest = async () => {
    const { error } = await supabase.from("quest").insert({
      title: formData.title,
      description: formData.description || null,
    })

    if (!error) {
      fetchQuests()
      setCreateDialogOpen(false)
      resetForm()
    }
  }

  const handleEditQuest = async () => {
    if (!selectedQuest) return

    const { error } = await supabase
      .from("quest")
      .update({
        title: formData.title,
        description: formData.description || null,
      })
      .eq("id", selectedQuest.id)

    if (!error) {
      fetchQuests()
      setEditDialogOpen(false)
      setSelectedQuest(null)
      resetForm()
    }
  }

  const handleDeleteQuest = async () => {
    if (!selectedQuest) return

    const { error } = await supabase
      .from("quest")
      .delete()
      .eq("id", selectedQuest.id)

    if (!error) {
      fetchQuests()
      setDeleteDialogOpen(false)
      setSelectedQuest(null)
    }
  }

  const resetForm = () => {
    setFormData({ title: "", description: "" })
  }

  const openEditDialog = (quest: Quest) => {
    setSelectedQuest(quest)
    setFormData({
      title: quest.title,
      description: quest.description || "",
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (quest: Quest) => {
    setSelectedQuest(quest)
    setDeleteDialogOpen(true)
  }

  const renderQuestRow = (quest: Quest) => (
    <TableRow key={quest.id}>
      <TableCell className="font-medium">{quest.title}</TableCell>
      <TableCell className="max-w-md truncate">
        {quest.description || "-"}
      </TableCell>
      <TableCell>{new Date(quest.created_at).toLocaleDateString()}</TableCell>
      <TableCell>
        <EditDeleteActions
          onEdit={() => openEditDialog(quest)}
          onDelete={() => openDeleteDialog(quest)}
        />
      </TableCell>
    </TableRow>
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Quest Management"
        description="Create and manage quests for workshops"
        actionLabel="Create Quest"
        actionIcon={Plus}
        onAction={() => setCreateDialogOpen(true)}
      />

      <AdminSearchCard
        placeholder="Search quests..."
        value={searchQuery}
        onChange={setSearchQuery}
      />

      <AdminDataTable
        title="Quests"
        icon={ScrollText}
        columns={QUEST_TABLE_COLUMNS}
        data={filteredQuests}
        loading={loading}
        emptyMessage="No quests found. Create your first quest to get started."
        renderRow={renderQuestRow}
      />

      {/* Create Dialog */}
      <AdminFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        title="Create New Quest"
        description="Add a new quest that can be assigned to workshops."
        onSubmit={handleCreateQuest}
        submitLabel="Create Quest"
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
      </AdminFormDialog>

      {/* Edit Dialog */}
      <AdminFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        title="Edit Quest"
        description="Update the quest details."
        onSubmit={handleEditQuest}
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
      </AdminFormDialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Quest"
        description={`Are you sure you want to delete "${selectedQuest?.title}"? This action cannot be undone.`}
        onConfirm={handleDeleteQuest}
      />
    </div>
  )
}
