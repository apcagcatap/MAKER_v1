"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  ScrollText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import type { Quest } from "@/lib/types"

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
    let filtered = quests
    
    if (searchQuery) {
      filtered = filtered.filter(
        (quest) =>
          quest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          quest.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    setFilteredQuests(filtered)
  }, [searchQuery, quests])

  const handleCreateQuest = async () => {
    const { error } = await supabase
      .from("quest")
      .insert({
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
    setFormData({
      title: "",
      description: "",
    })
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quest Management</h1>
          <p className="text-slate-500">Create and manage quests for workshops</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Quest
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search quests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="w-5 h-5" />
            Quests ({filteredQuests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading...</div>
          ) : filteredQuests.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No quests found. Create your first quest to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuests.map((quest) => (
                  <TableRow key={quest.id}>
                    <TableCell className="font-medium">{quest.title}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {quest.description || "-"}
                    </TableCell>
                    <TableCell>
                      {new Date(quest.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(quest)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(quest)}
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
            <DialogTitle>Create New Quest</DialogTitle>
            <DialogDescription>
              Add a new quest that can be assigned to workshops.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateQuest} disabled={!formData.title}>
              Create Quest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Quest</DialogTitle>
            <DialogDescription>
              Update the quest details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditQuest} disabled={!formData.title}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quest</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedQuest?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteQuest}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
