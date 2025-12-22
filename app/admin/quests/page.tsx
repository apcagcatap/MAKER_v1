"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  ScrollText,
  Clock,
  Award,
  ChevronDown,
  ChevronUp,
  GripVertical
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
import { Switch } from "@/components/ui/switch"
import type { Quest, QuestDifficulty } from "@/lib/types"

interface QuestSection {
  id: string
  title: string
  description: string
  order: number
}

interface QuestWithSections extends Quest {
  sections?: QuestSection[]
}

export default function QuestManagementPage() {
  const [quests, setQuests] = useState<QuestWithSections[]>([])
  const [filteredQuests, setFilteredQuests] = useState<QuestWithSections[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sectionsDialogOpen, setSectionsDialogOpen] = useState(false)
  const [selectedQuest, setSelectedQuest] = useState<QuestWithSections | null>(null)
  
  // Expanded sections
  const [expandedQuests, setExpandedQuests] = useState<Set<string>>(new Set())
  
  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "beginner" as QuestDifficulty,
    duration_minutes: 60,
    is_active: true,
  })

  const [sectionFormData, setSectionFormData] = useState<QuestSection[]>([])

  const supabase = createClient()

  const fetchQuests = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("quests")
      .select("*")
      .order("created_at", { ascending: false })
    
    if (!error && data) {
      // For prototype, simulate sections (in production, this would be a real table)
      const questsWithSections = data.map(quest => ({
        ...quest,
        sections: [] as QuestSection[]
      }))
      setQuests(questsWithSections)
      setFilteredQuests(questsWithSections)
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
    
    if (statusFilter === "active") {
      filtered = filtered.filter((quest) => quest.is_active)
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((quest) => !quest.is_active)
    }
    
    setFilteredQuests(filtered)
  }, [searchQuery, statusFilter, quests])

  const handleCreateQuest = async () => {
    const { data: userData } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from("quests")
      .insert({
        title: formData.title,
        description: formData.description,
        difficulty: formData.difficulty,
        xp_reward: formData.duration_minutes, // Using duration as placeholder
        is_active: formData.is_active,
        created_by: userData.user?.id,
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
      .from("quests")
      .update({
        title: formData.title,
        description: formData.description,
        difficulty: formData.difficulty,
        is_active: formData.is_active,
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
      .from("quests")
      .delete()
      .eq("id", selectedQuest.id)

    if (!error) {
      fetchQuests()
      setDeleteDialogOpen(false)
      setSelectedQuest(null)
    }
  }

  const toggleQuestActive = async (quest: QuestWithSections) => {
    const { error } = await supabase
      .from("quests")
      .update({ is_active: !quest.is_active })
      .eq("id", quest.id)

    if (!error) {
      fetchQuests()
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      difficulty: "beginner",
      duration_minutes: 60,
      is_active: true,
    })
  }

  const openEditDialog = (quest: QuestWithSections) => {
    setSelectedQuest(quest)
    setFormData({
      title: quest.title,
      description: quest.description || "",
      difficulty: quest.difficulty,
      duration_minutes: quest.xp_reward || 60,
      is_active: quest.is_active,
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (quest: QuestWithSections) => {
    setSelectedQuest(quest)
    setDeleteDialogOpen(true)
  }

  const openSectionsDialog = (quest: QuestWithSections) => {
    setSelectedQuest(quest)
    // Use existing sections or start empty for new quests
    setSectionFormData(quest.sections && quest.sections.length > 0 
      ? quest.sections 
      : []
    )
    setSectionsDialogOpen(true)
  }

  const toggleQuestExpanded = (questId: string) => {
    const newExpanded = new Set(expandedQuests)
    if (newExpanded.has(questId)) {
      newExpanded.delete(questId)
    } else {
      newExpanded.add(questId)
    }
    setExpandedQuests(newExpanded)
  }

  const addSection = () => {
    const newSection: QuestSection = {
      id: Date.now().toString(),
      title: `Section ${sectionFormData.length + 1}`,
      description: "",
      order: sectionFormData.length + 1,
    }
    setSectionFormData([...sectionFormData, newSection])
  }

  const removeSection = (sectionId: string) => {
    setSectionFormData(sectionFormData.filter(s => s.id !== sectionId))
  }

  const updateSection = (sectionId: string, field: keyof QuestSection, value: string | number) => {
    setSectionFormData(sectionFormData.map(s => 
      s.id === sectionId ? { ...s, [field]: value } : s
    ))
  }

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-700 border-green-200"
      case "intermediate":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "advanced":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-slate-100 text-slate-700 border-slate-200"
    }
  }

  const stats = [
    { label: "Total Quests", value: quests.length, icon: ScrollText },
    { label: "Active Quests", value: quests.filter(q => q.is_active).length, icon: ScrollText },
    { label: "Inactive", value: quests.filter(q => !q.is_active).length, icon: ScrollText },
    { label: "Badges Available", value: quests.length * 2, icon: Award },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quest Management</h1>
          <p className="text-slate-500">Create and manage quests with badge sections</p>
        </div>
        <Button 
          onClick={() => setCreateDialogOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Quest
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

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <Award className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Badge System</h4>
              <p className="text-sm text-blue-700 mt-1">
                Each quest section awards two badges: a <strong>Participation Badge</strong> (awarded when starting) 
                and a <strong>Completion Badge</strong> (awarded after facilitator approval via QR scan).
              </p>
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
                placeholder="Search quests..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quests List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="border-slate-200">
            <CardContent className="p-8 text-center text-slate-500">
              Loading quests...
            </CardContent>
          </Card>
        ) : filteredQuests.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-8 text-center text-slate-500">
              No quests found. Create your first quest to get started.
            </CardContent>
          </Card>
        ) : (
          filteredQuests.map((quest) => (
            <Card key={quest.id} className="border-slate-200">
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <button
                        onClick={() => toggleQuestExpanded(quest.id)}
                        className="p-1 hover:bg-slate-100 rounded mt-1"
                      >
                        {expandedQuests.has(quest.id) ? (
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-slate-900">{quest.title}</h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getDifficultyBadge(quest.difficulty)}`}>
                            {quest.difficulty}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            quest.is_active 
                              ? "bg-green-100 text-green-700" 
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            {quest.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-2">
                          {quest.description || "No description provided"}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {quest.xp_reward || 60} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            {(quest.sections?.length || 2) * 2} badges
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openSectionsDialog(quest)}
                      >
                        Sections
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(quest)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleQuestActive(quest)}>
                            {quest.is_active ? "Deactivate" : "Activate"}
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
                    </div>
                  </div>
                </div>
                
                {/* Expanded Sections View */}
                {expandedQuests.has(quest.id) && (
                  <div className="border-t border-slate-100 p-4 bg-slate-50">
                    <h4 className="text-sm font-medium text-slate-700 mb-3">Quest Sections</h4>
                    <div className="space-y-2">
                      {(quest.sections?.length ? quest.sections : [
                        { id: "1", title: "Introduction", description: "Get started with the basics", order: 1 },
                        { id: "2", title: "Main Challenge", description: "Complete the main objective", order: 2 },
                      ]).map((section, index) => (
                        <div key={section.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm text-slate-900">{section.title}</p>
                            <p className="text-xs text-slate-500">{section.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                              Participation
                            </span>
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                              Completion
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Quest Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Quest</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Quest Title</Label>
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
                placeholder="Describe the quest objectives..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select 
                  value={formData.difficulty} 
                  onValueChange={(value: QuestDifficulty) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                  min={15}
                  step={15}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Active</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateQuest}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Create Quest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Quest Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Quest</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_title">Quest Title</Label>
              <Input
                id="edit_title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_difficulty">Difficulty</Label>
                <Select 
                  value={formData.difficulty} 
                  onValueChange={(value: QuestDifficulty) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_duration">Duration (minutes)</Label>
                <Input
                  id="edit_duration"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                  min={15}
                  step={15}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit_is_active">Active</Label>
              <Switch
                id="edit_is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditQuest}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sections Dialog */}
      <Dialog open={sectionsDialogOpen} onOpenChange={setSectionsDialogOpen}>
        <DialogContent className="sm:max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Manage Quest Sections
            </DialogTitle>
            <p className="text-sm text-slate-500 mt-1">
              {selectedQuest?.title}
            </p>
          </DialogHeader>
          
          <div className="py-2">
            {/* Badge Info */}
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-600" />
                <span className="text-xs text-slate-600">Participation Badge</span>
              </div>
              <span className="text-slate-300">+</span>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-green-600" />
                <span className="text-xs text-slate-600">Completion Badge</span>
              </div>
              <span className="text-xs text-slate-400 ml-auto">per section</span>
            </div>

            {/* Sections List */}
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {sectionFormData.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                  <ScrollText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No sections yet</p>
                  <p className="text-xs text-slate-400">Add sections to structure your quest</p>
                </div>
              ) : (
                sectionFormData.map((section, index) => (
                  <div key={section.id} className="group border border-slate-200 rounded-lg bg-white hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-3 p-3 border-b border-slate-100 bg-slate-50 rounded-t-lg">
                      <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
                      <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-slate-700 flex-1">
                        Section {index + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-yellow-400" title="Participation Badge" />
                        <span className="w-2 h-2 rounded-full bg-green-500" title="Completion Badge" />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSection(section.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="p-3 space-y-3">
                      <div>
                        <Label className="text-xs text-slate-500 mb-1 block">Title</Label>
                        <Input
                          value={section.title}
                          onChange={(e) => updateSection(section.id, "title", e.target.value)}
                          placeholder="e.g., Getting Started"
                          className="bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500 mb-1 block">Description</Label>
                        <Textarea
                          value={section.description}
                          onChange={(e) => updateSection(section.id, "description", e.target.value)}
                          placeholder="What participants will accomplish in this section..."
                          rows={2}
                          className="bg-white resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Section Button */}
            <Button
              variant="outline"
              onClick={addSection}
              className="w-full mt-4 border-dashed border-2 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Section
            </Button>

            {/* Summary */}
            {sectionFormData.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                <span className="text-slate-500">
                  {sectionFormData.length} section{sectionFormData.length !== 1 ? 's' : ''}
                </span>
                <span className="text-slate-500">
                  <span className="font-medium text-slate-700">{sectionFormData.length * 2}</span> badges total
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSectionsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                // In production, save sections to database
                setSectionsDialogOpen(false)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Sections
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quest</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              Are you sure you want to delete <span className="font-semibold">{selectedQuest?.title}</span>?
            </p>
            <p className="text-sm text-slate-500 mt-2">
              This will also delete all associated sections and badge data. This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteQuest}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Quest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
