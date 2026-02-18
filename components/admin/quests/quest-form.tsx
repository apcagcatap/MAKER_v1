"use client"

import { useRef, useState } from "react"
import { createQuest, updateQuest } from "@/lib/actions/admin-quests"
import { Archive, Plus } from "lucide-react"

interface Quest {
  id: string
  title: string
  description: string | null
  difficulty: string | null
  skill_id: string | null
  is_active: boolean
  badge_image_url: string | null
  certificate_image_url: string | null
  materials_needed: string | null
  general_instructions: string | null
  levels: any
  scheduled_date: string | null
  status: string | null
  xp_reward: string | null
}

interface QuestLevel {
  title: string
  description: string
}

interface QuestFormProps {
  quest?: Quest
  onSuccess?: () => void
}

export function QuestForm({ quest, onSuccess }: QuestFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [levels, setLevels] = useState<QuestLevel[]>(
    Array.isArray(quest?.levels) ? quest.levels : []
  )

  const addLevel = () => setLevels([...levels, { title: "", description: "" }])
  const removeLevel = (index: number) => setLevels(levels.filter((_, i) => i !== index))
  const updateLevel = (index: number, field: keyof QuestLevel, value: string) => {
    const newLevels = [...levels]
    newLevels[index] = { ...newLevels[index], [field]: value }
    setLevels(newLevels)
  }

  async function action(formData: FormData) {
    const res = quest 
      ? await updateQuest(formData)
      : await createQuest(formData)

    if (res.error) {
      alert(`Error: ${res.error}`)
    } else {
      if (!quest) {
        formRef.current?.reset()
      }
      if (onSuccess) onSuccess()
    }
  }

  return (
    <form ref={formRef} action={action} className="space-y-4 p-4 border rounded-lg bg-white shadow-sm text-black">
      {quest && <input type="hidden" name="id" value={quest.id} />}
      
      <div className="grid gap-2">
        <label htmlFor="title" className="text-sm font-medium">Title</label>
        <input
          id="title"
          name="title"
          defaultValue={quest?.title}
          required
          className="w-full p-2 border rounded-md"
          placeholder="e.g. Daily Login"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="description" className="text-sm font-medium">Description</label>
        <textarea
          id="description"
          name="description"
          defaultValue={quest?.description ?? ""}
          required
          className="w-full p-2 border rounded-md min-h-25"
          placeholder="Describe the quest requirements..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <label htmlFor="xp_reward" className="text-sm font-medium">XP Reward</label>
          <input
            id="xp_reward"
            name="xp_reward"
            defaultValue={quest?.xp_reward ?? ""}
            className="w-full p-2 border rounded-md"
            placeholder="e.g. 100 XP"
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="difficulty" className="text-sm font-medium">Difficulty</label>
          <input
            id="difficulty"
            name="difficulty"
            defaultValue={quest?.difficulty ?? "Easy"}
            className="w-full p-2 border rounded-md"
            placeholder="e.g. Easy, Medium, Hard"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <label htmlFor="status" className="text-sm font-medium">Status</label>
          <select 
            id="status" 
            name="status" 
            defaultValue={quest?.status ?? "Draft"}
            className="w-full p-2 border rounded-md"
          >
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
        <div className="grid gap-2">
          <label htmlFor="scheduled_date" className="text-sm font-medium">Scheduled Date</label>
          <input
            type="date"
            id="scheduled_date"
            name="scheduled_date"
            defaultValue={quest?.scheduled_date ? new Date(quest.scheduled_date).toISOString().split('T')[0] : ""}
            className="w-full p-2 border rounded-md"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label htmlFor="materials_needed" className="text-sm font-medium">Materials Needed</label>
        <textarea
          id="materials_needed"
          name="materials_needed"
          defaultValue={quest?.materials_needed ?? ""}
          className="w-full p-2 border rounded-md min-h-20"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="general_instructions" className="text-sm font-medium">General Instructions</label>
        <textarea
          id="general_instructions"
          name="general_instructions"
          defaultValue={quest?.general_instructions ?? ""}
          className="w-full p-2 border rounded-md min-h-20"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <label htmlFor="badge_image" className="text-sm font-medium">Badge Image</label>
          {quest?.badge_image_url && (
            <div className="relative h-20 w-20 mb-2">
              <img src={quest.badge_image_url} alt="Current Badge" className="h-full w-full object-contain border rounded-md bg-gray-50" />
            </div>
          )}
          <input
            type="file"
            id="badge_image"
            name="badge_image"
            accept="image/*"
            className="w-full p-2 border rounded-md text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <input type="hidden" name="existing_badge_image_url" value={quest?.badge_image_url ?? ""} />
        </div>
        <div className="grid gap-2">
          <label htmlFor="certificate_image" className="text-sm font-medium">Certificate Image</label>
          {quest?.certificate_image_url && (
            <div className="relative h-20 w-20 mb-2">
              <img src={quest.certificate_image_url} alt="Current Certificate" className="h-full w-full object-contain border rounded-md bg-gray-50" />
            </div>
          )}
          <input
            type="file"
            id="certificate_image"
            name="certificate_image"
            accept="image/*"
            className="w-full p-2 border rounded-md text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <input type="hidden" name="existing_certificate_image_url" value={quest?.certificate_image_url ?? ""} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Levels</label>
          <button
            type="button"
            onClick={addLevel}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-4 w-4" /> Add Level
          </button>
        </div>
        
        <input type="hidden" name="levels" value={JSON.stringify(levels)} />

        <div className="space-y-3">
          {levels.map((level, index) => (
            <div key={index} className="p-4 border rounded-lg bg-gray-50 relative space-y-3">
              <button
                type="button"
                onClick={() => removeLevel(index)}
                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Archive className="h-4 w-4" />
              </button>
              
              <div className="grid gap-2">
                <label className="text-xs font-medium text-gray-700">Level {index + 1} Title</label>
                <input
                  value={level.title}
                  onChange={(e) => updateLevel(index, "title", e.target.value)}
                  className="w-full p-2 border rounded-md text-sm bg-white"
                  placeholder="e.g. Basics"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <label className="text-xs font-medium text-gray-700">Description</label>
                <textarea
                  value={level.description}
                  onChange={(e) => updateLevel(index, "description", e.target.value)}
                  className="w-full p-2 border rounded-md text-sm bg-white min-h-[60px]"
                  placeholder="Level requirements..."
                  required
                />
              </div>
            </div>
          ))}
          
          {levels.length === 0 && (
            <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 text-sm">
              No levels added yet.
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_active"
          name="is_active"
          defaultChecked={quest ? quest.is_active : true}
          className="h-4 w-4"
        />
        <label htmlFor="is_active" className="text-sm font-medium">Is Active</label>
      </div>

      <button
        type="submit"
        className="w-full bg-[#ED262A] text-white py-2 px-4 rounded-md hover:bg-[#c41e22] transition-colors"
      >
        {quest ? "Update Quest" : "Create Quest"}
      </button>
    </form>
  )
}