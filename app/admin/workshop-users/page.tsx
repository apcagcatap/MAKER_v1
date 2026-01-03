"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  Plus, 
  Search, 
  Trash2, 
  MoreHorizontal,
  Users,
  UserPlus,
  Shield,
  User as UserIcon
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { Workshop, User, WorkshopUser, WorkshopRole } from "@/lib/types"

interface WorkshopUserWithDetails extends WorkshopUser {
  user: User
  workshop: Workshop
}

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
    
    // Fetch workshops
    const { data: workshopsData } = await supabase
      .from("workshop")
      .select("*")
      .order("name")
    
    if (workshopsData) {
      setWorkshops(workshopsData)
    }

    // Fetch users
    const { data: usersData } = await supabase
      .from("users")
      .select("*")
      .order("display_name")
    
    if (usersData) {
      setUsers(usersData)
    }

    // Fetch workshop_user assignments with joined data
    const { data: assignmentsData } = await supabase
      .from("workshop_user")
      .select(`
        *,
        user:users(*),
        workshop:workshop(*)
      `)
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
    const { error } = await supabase
      .from("workshop_user")
      .insert({
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
    setFormData({
      workshop_id: "",
      user_id: "",
      role: "participant",
    })
  }

  const openEditRoleDialog = (assignment: WorkshopUserWithDetails) => {
    setSelectedAssignment(assignment)
    setFormData({
      ...formData,
      role: assignment.role,
    })
    setEditRoleDialogOpen(true)
  }

  const openDeleteDialog = (assignment: WorkshopUserWithDetails) => {
    setSelectedAssignment(assignment)
    setDeleteDialogOpen(true)
  }

  const getRoleBadge = (role: WorkshopRole) => {
    switch (role) {
      case "facilitator":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100"><UserPlus className="w-3 h-3 mr-1" />Facilitator</Badge>
      case "participant":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><UserIcon className="w-3 h-3 mr-1" />Participant</Badge>
      default:
        return <Badge variant="secondary">{role}</Badge>
    }
  }

  // Get users not already assigned to selected workshop
  const getAvailableUsers = () => {
    if (!formData.workshop_id) return users
    const assignedUserIds = workshopUsers
      .filter(wu => wu.workshop_id === formData.workshop_id)
      .map(wu => wu.user_id)
    return users.filter(u => !assignedUserIds.includes(u.id))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workshop User Assignments</h1>
          <p className="text-slate-500">Assign users to workshops and manage their roles</p>
        </div>
        <Button onClick={() => setAssignDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Assign User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search users or workshops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={workshopFilter} onValueChange={setWorkshopFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by workshop" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workshops</SelectItem>
                {workshops.map((workshop) => (
                  <SelectItem key={workshop.id} value={workshop.id}>
                    {workshop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="facilitator">Facilitator</SelectItem>
                <SelectItem value="participant">Participant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Assignments ({filteredWorkshopUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading...</div>
          ) : filteredWorkshopUsers.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No assignments found. Assign users to workshops to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Workshop</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assigned At</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkshopUsers.map((assignment) => (
                  <TableRow key={`${assignment.workshop_id}-${assignment.user_id}`}>
                    <TableCell className="font-medium">
                      {assignment.user?.display_name || "Unknown User"}
                    </TableCell>
                    <TableCell>{assignment.user?.email}</TableCell>
                    <TableCell>{assignment.workshop?.name || "Unknown Workshop"}</TableCell>
                    <TableCell>{getRoleBadge(assignment.role)}</TableCell>
                    <TableCell>
                      {new Date(assignment.assigned_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditRoleDialog(assignment)}>
                            <Shield className="w-4 h-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(assignment)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
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

      {/* Assign User Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign User to Workshop</DialogTitle>
            <DialogDescription>
              Select a workshop, user, and their role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Workshop</Label>
              <Select 
                value={formData.workshop_id} 
                onValueChange={(value) => setFormData({ ...formData, workshop_id: value, user_id: "" })}
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
                  <SelectValue placeholder={formData.workshop_id ? "Select a user" : "Select a workshop first"} />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignUser} 
              disabled={!formData.workshop_id || !formData.user_id}
            >
              Assign User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editRoleDialogOpen} onOpenChange={setEditRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedAssignment?.user?.display_name} in {selectedAssignment?.workshop?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole}>
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove User from Workshop</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedAssignment?.user?.display_name} from {selectedAssignment?.workshop?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAssignment}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
