"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Plus,
  Calendar,
  Users,
  ScrollText,
  Clock,
  MapPin,
  Play,
  CheckCircle2,
  XCircle,
  FileEdit,
  CalendarClock,
  ExternalLink,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
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
import type { Workshop, WorkshopStatus } from "@/lib/types"

interface WorkshopWithCounts extends Workshop {
  user_count?: number
  quest_count?: number
}

const STATUS_OPTIONS: { value: WorkshopStatus; label: string; color: string }[] = [
  { value: "draft", label: "Draft", color: "bg-slate-100 text-slate-700" },
  { value: "scheduled", label: "Scheduled", color: "bg-blue-100 text-blue-700" },
  { value: "active", label: "Active", color: "bg-green-100 text-green-700" },
  { value: "completed", label: "Completed", color: "bg-purple-100 text-purple-700" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-700" },
]

const WORKSHOP_TABLE_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "date", label: "Date & Time" },
  { key: "location", label: "Location" },
  { key: "status", label: "Status" },
  { key: "users", label: "Users" },
  { key: "quests", label: "Quests" },
  { key: "actions", label: "Actions", className: "w-[80px]" },
]

export default function WorkshopManagementPage() {
  const router = useRouter()
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
    description: "",
    event_date: "",
    start_time: "",
    end_time: "",
    location: "",
    status: "draft" as WorkshopStatus,
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
      description: formData.description || null,
      event_date: formData.event_date,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
      location: formData.location || null,
      status: formData.status,
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
        description: formData.description || null,
        event_date: formData.event_date,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        location: formData.location || null,
        status: formData.status,
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
    setFormData({
      name: "",
      description: "",
      event_date: "",
      start_time: "",
      end_time: "",
      location: "",
      status: "draft",
    })
  }

  const openEditDialog = (workshop: WorkshopWithCounts) => {
    setSelectedWorkshop(workshop)
    setFormData({
      name: workshop.name,
      description: workshop.description || "",
      event_date: workshop.event_date,
      start_time: workshop.start_time || "",
      end_time: workshop.end_time || "",
      location: workshop.location || "",
      status: workshop.status || "draft",
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

  const formatTime = (timeString: string | null) => {
    if (!timeString) return null
    return timeString.slice(0, 5) // HH:MM format
  }

  const getStatusConfig = (status: WorkshopStatus) => {
    return STATUS_OPTIONS.find((opt) => opt.value === status) || STATUS_OPTIONS[0]
  }

  const getStatusIcon = (status: WorkshopStatus) => {
    switch (status) {
      case "draft":
        return <FileEdit className="w-3 h-3 mr-1" />
      case "scheduled":
        return <CalendarClock className="w-3 h-3 mr-1" />
      case "active":
        return <Play className="w-3 h-3 mr-1" />
      case "completed":
        return <CheckCircle2 className="w-3 h-3 mr-1" />
      case "cancelled":
        return <XCircle className="w-3 h-3 mr-1" />
      default:
        return null
    }
  }

  const renderWorkshopRow = (workshop: WorkshopWithCounts) => {
    const statusConfig = getStatusConfig(workshop.status)
    return (
      <TableRow
        key={workshop.id}
        className="cursor-pointer hover:bg-slate-50"
        onClick={() => router.push(`/admin/workshops/${workshop.id}`)}
      >
        <TableCell>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{workshop.name}</p>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </div>
            {workshop.description && (
              <p className="text-sm text-slate-500 truncate max-w-xs">
                {workshop.description}
              </p>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm">
              <Calendar className="w-3 h-3" />
              {formatDate(workshop.event_date)}
            </div>
            {(workshop.start_time || workshop.end_time) && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                {formatTime(workshop.start_time) || "--:--"} -{" "}
                {formatTime(workshop.end_time) || "--:--"}
              </div>
            )}
          </div>
        </TableCell>
        <TableCell>
          {workshop.location ? (
            <div className="flex items-center gap-1 text-sm">
              <MapPin className="w-3 h-3" />
              {workshop.location}
            </div>
          ) : (
            <span className="text-slate-400">-</span>
          )}
        </TableCell>
        <TableCell>
          <Badge className={`${statusConfig.color} hover:${statusConfig.color}`}>
            {getStatusIcon(workshop.status)}
            {statusConfig.label}
          </Badge>
        </TableCell>
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
        <TableCell onClick={(e) => e.stopPropagation()}>
          <EditDeleteActions
            onEdit={() => openEditDialog(workshop)}
            onDelete={() => openDeleteDialog(workshop)}
          />
        </TableCell>
      </TableRow>
    )
  }

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
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter workshop description (optional)"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="event_date">Event Date</Label>
            <Input
              id="event_date"
              type="date"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: WorkshopStatus) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
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
            <Label htmlFor="start_time">Start Time</Label>
            <Input
              id="start_time"
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_time">End Time</Label>
            <Input
              id="end_time"
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Enter location (optional)"
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
          <Label htmlFor="edit-description">Description</Label>
          <Textarea
            id="edit-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter workshop description (optional)"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-event_date">Event Date</Label>
            <Input
              id="edit-event_date"
              type="date"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: WorkshopStatus) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
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
            <Label htmlFor="edit-start_time">Start Time</Label>
            <Input
              id="edit-start_time"
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-end_time">End Time</Label>
            <Input
              id="edit-end_time"
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-location">Location</Label>
          <Input
            id="edit-location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Enter location (optional)"
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
