"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  ScrollText,
  Trash2,
  Settings,
  Play,
  CheckCircle2,
  Lock,
  Edit,
  UserPlus,
  RefreshCw,
  ListTodo,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import type {
  Workshop,
  WorkshopStatus,
  WorkshopUser,
  WorkshopQuest,
  QuestTemplate,
  User,
  WorkshopRole,
  WorkshopItemStatus,
} from "@/lib/types"

interface WorkshopQuestWithDetails extends WorkshopQuest {
  quest_template: QuestTemplate
  task_count?: number
}

interface WorkshopUserWithDetails {
  id: string // Virtual id for table compatibility (workshop_id:user_id)
  workshop_id: string
  user_id: string
  role: WorkshopRole
  assigned_at: string
  user: User
}

const STATUS_OPTIONS: { value: WorkshopStatus; label: string; color: string }[] = [
  { value: "draft", label: "Draft", color: "bg-slate-100 text-slate-700" },
  { value: "scheduled", label: "Scheduled", color: "bg-blue-100 text-blue-700" },
  { value: "active", label: "Active", color: "bg-green-100 text-green-700" },
  { value: "completed", label: "Completed", color: "bg-purple-100 text-purple-700" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-700" },
]

const QUEST_STATUS_OPTIONS: { value: WorkshopItemStatus; label: string; icon: React.ReactNode }[] = [
  { value: "locked", label: "Locked", icon: <Lock className="w-3 h-3" /> },
  { value: "open", label: "Open", icon: <Play className="w-3 h-3" /> },
  { value: "in_progress", label: "In Progress", icon: <Clock className="w-3 h-3" /> },
  { value: "completed", label: "Completed", icon: <CheckCircle2 className="w-3 h-3" /> },
]

const USER_TABLE_COLUMNS = [
  { key: "user", label: "User" },
  { key: "role", label: "Role" },
  { key: "assigned", label: "Assigned" },
  { key: "actions", label: "Actions", className: "w-[80px]" },
]

const QUEST_TABLE_COLUMNS = [
  { key: "quest", label: "Quest" },
  { key: "schedule", label: "Schedule" },
  { key: "status", label: "Status" },
  { key: "tasks", label: "Tasks" },
  { key: "actions", label: "Actions", className: "w-[100px]" },
]

export default function WorkshopDetailPage() {
  const params = useParams()
  const router = useRouter()
  const workshopId = params.id as string

  const [workshop, setWorkshop] = useState<Workshop | null>(null)
  const [workshopUsers, setWorkshopUsers] = useState<WorkshopUserWithDetails[]>([])
  const [workshopQuests, setWorkshopQuests] = useState<WorkshopQuestWithDetails[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [editWorkshopOpen, setEditWorkshopOpen] = useState(false)
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)
  const [bulkAddUsersOpen, setBulkAddUsersOpen] = useState(false)
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false)
  const [deleteQuestDialogOpen, setDeleteQuestDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<WorkshopUserWithDetails | null>(null)
  const [selectedQuest, setSelectedQuest] = useState<WorkshopQuestWithDetails | null>(null)

  // Form states
  const [workshopForm, setWorkshopForm] = useState({
    name: "",
    description: "",
    event_date: "",
    start_time: "",
    end_time: "",
    location: "",
    status: "draft" as WorkshopStatus,
  })
  const [userForm, setUserForm] = useState({
    user_id: "",
    role: "participant" as WorkshopRole,
  })
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [bulkRole, setBulkRole] = useState<WorkshopRole>("participant")

  const supabase = createClient()

  const fetchWorkshop = useCallback(async () => {
    const { data, error } = await supabase
      .from("workshop")
      .select("*")
      .eq("id", workshopId)
      .single()

    if (error || !data) {
      router.push("/admin/workshops")
      return
    }

    setWorkshop(data)
    setWorkshopForm({
      name: data.name,
      description: data.description || "",
      event_date: data.event_date,
      start_time: data.start_time || "",
      end_time: data.end_time || "",
      location: data.location || "",
      status: data.status || "draft",
    })
  }, [supabase, workshopId, router])

  const fetchWorkshopUsers = useCallback(async () => {
    const { data } = await supabase
      .from("workshop_user")
      .select(`*, user:users(*)`)
      .eq("workshop_id", workshopId)
      .order("assigned_at", { ascending: false })

    if (data) {
      // Add virtual id for table compatibility
      const usersWithId = data.map((wu) => ({
        ...wu,
        id: `${wu.workshop_id}:${wu.user_id}`,
      }))
      setWorkshopUsers(usersWithId as WorkshopUserWithDetails[])
    }
  }, [supabase, workshopId])

  const fetchWorkshopQuests = useCallback(async () => {
    const { data } = await supabase
      .from("workshop_quest")
      .select(`*, quest_template:quest_template(*)`)
      .eq("workshop_id", workshopId)
      .order("sequence_order")

    if (data) {
      const questsWithCounts = await Promise.all(
        data.map(async (quest) => {
          const { count } = await supabase
            .from("workshop_task")
            .select("*", { count: "exact", head: true })
            .eq("workshop_quest_id", quest.id)
          return { ...quest, task_count: count || 0 }
        })
      )
      setWorkshopQuests(questsWithCounts as WorkshopQuestWithDetails[])
    }
  }, [supabase, workshopId])

  const fetchAvailableUsers = useCallback(async () => {
    const { data: allUsers } = await supabase.from("users").select("*").order("display_name")
    const assignedUserIds = workshopUsers.map((wu) => wu.user_id)
    if (allUsers) {
      setAvailableUsers(allUsers.filter((u) => !assignedUserIds.includes(u.id)))
    }
  }, [supabase, workshopUsers])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchWorkshop()
      await fetchWorkshopUsers()
      await fetchWorkshopQuests()
      setLoading(false)
    }
    loadData()
  }, [fetchWorkshop, fetchWorkshopUsers, fetchWorkshopQuests])

  useEffect(() => {
    fetchAvailableUsers()
  }, [fetchAvailableUsers])

  const handleUpdateWorkshop = async () => {
    const { error } = await supabase
      .from("workshop")
      .update({
        name: workshopForm.name,
        description: workshopForm.description || null,
        event_date: workshopForm.event_date,
        start_time: workshopForm.start_time || null,
        end_time: workshopForm.end_time || null,
        location: workshopForm.location || null,
        status: workshopForm.status,
      })
      .eq("id", workshopId)

    if (!error) {
      fetchWorkshop()
      setEditWorkshopOpen(false)
    }
  }

  const handleAddUser = async () => {
    const { error } = await supabase.from("workshop_user").insert({
      workshop_id: workshopId,
      user_id: userForm.user_id,
      role: userForm.role,
    })

    if (!error) {
      fetchWorkshopUsers()
      setAddUserDialogOpen(false)
      setUserForm({ user_id: "", role: "participant" })
    }
  }

  const handleBulkAddUsers = async () => {
    if (selectedUserIds.length === 0) return

    const assignments = selectedUserIds.map((user_id) => ({
      workshop_id: workshopId,
      user_id,
      role: bulkRole,
    }))

    const { error } = await supabase.from("workshop_user").insert(assignments)

    if (!error) {
      fetchWorkshopUsers()
      setBulkAddUsersOpen(false)
      setSelectedUserIds([])
    }
  }

  const handleRemoveUser = async () => {
    if (!selectedUser) return

    const { error } = await supabase
      .from("workshop_user")
      .delete()
      .eq("workshop_id", workshopId)
      .eq("user_id", selectedUser.user_id)

    if (!error) {
      fetchWorkshopUsers()
      setDeleteUserDialogOpen(false)
      setSelectedUser(null)
    }
  }

  const handleRemoveQuest = async () => {
    if (!selectedQuest) return

    const { error } = await supabase.from("workshop_quest").delete().eq("id", selectedQuest.id)

    if (!error) {
      fetchWorkshopQuests()
      setDeleteQuestDialogOpen(false)
      setSelectedQuest(null)
    }
  }

  // Sync tasks from template for a specific workshop quest
  const handleSyncTasksFromTemplate = async (wq: WorkshopQuestWithDetails) => {
    // Get tasks from the quest template
    const { data: templateTasks } = await supabase
      .from("quest_template_task")
      .select("*")
      .eq("quest_template_id", wq.quest_template_id)
      .order("sequence_order")

    if (!templateTasks || templateTasks.length === 0) {
      return // No tasks in template
    }

    // Get existing workshop tasks to avoid duplicates
    const { data: existingTasks } = await supabase
      .from("workshop_task")
      .select("task_template_id")
      .eq("workshop_quest_id", wq.id)

    const existingTaskTemplateIds = existingTasks?.map((t) => t.task_template_id) || []

    // Filter out tasks that already exist
    const newTasks = templateTasks
      .filter((tt) => !existingTaskTemplateIds.includes(tt.task_template_id))
      .map((tt, index) => ({
        workshop_quest_id: wq.id,
        task_template_id: tt.task_template_id,
        sequence_order: (existingTasks?.length || 0) + index,
        status: "locked" as const,
        auto_unlock: false,
        unlock_on_previous_complete: true,
      }))

    if (newTasks.length > 0) {
      const { error } = await supabase.from("workshop_task").insert(newTasks)
      if (!error) {
        fetchWorkshopQuests()
      }
    }
  }

  // Sync all tasks for all quests in this workshop
  const handleSyncAllTasks = async () => {
    for (const wq of workshopQuests) {
      await handleSyncTasksFromTemplate(wq)
    }
  }

  const getStatusConfig = (status: WorkshopStatus) => {
    return STATUS_OPTIONS.find((opt) => opt.value === status) || STATUS_OPTIONS[0]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return null
    return timeString.slice(0, 5)
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

  const renderUserRow = (wu: WorkshopUserWithDetails) => (
    <TableRow key={wu.user_id}>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
            {wu.user.display_name?.[0]?.toUpperCase() || wu.user.email[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{wu.user.display_name || "No name"}</p>
            <p className="text-xs text-slate-500">{wu.user.email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={
            wu.role === "facilitator"
              ? "bg-purple-100 text-purple-700 border-purple-200"
              : "bg-blue-100 text-blue-700 border-blue-200"
          }
        >
          {wu.role}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-slate-500">
        {new Date(wu.assigned_at).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <AdminTableActions
          actions={[
            {
              label: "Remove",
              icon: <Trash2 className="w-4 h-4 mr-2" />,
              onClick: () => {
                setSelectedUser(wu)
                setDeleteUserDialogOpen(true)
              },
              variant: "destructive",
            },
          ]}
        />
      </TableCell>
    </TableRow>
  )

  const renderQuestRow = (wq: WorkshopQuestWithDetails) => {
    const displayTitle = wq.custom_title || wq.quest_template?.title
    const statusOpt = QUEST_STATUS_OPTIONS.find((s) => s.value === wq.status)

    return (
      <TableRow key={wq.id}>
        <TableCell>
          <div>
            <p className="font-medium">{displayTitle}</p>
            {wq.custom_title && (
              <p className="text-xs text-slate-500">from: {wq.quest_template?.title}</p>
            )}
            <p className="text-xs text-slate-400">Order: {wq.sequence_order}</p>
          </div>
        </TableCell>
        <TableCell>
          {wq.scheduled_start || wq.scheduled_end ? (
            <div className="text-sm space-y-1">
              {wq.scheduled_start && (
                <div className="flex items-center gap-1 text-green-600">
                  <Play className="w-3 h-3" />
                  {formatDateTime(wq.scheduled_start)}
                </div>
              )}
              {wq.scheduled_end && (
                <div className="flex items-center gap-1 text-red-600">
                  <Clock className="w-3 h-3" />
                  {formatDateTime(wq.scheduled_end)}
                </div>
              )}
            </div>
          ) : (
            <span className="text-slate-400 text-sm">Not scheduled</span>
          )}
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="gap-1">
            {statusOpt?.icon}
            {statusOpt?.label}
          </Badge>
        </TableCell>
        <TableCell>
          <Link
            href={`/admin/workshops/${workshopId}/quests/${wq.id}`}
            className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1"
          >
            <ListTodo className="w-4 h-4" />
            {wq.task_count} task{wq.task_count !== 1 ? "s" : ""}
          </Link>
        </TableCell>
        <TableCell>
          <AdminTableActions
            actions={[
              {
                label: "Manage Quest",
                icon: <Settings className="w-4 h-4 mr-2" />,
                onClick: () => router.push(`/admin/workshops/${workshopId}/quests/${wq.id}`),
              },
              {
                label: "Sync Tasks from Template",
                icon: <RefreshCw className="w-4 h-4 mr-2" />,
                onClick: () => handleSyncTasksFromTemplate(wq),
              },
              {
                label: "Remove",
                icon: <Trash2 className="w-4 h-4 mr-2" />,
                onClick: () => {
                  setSelectedQuest(wq)
                  setDeleteQuestDialogOpen(true)
                },
                variant: "destructive",
              },
            ]}
          />
        </TableCell>
      </TableRow>
    )
  }

  if (loading || !workshop) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  const statusConfig = getStatusConfig(workshop.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/workshops">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{workshop.name}</h1>
            <Badge className={`${statusConfig.color} hover:${statusConfig.color}`}>
              {statusConfig.label}
            </Badge>
          </div>
          {workshop.description && (
            <p className="text-slate-500 mt-1">{workshop.description}</p>
          )}
        </div>
        <Button onClick={() => setEditWorkshopOpen(true)}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Workshop
        </Button>
      </div>

      {/* Workshop Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Event Date</p>
                <p className="font-medium">{formatDate(workshop.event_date)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Time</p>
                <p className="font-medium">
                  {formatTime(workshop.start_time) || "--:--"} -{" "}
                  {formatTime(workshop.end_time) || "--:--"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Location</p>
                <p className="font-medium">{workshop.location || "Not set"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Participants</p>
                <p className="font-medium">{workshopUsers.length} assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Users and Quests */}
      <Tabs defaultValue="quests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="quests" className="gap-2">
            <ScrollText className="w-4 h-4" />
            Quests ({workshopQuests.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            Users ({workshopUsers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quests" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Workshop Quests</h3>
              <p className="text-sm text-slate-500">
                Quests assigned to this workshop
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSyncAllTasks}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync All Tasks
              </Button>
              <Button asChild>
                <Link href={`/admin/workshop-quests?workshop=${workshopId}`}>
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Quests
                </Link>
              </Button>
            </div>
          </div>

          <AdminDataTable
            title="Quests"
            icon={ScrollText}
            columns={QUEST_TABLE_COLUMNS}
            data={workshopQuests}
            loading={false}
            emptyMessage="No quests assigned yet. Click 'Manage Quests' to add quests from templates."
            renderRow={renderQuestRow}
          />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Workshop Users</h3>
              <p className="text-sm text-slate-500">
                Manage participants and facilitators
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setBulkAddUsersOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Bulk Add
              </Button>
              <Button onClick={() => setAddUserDialogOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AdminStatCard
              icon={Users}
              iconBgColor="bg-blue-100"
              iconColor="text-blue-600"
              value={workshopUsers.filter((u) => u.role === "participant").length}
              label="Participants"
            />
            <AdminStatCard
              icon={Users}
              iconBgColor="bg-purple-100"
              iconColor="text-purple-600"
              value={workshopUsers.filter((u) => u.role === "facilitator").length}
              label="Facilitators"
            />
            <AdminStatCard
              icon={Users}
              iconBgColor="bg-green-100"
              iconColor="text-green-600"
              value={workshopUsers.length}
              label="Total Users"
            />
          </div>

          <AdminDataTable
            title="Users"
            icon={Users}
            columns={USER_TABLE_COLUMNS}
            data={workshopUsers}
            loading={false}
            emptyMessage="No users assigned yet. Add users to get started."
            renderRow={renderUserRow}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Workshop Dialog */}
      <AdminFormDialog
        open={editWorkshopOpen}
        onOpenChange={setEditWorkshopOpen}
        title="Edit Workshop"
        description="Update workshop details"
        onSubmit={handleUpdateWorkshop}
        submitLabel="Save Changes"
        submitDisabled={!workshopForm.name || !workshopForm.event_date}
      >
        <div className="space-y-2">
          <Label>Workshop Name</Label>
          <Input
            value={workshopForm.name}
            onChange={(e) => setWorkshopForm({ ...workshopForm, name: e.target.value })}
            placeholder="Enter workshop name"
          />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={workshopForm.description}
            onChange={(e) => setWorkshopForm({ ...workshopForm, description: e.target.value })}
            placeholder="Enter description"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Event Date</Label>
            <Input
              type="date"
              value={workshopForm.event_date}
              onChange={(e) => setWorkshopForm({ ...workshopForm, event_date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={workshopForm.status}
              onValueChange={(value: WorkshopStatus) =>
                setWorkshopForm({ ...workshopForm, status: value })
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
            <Label>Start Time</Label>
            <Input
              type="time"
              value={workshopForm.start_time}
              onChange={(e) => setWorkshopForm({ ...workshopForm, start_time: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>End Time</Label>
            <Input
              type="time"
              value={workshopForm.end_time}
              onChange={(e) => setWorkshopForm({ ...workshopForm, end_time: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Location</Label>
          <Input
            value={workshopForm.location}
            onChange={(e) => setWorkshopForm({ ...workshopForm, location: e.target.value })}
            placeholder="Enter location"
          />
        </div>
      </AdminFormDialog>

      {/* Add User Dialog */}
      <AdminFormDialog
        open={addUserDialogOpen}
        onOpenChange={setAddUserDialogOpen}
        title="Add User to Workshop"
        description="Select a user and assign their role"
        onSubmit={handleAddUser}
        submitLabel="Add User"
        submitDisabled={!userForm.user_id}
      >
        <div className="space-y-2">
          <Label>User</Label>
          <Select
            value={userForm.user_id}
            onValueChange={(value) => setUserForm({ ...userForm, user_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              {availableUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.display_name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Select
            value={userForm.role}
            onValueChange={(value: WorkshopRole) => setUserForm({ ...userForm, role: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="participant">Participant</SelectItem>
              <SelectItem value="facilitator">Facilitator</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </AdminFormDialog>

      {/* Bulk Add Users Dialog */}
      <Dialog open={bulkAddUsersOpen} onOpenChange={setBulkAddUsersOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Add Users</DialogTitle>
            <DialogDescription>Select multiple users to add at once</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Role for all selected users</Label>
              <Select value={bulkRole} onValueChange={(v: WorkshopRole) => setBulkRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="participant">Participant</SelectItem>
                  <SelectItem value="facilitator">Facilitator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Select Users ({selectedUserIds.length} selected)</Label>
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                {availableUsers.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">
                    All users are already assigned to this workshop.
                  </div>
                ) : (
                  availableUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 border-b last:border-b-0"
                    >
                      <Checkbox
                        checked={selectedUserIds.includes(user.id)}
                        onCheckedChange={() =>
                          setSelectedUserIds((prev) =>
                            prev.includes(user.id)
                              ? prev.filter((id) => id !== user.id)
                              : [...prev, user.id]
                          )
                        }
                      />
                      <div className="flex-1">
                        <p className="font-medium">{user.display_name || "No name"}</p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAddUsersOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAddUsers} disabled={selectedUserIds.length === 0}>
              Add {selectedUserIds.length} User{selectedUserIds.length !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <ConfirmDeleteDialog
        open={deleteUserDialogOpen}
        onOpenChange={setDeleteUserDialogOpen}
        title="Remove User"
        description={`Are you sure you want to remove ${selectedUser?.user.display_name || selectedUser?.user.email} from this workshop?`}
        onConfirm={handleRemoveUser}
        confirmLabel="Remove"
      />

      {/* Delete Quest Confirmation */}
      <ConfirmDeleteDialog
        open={deleteQuestDialogOpen}
        onOpenChange={setDeleteQuestDialogOpen}
        title="Remove Quest"
        description={`Are you sure you want to remove "${selectedQuest?.custom_title || selectedQuest?.quest_template?.title}" from this workshop? This will also remove all associated tasks.`}
        onConfirm={handleRemoveQuest}
        confirmLabel="Remove"
      />
    </div>
  )
}
