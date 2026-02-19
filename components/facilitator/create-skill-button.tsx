"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createNewSkill } from "@/lib/actions/quests"
import { toast } from "sonner"

export function CreateSkillButton() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")
  const [icon, setIcon] = useState("🎯")
  const [description, setDescription] = useState("")

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }

    setIsLoading(true)
    try {
      await createNewSkill(name, icon, description)
      toast.success("Skill created successfully")
      setOpen(false)
      // Reset form
      setName("")
      setIcon("🎯")
      setDescription("")
    } catch (error) {
      console.error(error)
      toast.error("Failed to create skill")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* Add Skill Button: Solid Blue */}
        <Button className="bg-[#2563EB] hover:bg-[#1D4ED8] w-full sm:w-auto text-sm sm:text-base h-9 sm:h-10 text-white shadow-md border-none">
          <Plus className="w-4 h-4 mr-2" />
          Add Skill
        </Button>
      </DialogTrigger>
      
      {/* Dialog Container: White background */}
      <DialogContent className="sm:max-w-[425px] bg-white border-none shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-gray-900 font-bold text-xl">Create New Skill</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex gap-4">
            <div className="grid gap-2 flex-1">
              <Label htmlFor="create-name" className="text-gray-700">Name</Label>
              <Input
                id="create-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Robotics"
                className="bg-white border-gray-200 text-gray-900 focus:ring-[#2563EB]"
              />
            </div>
            <div className="grid gap-2 w-20">
              <Label htmlFor="create-icon" className="text-gray-700">Icon</Label>
              <Input
                id="create-icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="text-center text-xl bg-white border-gray-200"
                maxLength={2}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="create-desc" className="text-gray-700">Description</Label>
            <Textarea
              id="create-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
              className="bg-white border-gray-200 text-gray-900 focus:ring-[#2563EB]"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-end gap-2">
          {/* Cancel Button: Fixed to be solid blue identical to Create button */}
          <Button 
            type="button"
            onClick={() => setOpen(false)}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white border-none"
          >
            Cancel
          </Button>
          
          {/* Create Skill Button: Solid Blue */}
          <Button 
            onClick={handleCreate} 
            disabled={isLoading}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white border-none"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Skill"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}