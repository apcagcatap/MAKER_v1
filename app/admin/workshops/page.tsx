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
  Clock,
  Users,
  ScrollText,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  UserPlus,
  ArrowRight
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
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import type { Profile, Quest } from "@/lib/types"

type WorkshopStatus = "draft" | "scheduled" | "in_progress" | "completed"

interface Workshop {
  id: string
  name: string
  description: string
  date: string
  morning_start: string
  morning_end: string
  afternoon_start: string
  afternoon_end: string
  facilitator_id: string | null
  status: WorkshopStatus
  participants: string[]
  quests: string[]
  created_at: string
}

interface ScheduledQuest {
  quest_id: string
  quest: Quest
  scheduled_time: string
  duration_minutes: number
  order: number
}

export default function WorkshopManagementPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [accounts, setAccounts] = useState<Profile[]>([])
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [participantsDialogOpen, setParticipantsDialogOpen] = useState(false)
  const [questsDialogOpen, setQuestsDialogOpen] = useState(false)
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null)
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
    morning_start: "08:00",
    morning_end: "12:00",
    afternoon_start: "13:00",
    afternoon_end: "17:00",
    facilitator_id: "",
    status: "draft" as WorkshopStatus,
  })

  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [selectedQuests, setSelectedQuests] = useState<string[]>([])

  const supabase = createClient()

  // Mock data for workshops (in production, this would be a database table)
  const fetchWorkshops = useCallback(async () => {
    setLoading(true)
    
    // Simulate fetching workshops
    // In production, you'd have a workshops table
    const mockWorkshops: Workshop[] = [
      {
        id: "1",
        name: "Maker Event Day 1",
        description: "Introduction to making and first set of quests",
        date: "2024-01-15",
        morning_start: "08:00",
        morning_end: "12:00",
        afternoon_start: "13:00",
        afternoon_end: "17:00",
        facilitator_id: null,
        status: "draft",
        participants: [],
        quests: [],
        created_at: new Date().toISOString(),
      },
    ]
    
    setWorkshops(mockWorkshops)
    setLoading(false)
  }, [])

  const fetchAccounts = useCallback(async () => {
    const { data } = await supabase
      .from("users")
      .select("*")
      .order("display_name")
    
    if (data) {
      setAccounts(data)
    }
  }, [supabase])

  const fetchQuests = useCallback(async () => {
    const { data } = await supabase
      .from("quests")
      .select("*")
      .eq("is_active", true)
      .order("title")
    
    if (data) {
      setQuests(data)
    }
  }, [supabase])

  useEffect(() => {
    fetchWorkshops()
    fetchAccounts()
    fetchQuests()
  }, [fetchWorkshops, fetchAccounts, fetchQuests])

  const filteredWorkshops = workshops.filter(workshop => {
    const matchesSearch = workshop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workshop.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || workshop.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreateWorkshop = async () => {
    const newWorkshop: Workshop = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      date: formData.date,
      morning_start: formData.morning_start,
      morning_end: formData.morning_end,
      afternoon_start: formData.afternoon_start,
      afternoon_end: formData.afternoon_end,
      facilitator_id: formData.facilitator_id || null,
      status: formData.status,
      participants: [],
      quests: [],
      created_at: new Date().toISOString(),
    }
    
    setWorkshops([newWorkshop, ...workshops])
    setCreateDialogOpen(false)
    resetForm()
  }

  const handleEditWorkshop = async () => {
    if (!selectedWorkshop) return

    const updatedWorkshops = workshops.map(w => 
      w.id === selectedWorkshop.id 
        ? {
            ...w,
            name: formData.name,
            description: formData.description,
            date: formData.date,
            morning_start: formData.morning_start,
            morning_end: formData.morning_end,
            afternoon_start: formData.afternoon_start,
            afternoon_end: formData.afternoon_end,
            facilitator_id: formData.facilitator_id || null,
            status: formData.status,
          }
        : w
    )
    
    setWorkshops(updatedWorkshops)
    setEditDialogOpen(false)
    setSelectedWorkshop(null)
    resetForm()
  }

  const handleDeleteWorkshop = async () => {
    if (!selectedWorkshop) return
    setWorkshops(workshops.filter(w => w.id !== selectedWorkshop.id))
    setDeleteDialogOpen(false)
    setSelectedWorkshop(null)
  }

  const handleSaveParticipants = () => {
    if (!selectedWorkshop) return
    
    const updatedWorkshops = workshops.map(w =>
      w.id === selectedWorkshop.id
        ? { ...w, participants: selectedParticipants }
        : w
    )
    
    setWorkshops(updatedWorkshops)
    setParticipantsDialogOpen(false)
  }

  const handleSaveQuests = () => {
    if (!selectedWorkshop) return
    
    const updatedWorkshops = workshops.map(w =>
      w.id === selectedWorkshop.id
        ? { ...w, quests: selectedQuests }
        : w
    )
    
    setWorkshops(updatedWorkshops)
    setQuestsDialogOpen(false)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      date: "",
      morning_start: "08:00",
      morning_end: "12:00",
      afternoon_start: "13:00",
      afternoon_end: "17:00",
      facilitator_id: "",
      status: "draft",
    })
  }

  const openEditDialog = (workshop: Workshop) => {
    setSelectedWorkshop(workshop)
    setFormData({
      name: workshop.name,
      description: workshop.description,
      date: workshop.date,
      morning_start: workshop.morning_start,
      morning_end: workshop.morning_end,
      afternoon_start: workshop.afternoon_start,
      afternoon_end: workshop.afternoon_end,
      facilitator_id: workshop.facilitator_id || "",
      status: workshop.status,
    })
    setEditDialogOpen(true)
  }

  const openParticipantsDialog = (workshop: Workshop) => {
    setSelectedWorkshop(workshop)
    setSelectedParticipants(workshop.participants)
    setParticipantsDialogOpen(true)
  }

  const openQuestsDialog = (workshop: Workshop) => {
    setSelectedWorkshop(workshop)
    setSelectedQuests(workshop.quests)
    setQuestsDialogOpen(true)
  }

  const openDeleteDialog = (workshop: Workshop) => {
    setSelectedWorkshop(workshop)
    setDeleteDialogOpen(true)
  }

  const getStatusBadge = (status: WorkshopStatus) => {
    switch (status) {
      case "draft":
        return { color: "bg-slate-100 text-slate-700 border-slate-200", icon: Edit, label: "Draft" }
      case "scheduled":
        return { color: "bg-blue-100 text-blue-700 border-blue-200", icon: Calendar, label: "Scheduled" }
      case "in_progress":
        return { color: "bg-green-100 text-green-700 border-green-200", icon: Play, label: "In Progress" }
      case "completed":
        return { color: "bg-purple-100 text-purple-700 border-purple-200", icon: CheckCircle, label: "Completed" }
      default:
        return { color: "bg-slate-100 text-slate-700 border-slate-200", icon: AlertCircle, label: status }
    }
  }

  const facilitators = accounts.filter(a => a.role === "facilitator" || a.role === "admin")
  const participants = accounts.filter(a => a.role === "participant")

  const stats = [
    { label: "Total Workshops", value: workshops.length, icon: Calendar },
    { label: "Scheduled", value: workshops.filter(w => w.status === "scheduled").length, icon: Clock },
    { label: "In Progress", value: workshops.filter(w => w.status === "in_progress").length, icon: Play },
    { label: "Completed", value: workshops.filter(w => w.status === "completed").length, icon: CheckCircle },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workshop Management</h1>
          <p className="text-slate-500">Plan and manage Maker Event workshops</p>
        </div>
        <Button 
          onClick={() => setCreateDialogOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Workshop
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="border-slate-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Workshop Flow Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Workshop Setup Flow</h4>
              <div className="flex items-center gap-2 mt-2 text-sm text-blue-700 flex-wrap">
                <span className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded">
                  <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center">1</span>
                  Create Workshop
                </span>
                <ArrowRight className="w-4 h-4" />
                <span className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded">
                  <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center">2</span>
                  Invite Participants
                </span>
                <ArrowRight className="w-4 h-4" />
                <span className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded">
                  <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center">3</span>
                  Add & Schedule Quests
                </span>
                <ArrowRight className="w-4 h-4" />
                <span className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded">
                  <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center">4</span>
                  Start Workshop
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search workshops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Workshops List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="border-slate-200">
            <CardContent className="p-8 text-center text-slate-500">
              Loading workshops...
            </CardContent>
          </Card>
        ) : filteredWorkshops.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-8 text-center text-slate-500">
              No workshops found. Create your first workshop to start planning.
            </CardContent>
          </Card>
        ) : (
          filteredWorkshops.map((workshop) => {
            const statusInfo = getStatusBadge(workshop.status)
            const StatusIcon = statusInfo.icon
            const facilitator = accounts.find(a => a.id === workshop.facilitator_id)
            
            return (
              <Card key={workshop.id} className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900 text-lg">{workshop.name}</h3>
                        <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mb-4">
                        {workshop.description || "No description provided"}
                      </p>
                      
                      {/* Workshop Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">
                            {workshop.date ? new Date(workshop.date).toLocaleDateString() : "Not set"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">
                            {workshop.morning_start} - {workshop.afternoon_end}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">
                            {workshop.participants.length} participants
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <ScrollText className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">
                            {workshop.quests.length} quests
                          </span>
                        </div>
                      </div>

                      {/* Facilitator */}
                      {facilitator && (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <span>Facilitator:</span>
                          <span className="font-medium text-slate-700">{facilitator.display_name || facilitator.email}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openParticipantsDialog(workshop)}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Participants
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openQuestsDialog(workshop)}
                      >
                        <ScrollText className="w-4 h-4 mr-1" />
                        Quests
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(workshop)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {workshop.status === "draft" && (
                            <DropdownMenuItem onClick={() => {
                              const updated = workshops.map(w =>
                                w.id === workshop.id ? { ...w, status: "scheduled" as WorkshopStatus } : w
                              )
                              setWorkshops(updated)
                            }}>
                              <Calendar className="w-4 h-4 mr-2" />
                              Schedule
                            </DropdownMenuItem>
                          )}
                          {workshop.status === "scheduled" && (
                            <DropdownMenuItem onClick={() => {
                              const updated = workshops.map(w =>
                                w.id === workshop.id ? { ...w, status: "in_progress" as WorkshopStatus } : w
                              )
                              setWorkshops(updated)
                            }}>
                              <Play className="w-4 h-4 mr-2" />
                              Start Workshop
                            </DropdownMenuItem>
                          )}
                          {workshop.status === "in_progress" && (
                            <DropdownMenuItem onClick={() => {
                              const updated = workshops.map(w =>
                                w.id === workshop.id ? { ...w, status: "completed" as WorkshopStatus } : w
                              )
                              setWorkshops(updated)
                            }}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Complete Workshop
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(workshop)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Create Workshop Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Workshop</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="name">Workshop Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Maker Event Day 1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the workshop..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Morning Session</Label>
                <div className="flex gap-2">
                  <Input
                    type="time"
                    value={formData.morning_start}
                    onChange={(e) => setFormData({ ...formData, morning_start: e.target.value })}
                  />
                  <Input
                    type="time"
                    value={formData.morning_end}
                    onChange={(e) => setFormData({ ...formData, morning_end: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Afternoon Session</Label>
                <div className="flex gap-2">
                  <Input
                    type="time"
                    value={formData.afternoon_start}
                    onChange={(e) => setFormData({ ...formData, afternoon_start: e.target.value })}
                  />
                  <Input
                    type="time"
                    value={formData.afternoon_end}
                    onChange={(e) => setFormData({ ...formData, afternoon_end: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="facilitator">Facilitator</Label>
              <Select 
                value={formData.facilitator_id} 
                onValueChange={(value) => setFormData({ ...formData, facilitator_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select facilitator" />
                </SelectTrigger>
                <SelectContent>
                  {facilitators.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.display_name || f.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateWorkshop}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Create Workshop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Workshop Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Workshop</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Workshop Name</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_date">Date</Label>
              <Input
                id="edit_date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Morning Session</Label>
                <div className="flex gap-2">
                  <Input
                    type="time"
                    value={formData.morning_start}
                    onChange={(e) => setFormData({ ...formData, morning_start: e.target.value })}
                  />
                  <Input
                    type="time"
                    value={formData.morning_end}
                    onChange={(e) => setFormData({ ...formData, morning_end: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Afternoon Session</Label>
                <div className="flex gap-2">
                  <Input
                    type="time"
                    value={formData.afternoon_start}
                    onChange={(e) => setFormData({ ...formData, afternoon_start: e.target.value })}
                  />
                  <Input
                    type="time"
                    value={formData.afternoon_end}
                    onChange={(e) => setFormData({ ...formData, afternoon_end: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_facilitator">Facilitator</Label>
              <Select 
                value={formData.facilitator_id} 
                onValueChange={(value) => setFormData({ ...formData, facilitator_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select facilitator" />
                </SelectTrigger>
                <SelectContent>
                  {facilitators.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.display_name || f.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: WorkshopStatus) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditWorkshop}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Participants Dialog */}
      <Dialog open={participantsDialogOpen} onOpenChange={setParticipantsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Participants - {selectedWorkshop?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-500 mb-4">
              Select participants to invite to this workshop.
            </p>
            <div className="max-h-[40vh] overflow-y-auto space-y-2">
              {participants.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  No participants available. Create participant accounts first.
                </p>
              ) : (
                participants.map((participant) => (
                  <div 
                    key={participant.id}
                    className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    <Checkbox
                      checked={selectedParticipants.includes(participant.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedParticipants([...selectedParticipants, participant.id])
                        } else {
                          setSelectedParticipants(selectedParticipants.filter(id => id !== participant.id))
                        }
                      }}
                    />
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                      {participant.display_name?.[0]?.toUpperCase() || "P"}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-slate-900">
                        {participant.display_name || "Unnamed"}
                      </p>
                      <p className="text-xs text-slate-500">{participant.email}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                <span className="font-medium">{selectedParticipants.length}</span> participants selected
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setParticipantsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveParticipants}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Participants
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quests Dialog */}
      <Dialog open={questsDialogOpen} onOpenChange={setQuestsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Quests - {selectedWorkshop?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-500 mb-4">
              Select and schedule quests for this workshop.
            </p>
            <div className="max-h-[40vh] overflow-y-auto space-y-2">
              {quests.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  No active quests available. Create quests first.
                </p>
              ) : (
                quests.map((quest) => (
                  <div 
                    key={quest.id}
                    className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    <Checkbox
                      checked={selectedQuests.includes(quest.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedQuests([...selectedQuests, quest.id])
                        } else {
                          setSelectedQuests(selectedQuests.filter(id => id !== quest.id))
                        }
                      }}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-slate-900">
                        {quest.title}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {quest.description || "No description"}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {quest.difficulty}
                    </Badge>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                <span className="font-medium">{selectedQuests.length}</span> quests selected
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveQuests}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Quests
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workshop</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              Are you sure you want to delete <span className="font-semibold">{selectedWorkshop?.name}</span>?
            </p>
            <p className="text-sm text-slate-500 mt-2">
              This will remove all participant assignments and quest schedules. This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteWorkshop}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Workshop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
