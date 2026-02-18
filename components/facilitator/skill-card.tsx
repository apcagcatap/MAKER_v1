"use client"

import { useState } from "react"
import { Skill } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Edit, Archive, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateSkill, deleteSkill } from "@/lib/actions/quests"
import { toast } from "sonner"

interface SkillCardProps {
  skill: Skill
}

export function SkillCard({ skill }: SkillCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Edit Form State
  const [name, setName] = useState(skill.name)
  const [description, setDescription] = useState(skill.description || "")
  // Initialize icon with existing skill icon or default
  const [icon, setIcon] = useState(skill.icon || "🎯")

  const handleUpdate = async () => {
    if (!name.trim()) return toast.error("Name is required")
    
    setIsLoading(true)
    try {
      // FIX: Now passing 4 arguments: id, name, description, icon
      await updateSkill(skill.id, name, description, icon)
      toast.success("Skill updated successfully")
      setIsEditOpen(false)
    } catch (error) {
      toast.error("Failed to update skill")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this skill?")) return

    setIsLoading(true)
    try {
      await deleteSkill(skill.id)
      toast.success("Skill deleted successfully")
    } catch (error) {
      toast.error("Failed to delete skill")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 md:p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
          <div className="text-2xl sm:text-3xl md:text-4xl flex-shrink-0">{skill.icon || "🎯"}</div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-1 break-words">
              {skill.name}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
              {skill.description}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsEditOpen(true)}
            className="flex-1 bg-transparent text-xs sm:text-sm md:text-base h-8 sm:h-9 md:h-10"
          >
            <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDelete}
            disabled={isLoading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent h-8 sm:h-9 md:h-10 px-2 sm:px-3"
          >
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Archive className="w-3 h-3 sm:w-4 sm:h-4" />}
          </Button>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Skill</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex gap-4">
              <div className="grid gap-2 flex-1">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid gap-2 w-20">
                <Label htmlFor="icon">Icon</Label>
                <Input
                  id="icon"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="text-center text-xl"
                  maxLength={2}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}