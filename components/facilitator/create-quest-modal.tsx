"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, Upload, X, Sparkles } from "lucide-react"
import { createQuest, updateQuest, uploadImage } from "@/lib/actions/quests"
import { generateQuestStory } from "@/lib/actions/ai-story"
import { toast } from "sonner"

interface QuestLevel {
  title: string
  description: string
}

interface Story {
  title: string
  content: string
  order_index: number
}

interface LearningResource {
  title: string
  description: string
  type: string
  external_url: string
  order_index: number
}

interface CreateQuestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onQuestSaved?: () => void
  editingQuest?: any
}

export function CreateQuestModal({ open, onOpenChange, onQuestSaved, editingQuest }: CreateQuestModalProps) {
  const router = useRouter()
  const badgeInputRef = useRef<HTMLInputElement>(null)
  const certificateInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingStory, setIsGeneratingStory] = useState(false)

  // Step 1: Basic Details
  const [title, setTitle] = useState(editingQuest?.title || "")
  const [description, setDescription] = useState(editingQuest?.description || "")
  const [difficulty, setDifficulty] = useState(editingQuest?.difficulty || "Beginner - Intermediate")
  const [scheduledDate, setScheduledDate] = useState(editingQuest?.scheduled_date || "")
  const [badgeImageUrl, setBadgeImageUrl] = useState(editingQuest?.badge_image_url || "")
  const [certificateImageUrl, setCertificateImageUrl] = useState(editingQuest?.certificate_image_url || "")
  const [badgeImagePreview, setBadgeImagePreview] = useState<string | null>(editingQuest?.badge_image_url || null)
  const [certificateImagePreview, setCertificateImagePreview] = useState<string | null>(editingQuest?.certificate_image_url || null)
  const [badgeImageUploading, setBadgeImageUploading] = useState(false)
  const [certificateImageUploading, setCertificateImageUploading] = useState(false)
  const [status, setStatus] = useState(editingQuest?.status || "Draft")

  // Step 2: Story
  const [storyContext, setStoryContext] = useState("")
  const [stories, setStories] = useState<Story[]>(
    editingQuest?.stories?.map((s: any, i: number) => ({ title: s.title, content: s.content, order_index: i })) || []
  )

  // Step 3: Learning Resources
  const [learningResources, setLearningResources] = useState<LearningResource[]>(
    editingQuest?.learning_resources?.map((r: any, i: number) => ({ 
      title: r.title, 
      description: r.description || "", 
      type: r.type, 
      external_url: r.external_url, 
      order_index: i 
    })) || []
  )

  // Step 4: Materials & Instructions
  const [materialsNeeded, setMaterialsNeeded] = useState(editingQuest?.materials_needed || "")
  const [generalInstructions, setGeneralInstructions] = useState(editingQuest?.general_instructions || "")

  // Step 5: Quest Levels
  const [levels, setLevels] = useState<QuestLevel[]>(editingQuest?.levels || [])

  const [errors, setErrors] = useState<Record<string, string>>({})

  const getValidationErrors = (stepToValidate: number) => {
    const newErrors: Record<string, string> = {}

    if (stepToValidate === 1) {
      if (!title.trim()) newErrors.title = "Quest name is required"
      if (!description.trim()) newErrors.description = "Description is required"
      if (!badgeImageUrl) newErrors.badgeImage = "Badge image is required"
      if (!certificateImageUrl) newErrors.certificateImage = "Certificate image is required"
    }

    if (stepToValidate === 2) {
      stories.forEach((story, index) => {
        if (story.title.trim() && !story.content.trim()) {
          newErrors[`story_${index}_content`] = "Story content is required"
        }
        if (story.content.trim() && !story.title.trim()) {
          newErrors[`story_${index}_title`] = "Story title is required"
        }
      })
    }

    if (stepToValidate === 3) {
      learningResources.forEach((resource, index) => {
        if (resource.title.trim() || resource.external_url.trim()) {
          if (!resource.title.trim()) newErrors[`resource_${index}_title`] = "Resource title is required"
          if (!resource.external_url.trim()) newErrors[`resource_${index}_url`] = "Resource URL is required"
          if (!resource.type) newErrors[`resource_${index}_type`] = "Resource type is required"
        }
      })
    }

    if (stepToValidate === 4) {
      if (!materialsNeeded.trim()) newErrors.materials = "Materials needed is required"
      if (!generalInstructions.trim()) newErrors.instructions = "General instructions are required"
    }

    if (stepToValidate === 5) {
      if (levels.length === 0) {
        newErrors.levels = "At least one level is required"
      } else {
        levels.forEach((level, index) => {
          if (!level.title.trim()) newErrors[`level_${index}_title`] = "Level title is required"
          if (!level.description.trim()) newErrors[`level_${index}_desc`] = "Level description is required"
        })
      }
    }

    return newErrors
  }

  const validateForm = (stepToValidate?: number) => {
    const validatingStep = stepToValidate || step
    const newErrors = getValidationErrors(validatingStep)
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleBadgeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBadgeImageUploading(true)
    try {
      const url = await uploadImage(file, "badge")
      setBadgeImageUrl(url)
      setBadgeImagePreview(url)
      toast.success("Badge image uploaded successfully")
      if (badgeInputRef.current) badgeInputRef.current.value = ""
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload badge image")
    } finally {
      setBadgeImageUploading(false)
    }
  }

  const handleCertificateImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCertificateImageUploading(true)
    try {
      const url = await uploadImage(file, "certificate")
      setCertificateImageUrl(url)
      setCertificateImagePreview(url)
      toast.success("Certificate image uploaded successfully")
      if (certificateInputRef.current) certificateInputRef.current.value = ""
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload certificate image")
    } finally {
      setCertificateImageUploading(false)
    }
  }

  const removeBadgeImage = () => {
    setBadgeImageUrl("")
    setBadgeImagePreview(null)
    if (badgeInputRef.current) badgeInputRef.current.value = ""
  }

  const removeCertificateImage = () => {
    setCertificateImageUrl("")
    setCertificateImagePreview(null)
    if (certificateInputRef.current) certificateInputRef.current.value = ""
  }

  const handleGenerateStory = async () => {
    if (!title.trim()) {
      toast.error("Please enter a quest title first")
      return
    }

    if (!description.trim()) {
      toast.error("Please enter a quest description first")
      return
    }

    setIsGeneratingStory(true)
    try {
      const generatedStories = await generateQuestStory({
        title,
        description,
        difficulty,
        storyContext: storyContext.trim() || undefined,
      })

      const newStories = generatedStories.map((story, index) => ({
        title: story.title,
        content: story.content,
        order_index: index,
      }))

      setStories(newStories)
      toast.success(`Generated ${newStories.length} story segments!`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate story")
    } finally {
      setIsGeneratingStory(false)
    }
  }

  const addStory = () => setStories([...stories, { title: "", content: "", order_index: stories.length }])
  const removeStory = (index: number) => setStories(stories.filter((_, i) => i !== index).map((s, i) => ({ ...s, order_index: i })))
  const updateStory = (index: number, field: keyof Story, value: string | number) => {
    const newStories = [...stories]
    newStories[index] = { ...newStories[index], [field]: value }
    setStories(newStories)
  }

  const addLearningResource = () => {
    setLearningResources([...learningResources, { 
      title: "", 
      description: "", 
      type: "video", 
      external_url: "", 
      order_index: learningResources.length 
    }])
  }

  const removeLearningResource = (index: number) => {
    setLearningResources(learningResources.filter((_, i) => i !== index).map((r, i) => ({ ...r, order_index: i })))
  }

  const updateLearningResource = (index: number, field: keyof LearningResource, value: string | number) => {
    const newResources = [...learningResources]
    newResources[index] = { ...newResources[index], [field]: value }
    setLearningResources(newResources)
  }

  const addLevel = () => setLevels([...levels, { title: "", description: "" }])
  const removeLevel = (index: number) => setLevels(levels.filter((_, i) => i !== index))
  const updateLevel = (index: number, field: "title" | "description", value: string) => {
    const newLevels = [...levels]
    newLevels[index][field] = value
    setLevels(newLevels)
  }

  const handleNextStep = () => {
    if (!validateForm(step)) {
      toast.error("Please fill in all required fields")
      return
    }
    setStep(step + 1)
  }

  const handleSubmit = async () => {
    const step1Errors = getValidationErrors(1)
    const step4Errors = getValidationErrors(4)
    const step5Errors = getValidationErrors(5)

    if (Object.keys(step1Errors).length > 0 || Object.keys(step4Errors).length > 0 || Object.keys(step5Errors).length > 0) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsLoading(true)
    try {
      const questData: any = {
        title,
        description,
        difficulty,
        scheduled_date: scheduledDate || null,
        badge_image_url: badgeImageUrl,
        certificate_image_url: certificateImageUrl,
        status,
        materials_needed: materialsNeeded,
        general_instructions: generalInstructions,
        levels,
        stories: stories.filter(s => s.title.trim() && s.content.trim()),
        learning_resources: learningResources.filter(r => r.title.trim() && r.external_url.trim())
      }

      if (editingQuest) {
        await updateQuest(editingQuest.id, questData)
        toast.success("Quest updated successfully")
      } else {
        await createQuest(questData)
        toast.success("Quest created successfully")
      }

      resetForm()
      onOpenChange(false)

      if (onQuestSaved) {
        onQuestSaved()
      } else {
        setTimeout(() => router.refresh(), 300)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save quest")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setTitle("")
    setDescription("")
    setDifficulty("Beginner - Intermediate")
    setScheduledDate("")
    setBadgeImageUrl("")
    setCertificateImageUrl("")
    setBadgeImagePreview(null)
    setCertificateImagePreview(null)
    setStatus("Draft")
    setStoryContext("")
    setStories([])
    setLearningResources([])
    setMaterialsNeeded("")
    setGeneralInstructions("")
    setLevels([])
    setErrors({})
  }

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen) resetForm()
    onOpenChange(newOpen)
  }

  const stepTitles = ["Basic Details", "Story (Optional)", "Learning Resources (Optional)", "Materials & Instructions", "Quest Levels", "Review & Publish"]

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-blue-50">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-gray-900">
            {editingQuest ? "Edit Quest" : "Create New Quest"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between px-4 my-8">
          {[1, 2, 3, 4, 5, 6].map((stepNum) => (
            <div key={stepNum} className="flex items-center flex-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors flex-shrink-0 ${
                step >= stepNum ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
              }`}>
                {stepNum}
              </div>
              {stepNum < 6 && (
                <div className={`flex-1 h-1 mx-3 ${
                  step > stepNum ? "bg-blue-600" : "bg-gray-300"
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">{stepTitles[step - 1]}</h3>
        </div>

        {/* Step 1: Basic Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label className="text-gray-900 font-medium">Quest Name *</Label>
              <Input placeholder="Enter quest name" value={title} onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors({ ...errors, title: "" }) }} className={`mt-2 h-10 text-gray-900 placeholder:text-gray-400 ${errors.title ? "border-red-500" : ""}`} />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>
            <div>
              <Label className="text-gray-900 font-medium">Description *</Label>
              <Textarea placeholder="Enter quest description" value={description} onChange={(e) => { setDescription(e.target.value); if (errors.description) setErrors({ ...errors, description: "" }) }} className={`text-gray-900 placeholder:text-gray-400 ${errors.description ? "border-red-500" : ""}`} />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-900 font-medium">Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="mt-2 h-10 text-gray-900"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Beginner - Intermediate">Beginner - Intermediate</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Intermediate - Advanced">Intermediate - Advanced</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-900 font-medium">Scheduled Date</Label>
                <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="mt-2 h-10 text-gray-900" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-900 font-medium">Badge Image *</Label>
                {badgeImagePreview ? (
                  <div className="mt-2 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-100 relative group">
                    <img src={badgeImagePreview} alt="Badge" className="h-full object-contain p-2" />
                    <button onClick={removeBadgeImage} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => badgeInputRef.current?.click()} disabled={badgeImageUploading} className={`mt-2 w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors ${badgeImageUploading ? "opacity-50" : ""}`}>
                    <div className="text-center"><Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" /><p className="text-sm text-gray-500">{badgeImageUploading ? "Uploading..." : "Upload Badge Image"}</p></div>
                  </button>
                )}
                <input ref={badgeInputRef} type="file" accept="image/*" onChange={handleBadgeImageUpload} className="hidden" />
                {errors.badgeImage && <p className="text-red-500 text-sm mt-1">{errors.badgeImage}</p>}
              </div>
              <div>
                <Label className="text-gray-900 font-medium">Certificate Image *</Label>
                {certificateImagePreview ? (
                  <div className="mt-2 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-100 relative group">
                    <img src={certificateImagePreview} alt="Certificate" className="h-full object-contain p-2" />
                    <button onClick={removeCertificateImage} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => certificateInputRef.current?.click()} disabled={certificateImageUploading} className={`mt-2 w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors ${certificateImageUploading ? "opacity-50" : ""}`}>
                    <div className="text-center"><Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" /><p className="text-sm text-gray-500">{certificateImageUploading ? "Uploading..." : "Upload Certificate Image"}</p></div>
                  </button>
                )}
                <input ref={certificateInputRef} type="file" accept="image/*" onChange={handleCertificateImageUpload} className="hidden" />
                {errors.certificateImage && <p className="text-red-500 text-sm mt-1">{errors.certificateImage}</p>}
              </div>
            </div>
            <div>
              <Label className="text-gray-900 font-medium">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-2 h-10 text-gray-900"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 2: Story */}
        {step === 2 && (
          <div className="space-y-4">
            {/* AI Story Context Input */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4">
              <Label className="text-gray-900 font-semibold flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI Story Settings (Optional)
              </Label>
              <Textarea
                placeholder="Describe the setting, tone, or vibe for your story... 
e.g., 'A futuristic space adventure', 'Medieval fantasy kingdom', 'Modern city mystery', 'Tropical island survival'"
                value={storyContext}
                onChange={(e) => setStoryContext(e.target.value)}
                rows={3}
                className="text-gray-900 placeholder:text-gray-400 bg-white"
              />
              <p className="text-xs text-gray-600 mt-2">
                This helps the AI create a story that matches your desired theme and atmosphere
              </p>
            </div>

            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">Add story segments to engage participants at the start of the quest</p>
              <div className="flex gap-2">
                <Button
                  onClick={handleGenerateStory}
                  disabled={isGeneratingStory || !title.trim() || !description.trim()}
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 border-0"
                >
                  <Sparkles className="w-4 h-4" />
                  {isGeneratingStory ? "Generating..." : "Generate with AI"}
                </Button>
                <Button onClick={addStory} variant="outline" size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Story
                </Button>
              </div>
            </div>

            {(!title.trim() || !description.trim()) && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                <p className="font-medium mb-1">💡 Tip: Complete Step 1 first</p>
                <p>Fill in the quest title and description in Step 1, then come back here to generate AI stories.</p>
              </div>
            )}

            {stories.map((story, index) => (
              <div key={index} className={`bg-white rounded-lg p-6 border-2 space-y-4 ${errors[`story_${index}_title`] || errors[`story_${index}_content`] ? "border-red-300" : "border-gray-200"}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">Story Segment {index + 1}</h3>
                  <button onClick={() => removeStory(index)} className="text-red-500 hover:text-red-700"><Trash2 className="w-5 h-5" /></button>
                </div>
                <div>
                  <Label className="text-gray-900 font-medium">Story Title</Label>
                  <Input placeholder="e.g., The Beginning of Your Journey" value={story.title} onChange={(e) => { updateStory(index, "title", e.target.value); if (errors[`story_${index}_title`]) setErrors({ ...errors, [`story_${index}_title`]: "" }) }} className={`mt-2 h-10 text-gray-900 placeholder:text-gray-400 ${errors[`story_${index}_title`] ? "border-red-500" : ""}`} />
                  {errors[`story_${index}_title`] && <p className="text-red-500 text-sm mt-1">{errors[`story_${index}_title`]}</p>}
                </div>
                <div>
                  <Label className="text-gray-900 font-medium">Story Content</Label>
                  <Textarea placeholder="Write the story content here..." value={story.content} onChange={(e) => { updateStory(index, "content", e.target.value); if (errors[`story_${index}_content`]) setErrors({ ...errors, [`story_${index}_content`]: "" }) }} rows={6} className={`text-gray-900 placeholder:text-gray-400 ${errors[`story_${index}_content`] ? "border-red-500" : ""}`} />
                  {errors[`story_${index}_content`] && <p className="text-red-500 text-sm mt-1">{errors[`story_${index}_content`]}</p>}
                </div>
              </div>
            ))}

            {stories.length === 0 && (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                <p className="font-medium mb-1">No stories added yet</p>
                <p className="text-sm">Use AI to generate engaging stories or add them manually</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Learning Resources */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Add learning resources to help participants</p>
              <Button onClick={addLearningResource} variant="outline" size="sm" className="gap-2"><Plus className="w-4 h-4" />Add Resource</Button>
            </div>
            {learningResources.map((resource, index) => (
              <div key={index} className={`bg-white rounded-lg p-6 border-2 space-y-4 ${errors[`resource_${index}_title`] || errors[`resource_${index}_url`] || errors[`resource_${index}_type`] ? "border-red-300" : "border-gray-200"}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">Resource {index + 1}</h3>
                  <button onClick={() => removeLearningResource(index)} className="text-red-500 hover:text-red-700"><Trash2 className="w-5 h-5" /></button>
                </div>
                <div>
                  <Label className="text-gray-900 font-medium">Resource Title</Label>
                  <Input placeholder="e.g., Introduction to Arduino" value={resource.title} onChange={(e) => { updateLearningResource(index, "title", e.target.value); if (errors[`resource_${index}_title`]) setErrors({ ...errors, [`resource_${index}_title`]: "" }) }} className={`mt-2 h-10 text-gray-900 placeholder:text-gray-400 ${errors[`resource_${index}_title`] ? "border-red-500" : ""}`} />
                  {errors[`resource_${index}_title`] && <p className="text-red-500 text-sm mt-1">{errors[`resource_${index}_title`]}</p>}
                </div>
                <div>
                  <Label className="text-gray-900 font-medium">Description (Optional)</Label>
                  <Textarea placeholder="Brief description of this resource" value={resource.description} onChange={(e) => updateLearningResource(index, "description", e.target.value)} className="text-gray-900 placeholder:text-gray-400" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-900 font-medium">Resource Type</Label>
                    <Select value={resource.type} onValueChange={(value) => { updateLearningResource(index, "type", value); if (errors[`resource_${index}_type`]) setErrors({ ...errors, [`resource_${index}_type`]: "" }) }}>
                      <SelectTrigger className={`mt-2 h-10 text-gray-900 ${errors[`resource_${index}_type`] ? "border-red-500" : ""}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="article">Article</SelectItem>
                        <SelectItem value="tutorial">Tutorial</SelectItem>
                        <SelectItem value="documentation">Documentation</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors[`resource_${index}_type`] && <p className="text-red-500 text-sm mt-1">{errors[`resource_${index}_type`]}</p>}
                  </div>
                  <div>
                    <Label className="text-gray-900 font-medium">Resource URL</Label>
                    <Input placeholder="https://..." value={resource.external_url} onChange={(e) => { updateLearningResource(index, "external_url", e.target.value); if (errors[`resource_${index}_url`]) setErrors({ ...errors, [`resource_${index}_url`]: "" }) }} className={`mt-2 h-10 text-gray-900 placeholder:text-gray-400 ${errors[`resource_${index}_url`] ? "border-red-500" : ""}`} />
                    {errors[`resource_${index}_url`] && <p className="text-red-500 text-sm mt-1">{errors[`resource_${index}_url`]}</p>}
                  </div>
                </div>
              </div>
            ))}
            {learningResources.length === 0 && (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                <p>No learning resources added yet. Resources are optional but helpful for participants.</p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Materials & Instructions */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <Label className="text-gray-900 font-medium">Materials Needed *</Label>
              <Textarea placeholder="List all materials needed for this quest" value={materialsNeeded} onChange={(e) => { setMaterialsNeeded(e.target.value); if (errors.materials) setErrors({ ...errors, materials: "" }) }} rows={5} className={`text-gray-900 placeholder:text-gray-400 ${errors.materials ? "border-red-500 mt-2" : "mt-2"}`} />
              {errors.materials && <p className="text-red-500 text-sm mt-1">{errors.materials}</p>}
            </div>
            <div>
              <Label className="text-gray-900 font-medium">General Instructions *</Label>
              <Textarea placeholder="Provide general instructions or guidelines" value={generalInstructions} onChange={(e) => { setGeneralInstructions(e.target.value); if (errors.instructions) setErrors({ ...errors, instructions: "" }) }} rows={5} className={`text-gray-900 placeholder:text-gray-400 ${errors.instructions ? "border-red-500 mt-2" : "mt-2"}`} />
              {errors.instructions && <p className="text-red-500 text-sm mt-1">{errors.instructions}</p>}
            </div>
          </div>
        )}

        {/* Step 5: Quest Levels */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Define the levels/tasks participants must complete</p>
              <Button onClick={addLevel} variant="outline" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />Add Level
              </Button>
            </div>

            {errors.levels && <p className="text-red-500 text-sm">{errors.levels}</p>}

            {levels.map((level, index) => (
              <div key={index} className={`bg-white rounded-lg p-6 border-2 space-y-4 ${errors[`level_${index}_title`] || errors[`level_${index}_desc`] ? "border-red-300" : "border-gray-200"}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">Level {index + 1}</h3>
                  <button onClick={() => removeLevel(index)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div>
                  <Label className="text-gray-900 font-medium">Task Title *</Label>
                  <Input placeholder="e.g., Connect the LED circuit" value={level.title} onChange={(e) => { updateLevel(index, "title", e.target.value); if (errors[`level_${index}_title`]) setErrors({ ...errors, [`level_${index}_title`]: "" }) }} className={`mt-2 h-10 text-gray-900 placeholder:text-gray-400 ${errors[`level_${index}_title`] ? "border-red-500" : ""}`} />
                  {errors[`level_${index}_title`] && <p className="text-red-500 text-sm mt-1">{errors[`level_${index}_title`]}</p>}
                </div>
                <div>
                  <Label className="text-gray-900 font-medium">Task Description *</Label>
                  <Textarea placeholder="Describe what the participant needs to do in this level" value={level.description} onChange={(e) => { updateLevel(index, "description", e.target.value); if (errors[`level_${index}_desc`]) setErrors({ ...errors, [`level_${index}_desc`]: "" }) }} rows={4} className={`text-gray-900 placeholder:text-gray-400 ${errors[`level_${index}_desc`] ? "border-red-500" : ""}`} />
                  {errors[`level_${index}_desc`] && <p className="text-red-500 text-sm mt-1">{errors[`level_${index}_desc`]}</p>}
                </div>
              </div>
            ))}

            {levels.length === 0 && (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                <p>No levels added yet. Click "Add Level" to create one.</p>
              </div>
            )}
          </div>
        )}

        {/* Step 6: Review & Publish */}
        {step === 6 && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 space-y-2 text-sm text-gray-900">
              <div><span className="font-medium text-gray-900">Quest Name:</span> {title}</div>
              <div><span className="font-medium text-gray-900">Difficulty:</span> {difficulty}</div>
              <div><span className="font-medium text-gray-900">Status:</span> {status}</div>
              <div><span className="font-medium text-gray-900">Stories:</span> {stories.filter(s => s.title && s.content).length} segment{stories.filter(s => s.title && s.content).length !== 1 ? "s" : ""}</div>
              <div><span className="font-medium text-gray-900">Learning Resources:</span> {learningResources.filter(r => r.title && r.external_url).length} resource{learningResources.filter(r => r.title && r.external_url).length !== 1 ? "s" : ""}</div>
              <div><span className="font-medium text-gray-900">Levels:</span> {levels.length} level{levels.length !== 1 ? "s" : ""}</div>
            </div>
            <p className="text-gray-900 text-sm">Review the quest details above. Click "Create Quest" to save, or "Back" to make changes.</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-6 border-t border-gray-200">
          <div className="flex gap-3">
            {step > 1 && <Button onClick={() => setStep(step - 1)} variant="outline">Back</Button>}
          </div>

          <div className="flex gap-3">
            <Button onClick={() => onOpenChange(false)} variant="cancel">Cancel</Button>
            {step < 6 ? (
              <Button onClick={handleNextStep} className="bg-blue-600 hover:bg-blue-700">Next</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                {isLoading ? "Saving..." : editingQuest ? "Update Quest" : "Create Quest"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}