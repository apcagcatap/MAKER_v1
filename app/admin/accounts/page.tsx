"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Users, UserPlus, Calendar, Shield } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AdminPageHeader,
  AdminSearchCard,
  AdminDataTable,
  AdminFormDialog,
  AdminQuickLinkCard,
  ConfirmDeleteDialog,
  EditDeleteActions,
  UserAvatar,
} from "@/components/admin"
import type { User, Workshop } from "@/lib/types"

interface UserWithWorkshops extends User {
  workshop_count?: number
  workshops?: Array<{
    workshop: Workshop
    role: string
  }>
}

const USER_TABLE_COLUMNS = [
  { key: "user", label: "User" },
  { key: "admin", label: "Admin" },
  { key: "workshops", label: "Workshop Assignments" },
  { key: "joined", label: "Joined" },
  { key: "actions", label: "Actions", className: "w-[80px]" },
]

export default function AccountManagementPage() {
  const [users, setUsers] = useState<UserWithWorkshops[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserWithWorkshops[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [viewWorkshopsDialogOpen, setViewWorkshopsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithWorkshops | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    email: "",
    display_name: "",
    password: "",
  })

  const supabase = createClient()

  const fetchUsers = useCallback(async () => {
    setLoading(true)

    const { data: usersData, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && usersData) {
      const usersWithCounts = await Promise.all(
        usersData.map(async (user) => {
          const { count } = await supabase
            .from("workshop_user")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)

          return { ...user, workshop_count: count || 0 }
        })
      )

      setUsers(usersWithCounts)
      setFilteredUsers(usersWithCounts)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    const filtered = searchQuery
      ? users.filter(
          (user) =>
            user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : users

    setFilteredUsers(filtered)
  }, [searchQuery, users])

  const handleCreateAccount = async () => {
    const response = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        display_name: formData.display_name,
      }),
    })

    const result = await response.json()

    if (response.ok && result.success) {
      fetchUsers()
      setCreateDialogOpen(false)
      resetForm()
    } else {
      console.error("Failed to create user:", result.error)
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    const { error } = await supabase
      .from("users")
      .update({ display_name: formData.display_name })
      .eq("id", selectedUser.id)

    if (!error) {
      fetchUsers()
      setEditDialogOpen(false)
      setSelectedUser(null)
      resetForm()
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    const response = await fetch("/api/admin/delete-user", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedUser.id }),
    })

    const result = await response.json()

    if (response.ok && result.success) {
      fetchUsers()
      setDeleteDialogOpen(false)
      setSelectedUser(null)
    } else {
      console.error("Failed to delete user:", result.error)
    }
  }

  const handleToggleAdmin = async (user: UserWithWorkshops) => {
    const { error } = await supabase
      .from("users")
      .update({ is_admin: !user.is_admin })
      .eq("id", user.id)

    if (!error) fetchUsers()
  }

  const fetchUserWorkshops = async (user: UserWithWorkshops) => {
    const { data } = await supabase
      .from("workshop_user")
      .select(`role, workshop:workshop(*)`)
      .eq("user_id", user.id)

    setSelectedUser({ ...user, workshops: (data as any) || [] })
    setViewWorkshopsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({ email: "", display_name: "", password: "" })
  }

  const openEditDialog = (user: UserWithWorkshops) => {
    setSelectedUser(user)
    setFormData({
      email: user.email,
      display_name: user.display_name || "",
      password: "",
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (user: UserWithWorkshops) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  const renderUserRow = (user: UserWithWorkshops) => (
    <TableRow key={user.id}>
      <TableCell>
        <div className="flex items-center gap-3">
          <UserAvatar name={user.display_name} email={user.email} />
          <div>
            <p className="font-medium">{user.display_name || "Unnamed User"}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch
            checked={user.is_admin}
            onCheckedChange={() => handleToggleAdmin(user)}
          />
          {user.is_admin && (
            <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
              <Shield className="w-3 h-3 mr-1" />
              Admin
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchUserWorkshops(user)}
          className="text-blue-600 hover:text-blue-700"
        >
          <Calendar className="w-4 h-4 mr-1" />
          {user.workshop_count} workshop{user.workshop_count !== 1 ? "s" : ""}
        </Button>
      </TableCell>
      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
      <TableCell>
        <EditDeleteActions
          onEdit={() => openEditDialog(user)}
          onDelete={() => openDeleteDialog(user)}
        />
      </TableCell>
    </TableRow>
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="User Management"
        description="Create and manage user accounts"
        actionLabel="Create User"
        actionIcon={UserPlus}
        onAction={() => setCreateDialogOpen(true)}
      />

      <AdminQuickLinkCard
        href="/admin/workshop-users"
        icon={Calendar}
        iconBgColor="bg-blue-100"
        iconColor="text-blue-600"
        title="Assign Users to Workshops"
        description="Manage user roles by assigning them to workshops as participants or facilitators"
      />

      <AdminSearchCard
        placeholder="Search users by name or email..."
        value={searchQuery}
        onChange={setSearchQuery}
      />

      <AdminDataTable
        title="Users"
        icon={Users}
        columns={USER_TABLE_COLUMNS}
        data={filteredUsers}
        loading={loading}
        emptyMessage="No users found. Create your first user to get started."
        renderRow={renderUserRow}
      />

      {/* Create User Dialog */}
      <AdminFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        title="Create New User"
        description="Add a new user account. You can assign them to workshops later."
        onSubmit={handleCreateAccount}
        submitLabel="Create User"
        submitDisabled={!formData.email || !formData.password || formData.password.length < 6}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="user@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Minimum 6 characters"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="display_name">Display Name</Label>
          <Input
            id="display_name"
            value={formData.display_name}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            placeholder="John Doe"
          />
        </div>
      </AdminFormDialog>

      {/* Edit User Dialog */}
      <AdminFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        title="Edit User"
        description="Update user profile information."
        onSubmit={handleEditUser}
        submitLabel="Save Changes"
      >
        <div className="space-y-2">
          <Label htmlFor="edit-email">Email</Label>
          <Input
            id="edit-email"
            type="email"
            value={formData.email}
            disabled
            className="bg-slate-50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-display_name">Display Name</Label>
          <Input
            id="edit-display_name"
            value={formData.display_name}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            placeholder="John Doe"
          />
        </div>
      </AdminFormDialog>

      {/* View Workshops Dialog */}
      <Dialog open={viewWorkshopsDialogOpen} onOpenChange={setViewWorkshopsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Workshop Assignments</DialogTitle>
            <DialogDescription>
              Workshops that {selectedUser?.display_name || selectedUser?.email} is assigned to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {selectedUser?.workshops && selectedUser.workshops.length > 0 ? (
              selectedUser.workshops.map((assignment: any) => (
                <div
                  key={assignment.workshop?.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{assignment.workshop?.name}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(assignment.workshop?.event_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    className={
                      assignment.role === "admin"
                        ? "bg-red-100 text-red-700"
                        : assignment.role === "facilitator"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }
                  >
                    {assignment.role}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-slate-500">
                No workshop assignments yet.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" asChild>
              <a href="/admin/workshop-users">Manage Assignments</a>
            </Button>
            <Button onClick={() => setViewWorkshopsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete User"
        description={`Are you sure you want to delete ${selectedUser?.display_name || selectedUser?.email}? This will also remove all their workshop assignments. This action cannot be undone.`}
        onConfirm={handleDeleteUser}
        confirmLabel="Delete User"
      />
    </div>
  )
}
