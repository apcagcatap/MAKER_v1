"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  Users,
  UserPlus,
  Calendar,
  Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import type { User, WorkshopUser, Workshop } from "@/lib/types"

interface UserWithWorkshops extends User {
  workshop_count?: number
  workshops?: Array<{
    workshop: Workshop
    role: string
  }>
}

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
    bio: "",
    password: "",
  })

  const supabase = createClient()

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    
    // Fetch users
    const { data: usersData, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })
    
    if (!error && usersData) {
      // Fetch workshop counts for each user
      const usersWithCounts = await Promise.all(
        usersData.map(async (user) => {
          const { count } = await supabase
            .from("workshop_user")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
          
          return {
            ...user,
            workshop_count: count || 0,
          }
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
    let filtered = users
    
    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    setFilteredUsers(filtered)
  }, [searchQuery, users])

  const handleCreateAccount = async () => {
    // Use admin API route to create user without affecting current session
    const response = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        display_name: formData.display_name,
        bio: formData.bio,
      }),
    })

    const result = await response.json()

    if (response.ok && result.success) {
      fetchUsers()
      setCreateDialogOpen(false)
      resetForm()
    } else {
      // Handle error - you might want to show this to the user
      console.error("Failed to create user:", result.error)
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    const { error } = await supabase
      .from("users")
      .update({
        display_name: formData.display_name,
        bio: formData.bio || null,
      })
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

    // Use admin API route to delete user from both auth.users and public.users
    const response = await fetch("/api/admin/delete-user", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: selectedUser.id,
      }),
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

    if (!error) {
      fetchUsers()
    }
  }

  const fetchUserWorkshops = async (user: UserWithWorkshops) => {
    const { data } = await supabase
      .from("workshop_user")
      .select(`
        role,
        workshop:workshop(*)
      `)
      .eq("user_id", user.id)
    
    setSelectedUser({
      ...user,
      workshops: data as any || [],
    })
    setViewWorkshopsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      email: "",
      display_name: "",
      bio: "",
      password: "",
    })
  }

  const openEditDialog = (user: UserWithWorkshops) => {
    setSelectedUser(user)
    setFormData({
      email: user.email,
      display_name: user.display_name || "",
      bio: user.bio || "",
      password: "",
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (user: UserWithWorkshops) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500">Create and manage user accounts</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Create User
        </Button>
      </div>

      {/* Quick Link */}
      <Link href="/admin/workshop-users">
        <Card className="hover:bg-slate-50 transition-colors cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Assign Users to Workshops</h3>
                <p className="text-sm text-slate-500">
                  Manage user roles by assigning them to workshops as participants or facilitators
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No users found. Create your first user to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Bio</TableHead>
                  <TableHead>Workshop Assignments</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-500 flex items-center justify-center text-white font-bold">
                          {user.display_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                        </div>
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
                    <TableCell className="max-w-xs truncate">
                      {user.bio || "-"}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => fetchUserWorkshops(user)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Calendar className="w-4 h-4 mr-1" />
                        {user.workshop_count} workshop{user.workshop_count !== 1 ? 's' : ''}
                      </Button>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(user)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(user)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user account. You can assign them to workshops later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
            <div className="space-y-2">
              <Label htmlFor="bio">Bio (optional)</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about this user..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAccount}
              disabled={!formData.email || !formData.password || formData.password.length < 6}
            >
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user profile information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
            <div className="space-y-2">
              <Label htmlFor="edit-bio">Bio</Label>
              <Textarea
                id="edit-bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about this user..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                      assignment.role === 'admin' 
                        ? 'bg-red-100 text-red-700' 
                        : assignment.role === 'facilitator'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
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
            <Link href="/admin/workshop-users">
              <Button variant="outline">
                Manage Assignments
              </Button>
            </Link>
            <Button onClick={() => setViewWorkshopsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.display_name || selectedUser?.email}? 
              This will also remove all their workshop assignments. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
