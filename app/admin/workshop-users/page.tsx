"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, Users, UserPlus, Shield, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  AdminFilterCard,
  AdminDataTable,
  AdminFormDialog,
  ConfirmDeleteDialog,
  AdminTableActions,
} from "@/components/admin"
import type { Workshop, User, WorkshopUser, WorkshopRole } from "@/lib/types"

interface WorkshopUserWithDetails extends WorkshopUser {
  user: User
  workshop: Workshop
}

const ASSIGNMENT_TABLE_COLUMNS = [
  { key: "user", label: "User" },
  { key: "email", label: "Email" },
  { key: "workshop", label: "Workshop" },
  { key: "role", label: "Role" },
  { key: "assigned_at", label: "Assigned At" },
  { key: "actions", label: "Actions", className: "w-[80px]" },
]

export default function WorkshopUsersPage() {
  const [workshopUsers, setWorkshopUsers] = useState<WorkshopUserWithDetails[]>([])
  const [filteredWorkshopUsers, setFilteredWorkshopUsers] = useState<WorkshopUserWithDetails[]>([])
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [workshopFilter, setWorkshopFilter] = useState<string>("all")
  const [roleFilter, setRoleFilter] = useState<string>("all")

  // Dialog states
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<WorkshopUserWithDetails | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    workshop_id: "",
    user_id: "",
    role: "participant" as WorkshopRole,
  })

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)

    const { data: workshopsData } = await supabase
      .from("workshop")
      .select("*")
      .order("name")

    if (workshopsData) setWorkshops(workshopsData)

    const { data: usersData } = await supabase
      .from("users")
      .select("*")
      .order("display_name")

    if (usersData) setUsers(usersData)

    const { data: assignmentsData } = await supabase
      .from("workshop_user")
      .select(`*, user:users(*), workshop:workshop(*)`)
      .order("assigned_at", { ascending: false })

    if (assignmentsData) {
      setWorkshopUsers(assignmentsData as WorkshopUserWithDetails[])
      setFilteredWorkshopUsers(assignmentsData as WorkshopUserWithDetails[])
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    let filtered = workshopUsers

    if (searchQuery) {
      filtered = filtered.filter(
        (wu) =>
          wu.user?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          wu.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          wu.workshop?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (workshopFilter !== "all") {
      filtered = filtered.filter((wu) => wu.workshop_id === workshopFilter)
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((wu) => wu.role === roleFilter)
    }

    setFilteredWorkshopUsers(filtered)
  }, [searchQuery, workshopFilter, roleFilter, workshopUsers])

  const handleAssignUser = async () => {
    const { error } = await supabase.from("workshop_user").insert({
      workshop_id: formData.workshop_id,
      user_id: formData.user_id,
      role: formData.role,
    })

    if (!error) {
      fetchData()
      setAssignDialogOpen(false)
      resetForm()
    }
  }

  const handleUpdateRole = async () => {
    if (!selectedAssignment) return

    const { error } = await supabase
      .from("workshop_user")
      .update({ role: formData.role })
      .eq("workshop_id", selectedAssignment.workshop_id)
      .eq("user_id", selectedAssignment.user_id)

    if (!error) {
      fetchData()
      setEditRoleDialogOpen(false)
      setSelectedAssignment(null)
      resetForm()
    }
  }

  const handleDeleteAssignment = async () => {
    if (!selectedAssignment) return

    const { error } = await supabase
      .from("workshop_user")
      .delete()
      .eq("workshop_id", selectedAssignment.workshop_id)
      .eq("user_id", selectedAssignment.user_id)

    if (!error) {
      fetchData()
      setDeleteDialogOpen(false)
      setSelectedAssignment(null)
    }
  }

  const resetForm = () => {
    setFormData({ workshop_id: "", user_id: "", role: "participant" })
  }

  const openEditRoleDialog = (assignment: WorkshopUserWithDetails) => {
    setSelectedAssignment(assignment)
    setFormData({ ...formData, role: assignment.role })
    setEditRoleDialogOpen(true)
  }

  const openDeleteDialog = (assignment: WorkshopUserWithDetails) => {
    setSelectedAssignment(assignment)
    setDeleteDialogOpen(true)
  }

  const getRoleBadge = (role: WorkshopRole) => {
    switch (role) {
      case "facilitator":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <UserPlus className="w-3 h-3 mr-1" />
            Facilitator
          </Badge>
        )
      case "participant":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <UserIcon className="w-3 h-3 mr-1" />
            Participant
          </Badge>
        )
      default:
        return <Badge variant="secondary">{role}</Badge>
    }
  }

  const getAvailableUsers = () => {
    if (!formData.workshop_id) return users
    const assignedUserIds = workshopUsers
      .filter((wu) => wu.workshop_id === formData.workshop_id)
      .map((wu) => wu.user_id)
    return users.filter((u) => !assignedUserIds.includes(u.id))
  }

  const renderAssignmentRow = (assignment: WorkshopUserWithDetails) => (
    <TableRow key={`${assignment.workshop_id}-${assignment.user_id}`}>
      <TableCell className="font-medium">
        {assignment.user?.display_name || "Unknown User"}
      </TableCell>
      <TableCell>{assignment.user?.email}</TableCell>
      <TableCell>{assignment.workshop?.name || "Unknown Workshop"}</TableCell>
      <TableCell>{getRoleBadge(assignment.role)}</TableCell>
      <TableCell>{new Date(assignment.assigned_at).toLocaleDateString()}</TableCell>
      <TableCell>
        <AdminTableActions
          actions={[
            {
              label: "Change Role",
              icon: <Shield className="w-4 h-4 mr-2" />,
              onClick: () => openEditRoleDialog(assignment),
            },
            {
              label: "Remove",
              onClick: () => openDeleteDialog(assignment),
              variant: "destructive",
            },
          ]}
        />
      </TableCell>
    </TableRow>
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Workshop User Assignments"
        description="Assign users to workshops and manage their roles"
        actionLabel="Assign User"
        actionIcon={Plus}
        onAction={() => setAssignDialogOpen(true)}
      />

      <AdminFilterCard
        searchPlaceholder="Search users or workshops..."
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
          {
            placeholder: "Filter by role",
            value: roleFilter,
            onChange: setRoleFilter,
            options: [
              { value: "facilitator", label: "Facilitator" },
              { value: "participant", label: "Participant" },
            ],
            allLabel: "All Roles",
          },
        ]}
      />

      <AdminDataTable
        title="Assignments"
        icon={Users}
        columns={ASSIGNMENT_TABLE_COLUMNS}
        data={filteredWorkshopUsers}
        loading={loading}
        emptyMessage="No assignments found. Assign users to workshops to get started."
        renderRow={renderAssignmentRow}
      />

      {/* Assign User Dialog */}
      <AdminFormDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        title="Assign User to Workshop"
        description="Select a workshop, user, and their role."
        onSubmit={handleAssignUser}
        submitLabel="Assign User"
        submitDisabled={!formData.workshop_id || !formData.user_id}
      >
        <div className="space-y-2">
          <Label>Workshop</Label>
          <Select
            value={formData.workshop_id}
            onValueChange={(value) =>
              setFormData({ ...formData, workshop_id: value, user_id: "" })
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
          <Label>User</Label>
          <Select
            value={formData.user_id}
            onValueChange={(value) => setFormData({ ...formData, user_id: value })}
            disabled={!formData.workshop_id}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={formData.workshop_id ? "Select a user" : "Select a workshop first"}
              />
            </SelectTrigger>
            <SelectContent>
              {getAvailableUsers().map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.display_name || user.email} ({user.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Select
            value={formData.role}
            onValueChange={(value) => setFormData({ ...formData, role: value as WorkshopRole })}
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

      {/* Edit Role Dialog */}
      <AdminFormDialog
        open={editRoleDialogOpen}
        onOpenChange={setEditRoleDialogOpen}
        title="Change User Role"
        description={`Update the role for ${selectedAssignment?.user?.display_name} in ${selectedAssignment?.workshop?.name}.`}
        onSubmit={handleUpdateRole}
        submitLabel="Update Role"
      >
        <div className="space-y-2">
          <Label>Role</Label>
          <Select
            value={formData.role}
            onValueChange={(value) => setFormData({ ...formData, role: value as WorkshopRole })}
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remove User from Workshop"
        description={`Are you sure you want to remove ${selectedAssignment?.user?.display_name} from ${selectedAssignment?.workshop?.name}? This action cannot be undone.`}
        onConfirm={handleDeleteAssignment}
        confirmLabel="Remove"
      />
    </div>
  )
}
