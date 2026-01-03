"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  Plus, 
  Search, 
  Trash2, 
  MoreHorizontal,
  ScrollText,
  Calendar,
  Link as LinkIcon
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
import { Checkbox } from "@/components/ui/checkbox"
import type { Workshop, Quest, WorkshopQuest } from "@/lib/types"

interface WorkshopQuestWithDetails extends WorkshopQuest {
  quest: Quest
  workshop: Workshop
}

export default function WorkshopQuestsPage() {
  const [workshopQuests, setWorkshopQuests] = useState<WorkshopQuestWithDetails[]>([])
  const [filteredWorkshopQuests, setFilteredWorkshopQuests] = useState<WorkshopQuestWithDetails[]>([])
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [workshopFilter, setWorkshopFilter] = useState<string>("all")
  
  // Dialog states
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<WorkshopQuestWithDetails | null>(null)
  
  // Form states
  const [formData, setFormData] = useState({
    workshop_id: "",
    quest_id: "",
  })
  const [selectedQuestIds, setSelectedQuestIds] = useState<string[]>([])

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

    // Fetch quests
    const { data: questsData } = await supabase
      .from("quest")
      .select("*")
      .order("title")
    
    if (questsData) {
      setQuests(questsData)
    }

    // Fetch workshop_quest assignments with joined data
    const { data: assignmentsData } = await supabase
      .from("workshop_quest")
      .select(`
        *,
        quest:quest(*),
        workshop:workshop(*)
      `)
    
    if (assignmentsData) {
      setWorkshopQuests(assignmentsData as WorkshopQuestWithDetails[])
      setFilteredWorkshopQuests(assignmentsData as WorkshopQuestWithDetails[])
    }
    
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    let filtered = workshopQuests
    
    if (searchQuery) {
      filtered = filtered.filter(
        (wq) =>
          wq.quest?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          wq.workshop?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    if (workshopFilter !== "all") {
      filtered = filtered.filter((wq) => wq.workshop_id === workshopFilter)
    }
    
    setFilteredWorkshopQuests(filtered)
  }, [searchQuery, workshopFilter, workshopQuests])

  const handleAssignQuest = async () => {
    const { error } = await supabase
      .from("workshop_quest")
      .insert({
        workshop_id: formData.workshop_id,
        quest_id: formData.quest_id,
      })

    if (!error) {
      fetchData()
      setAssignDialogOpen(false)
      resetForm()
    }
  }

  const handleBulkAssign = async () => {
    if (!formData.workshop_id || selectedQuestIds.length === 0) return

    const assignments = selectedQuestIds.map(quest_id => ({
      workshop_id: formData.workshop_id,
      quest_id,
    }))

    const { error } = await supabase
      .from("workshop_quest")
      .insert(assignments)

    if (!error) {
      fetchData()
      setBulkAssignDialogOpen(false)
      setFormData({ workshop_id: "", quest_id: "" })
      setSelectedQuestIds([])
    }
  }

  const handleDeleteAssignment = async () => {
    if (!selectedAssignment) return

    const { error } = await supabase
      .from("workshop_quest")
      .delete()
      .eq("workshop_id", selectedAssignment.workshop_id)
      .eq("quest_id", selectedAssignment.quest_id)

    if (!error) {
      fetchData()
      setDeleteDialogOpen(false)
      setSelectedAssignment(null)
    }
  }

  const resetForm = () => {
    setFormData({
      workshop_id: "",
      quest_id: "",
    })
  }

  const openDeleteDialog = (assignment: WorkshopQuestWithDetails) => {
    setSelectedAssignment(assignment)
    setDeleteDialogOpen(true)
  }

  // Get quests not already assigned to selected workshop
  const getAvailableQuests = () => {
    if (!formData.workshop_id) return quests
    const assignedQuestIds = workshopQuests
      .filter(wq => wq.workshop_id === formData.workshop_id)
      .map(wq => wq.quest_id)
    return quests.filter(q => !assignedQuestIds.includes(q.id))
  }

  const toggleQuestSelection = (questId: string) => {
    setSelectedQuestIds(prev => 
      prev.includes(questId) 
        ? prev.filter(id => id !== questId)
        : [...prev, questId]
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workshop Quest Assignments</h1>
          <p className="text-slate-500">Assign quests to workshops</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBulkAssignDialogOpen(true)}>
            <LinkIcon className="w-4 h-4 mr-2" />
            Bulk Assign
          </Button>
          <Button onClick={() => setAssignDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Assign Quest
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search quests or workshops..."
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
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{workshops.length}</p>
                <p className="text-sm text-slate-500">Total Workshops</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <ScrollText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{quests.length}</p>
                <p className="text-sm text-slate-500">Total Quests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <LinkIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{workshopQuests.length}</p>
                <p className="text-sm text-slate-500">Total Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="w-5 h-5" />
            Quest Assignments ({filteredWorkshopQuests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading...</div>
          ) : filteredWorkshopQuests.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No quest assignments found. Assign quests to workshops to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workshop</TableHead>
                  <TableHead>Quest</TableHead>
                  <TableHead>Quest Description</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkshopQuests.map((assignment) => (
                  <TableRow key={`${assignment.workshop_id}-${assignment.quest_id}`}>
                    <TableCell>
                      <Badge variant="outline">
                        <Calendar className="w-3 h-3 mr-1" />
                        {assignment.workshop?.name || "Unknown Workshop"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {assignment.quest?.title || "Unknown Quest"}
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {assignment.quest?.description || "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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

      {/* Assign Quest Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Quest to Workshop</DialogTitle>
            <DialogDescription>
              Select a workshop and quest to create an assignment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Workshop</Label>
              <Select 
                value={formData.workshop_id} 
                onValueChange={(value) => setFormData({ ...formData, workshop_id: value, quest_id: "" })}
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
              <Label>Quest</Label>
              <Select 
                value={formData.quest_id} 
                onValueChange={(value) => setFormData({ ...formData, quest_id: value })}
                disabled={!formData.workshop_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.workshop_id ? "Select a quest" : "Select a workshop first"} />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableQuests().map((quest) => (
                    <SelectItem key={quest.id} value={quest.id}>
                      {quest.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignQuest} 
              disabled={!formData.workshop_id || !formData.quest_id}
            >
              Assign Quest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Dialog */}
      <Dialog open={bulkAssignDialogOpen} onOpenChange={setBulkAssignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Assign Quests</DialogTitle>
            <DialogDescription>
              Select a workshop and multiple quests to assign at once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Workshop</Label>
              <Select 
                value={formData.workshop_id} 
                onValueChange={(value) => {
                  setFormData({ ...formData, workshop_id: value })
                  setSelectedQuestIds([])
                }}
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
            {formData.workshop_id && (
              <div className="space-y-2">
                <Label>Select Quests ({selectedQuestIds.length} selected)</Label>
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {getAvailableQuests().length === 0 ? (
                    <div className="p-4 text-center text-slate-500">
                      All quests are already assigned to this workshop.
                    </div>
                  ) : (
                    getAvailableQuests().map((quest) => (
                      <div
                        key={quest.id}
                        className="flex items-center gap-3 p-3 hover:bg-slate-50 border-b last:border-b-0"
                      >
                        <Checkbox
                          checked={selectedQuestIds.includes(quest.id)}
                          onCheckedChange={() => toggleQuestSelection(quest.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{quest.title}</p>
                          {quest.description && (
                            <p className="text-sm text-slate-500 truncate">{quest.description}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkAssign} 
              disabled={!formData.workshop_id || selectedQuestIds.length === 0}
            >
              Assign {selectedQuestIds.length} Quest{selectedQuestIds.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Quest from Workshop</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &quot;{selectedAssignment?.quest?.title}&quot; from &quot;{selectedAssignment?.workshop?.name}&quot;? This action cannot be undone.
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
