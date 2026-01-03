"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  Calendar,
  Users,
  ScrollText
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import type { Workshop } from "@/lib/types"

interface WorkshopWithCounts extends Workshop {
  user_count?: number
  quest_count?: number
}

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
    
    // Fetch workshops
    const { data: workshopsData, error } = await supabase
      .from("workshop")
      .select("*")
      .order("event_date", { ascending: false })
    
    if (!error && workshopsData) {
      // Fetch counts for each workshop
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
    let filtered = workshops
    
    if (searchQuery) {
      filtered = filtered.filter(
        (workshop) =>
          workshop.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    setFilteredWorkshops(filtered)
  }, [searchQuery, workshops])

  const handleCreateWorkshop = async () => {
    const { error } = await supabase
      .from("workshop")
      .insert({
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
    setFormData({
      name: "",
      event_date: "",
    })
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workshop Management</h1>
          <p className="text-slate-500">Create and manage workshops</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Workshop
        </Button>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/workshop-users">
          <Card className="hover:bg-slate-50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Workshop Users</h3>
                  <p className="text-sm text-slate-500">Assign users to workshops with roles</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/workshop-quests">
          <Card className="hover:bg-slate-50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <ScrollText className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Workshop Quests</h3>
                  <p className="text-sm text-slate-500">Assign quests to workshops</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search workshops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Workshops Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Workshops ({filteredWorkshops.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading...</div>
          ) : filteredWorkshops.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No workshops found. Create your first workshop to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Event Date</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Quests</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkshops.map((workshop) => (
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
                    <TableCell>
                      {new Date(workshop.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(workshop)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(workshop)}
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

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Workshop</DialogTitle>
            <DialogDescription>
              Add a new workshop event.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateWorkshop} disabled={!formData.name || !formData.event_date}>
              Create Workshop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Workshop</DialogTitle>
            <DialogDescription>
              Update the workshop details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditWorkshop} disabled={!formData.name || !formData.event_date}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workshop</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedWorkshop?.name}&quot;? This will also remove all user and quest assignments. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteWorkshop}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
