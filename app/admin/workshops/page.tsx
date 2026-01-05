"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, Calendar, Users, ScrollText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  AdminPageHeader,
  AdminSearchCard,
  AdminDataTable,
  AdminFormDialog,
  AdminQuickLinkCard,
  ConfirmDeleteDialog,
  EditDeleteActions,
} from "@/components/admin"
import type { Workshop } from "@/lib/types"

interface WorkshopWithCounts extends Workshop {
  user_count?: number
  quest_count?: number
}

const WORKSHOP_TABLE_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "event_date", label: "Event Date" },
  { key: "users", label: "Users" },
  { key: "quests", label: "Quests" },
  { key: "created_at", label: "Created At" },
  { key: "actions", label: "Actions", className: "w-[80px]" },
]

export default function WorkshopManagementPage() {
  const [workshops, setWorkshops] = useState<WorkshopWithCounts[]>([])
  const [filteredWorkshops, setFilteredWorkshops] = useState<WorkshopWithCounts[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedWorkshop, setSelectedWorkshop] = useState<WorkshopWithCounts | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    event_date: "",
  })

  const supabase = createClient()

  const fetchWorkshops = useCallback(async () => {
    setLoading(true)

    const { data: workshopsData, error } = await supabase
      .from("workshop")
      .select("*")
      .order("event_date", { ascending: false })

    if (!error && workshopsData) {
      const workshopsWithCounts = await Promise.all(
        workshopsData.map(async (workshop) => {
          const { count: userCount } = await supabase
            .from("workshop_user")
            .select("*", { count: "exact", head: true })
            .eq("workshop_id", workshop.id)

          const { count: questCount } = await supabase
            .from("workshop_quest")
            .select("*", { count: "exact", head: true })
            .eq("workshop_id", workshop.id)

          return {
            ...workshop,
            user_count: userCount || 0,
            quest_count: questCount || 0,
          }
        })
      )

      setWorkshops(workshopsWithCounts)
      setFilteredWorkshops(workshopsWithCounts)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchWorkshops()
  }, [fetchWorkshops])

  useEffect(() => {
    const filtered = searchQuery
      ? workshops.filter((workshop) =>
          workshop.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : workshops

    setFilteredWorkshops(filtered)
  }, [searchQuery, workshops])

  const handleCreateWorkshop = async () => {
    const { error } = await supabase.from("workshop").insert({
      name: formData.name,
      event_date: formData.event_date,
    })

    if (!error) {
      fetchWorkshops()
      setCreateDialogOpen(false)
      resetForm()
    }
  }

  const handleEditWorkshop = async () => {
    if (!selectedWorkshop) return

    const { error } = await supabase
      .from("workshop")
      .update({
        name: formData.name,
        event_date: formData.event_date,
      })
      .eq("id", selectedWorkshop.id)

    if (!error) {
      fetchWorkshops()
      setEditDialogOpen(false)
      setSelectedWorkshop(null)
      resetForm()
    }
  }

  const handleDeleteWorkshop = async () => {
    if (!selectedWorkshop) return

    const { error } = await supabase
      .from("workshop")
      .delete()
      .eq("id", selectedWorkshop.id)

    if (!error) {
      fetchWorkshops()
      setDeleteDialogOpen(false)
      setSelectedWorkshop(null)
    }
  }

  const resetForm = () => {
    setFormData({ name: "", event_date: "" })
  }

  const openEditDialog = (workshop: WorkshopWithCounts) => {
    setSelectedWorkshop(workshop)
    setFormData({
      name: workshop.name,
      event_date: workshop.event_date,
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (workshop: WorkshopWithCounts) => {
    setSelectedWorkshop(workshop)
    setDeleteDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const renderWorkshopRow = (workshop: WorkshopWithCounts) => (
    <TableRow key={workshop.id}>
      <TableCell className="font-medium">{workshop.name}</TableCell>
      <TableCell>{formatDate(workshop.event_date)}</TableCell>
      <TableCell>
        <Badge variant="secondary">
          <Users className="w-3 h-3 mr-1" />
          {workshop.user_count}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">
          <ScrollText className="w-3 h-3 mr-1" />
          {workshop.quest_count}
        </Badge>
      </TableCell>
      <TableCell>{new Date(workshop.created_at).toLocaleDateString()}</TableCell>
      <TableCell>
        <EditDeleteActions
          onEdit={() => openEditDialog(workshop)}
          onDelete={() => openDeleteDialog(workshop)}
        />
      </TableCell>
    </TableRow>
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Workshop Management"
        description="Create and manage workshops"
        actionLabel="Create Workshop"
        actionIcon={Plus}
        onAction={() => setCreateDialogOpen(true)}
      />

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AdminQuickLinkCard
          href="/admin/workshop-users"
          icon={Users}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          title="Manage Workshop Users"
          description="Assign users to workshops with roles"
        />
        <AdminQuickLinkCard
          href="/admin/workshop-quests"
          icon={ScrollText}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
          title="Manage Workshop Quests"
          description="Assign quests to workshops"
        />
      </div>

      <AdminSearchCard
        placeholder="Search workshops..."
        value={searchQuery}
        onChange={setSearchQuery}
      />

      <AdminDataTable
        title="Workshops"
        icon={Calendar}
        columns={WORKSHOP_TABLE_COLUMNS}
        data={filteredWorkshops}
        loading={loading}
        emptyMessage="No workshops found. Create your first workshop to get started."
        renderRow={renderWorkshopRow}
      />

      {/* Create Dialog */}
      <AdminFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        title="Create New Workshop"
        description="Add a new workshop event."
        onSubmit={handleCreateWorkshop}
        submitLabel="Create Workshop"
        submitDisabled={!formData.name || !formData.event_date}
      >
        <div className="space-y-2">
          <Label htmlFor="name">Workshop Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter workshop name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="event_date">Event Date</Label>
          <Input
            id="event_date"
            type="date"
            value={formData.event_date}
            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
          />
        </div>
      </AdminFormDialog>

      {/* Edit Dialog */}
      <AdminFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        title="Edit Workshop"
        description="Update the workshop details."
        onSubmit={handleEditWorkshop}
        submitLabel="Save Changes"
        submitDisabled={!formData.name || !formData.event_date}
      >
        <div className="space-y-2">
          <Label htmlFor="edit-name">Workshop Name</Label>
          <Input
            id="edit-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter workshop name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-event_date">Event Date</Label>
          <Input
            id="edit-event_date"
            type="date"
            value={formData.event_date}
            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
          />
        </div>
      </AdminFormDialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Workshop"
        description={`Are you sure you want to delete "${selectedWorkshop?.name}"? This will also remove all user and quest assignments. This action cannot be undone.`}
        onConfirm={handleDeleteWorkshop}
      />
    </div>
  )
}
