"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Archive, Plus, Upload, X, Sparkles, Link2, Check } from "lucide-react"
import { createQuest, updateQuest, uploadImage, getSkills, createNewSkill } from "@/lib/actions/quests"
import { generateQuestStory } from "@/lib/actions/ai-story"
import { toast } from "sonner"
import type { Skill } from "@/lib/types"

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

const GENRES = [
  { value: "Adventure", label: "🗺️ Adventure", description: "Exciting journeys with challenges and discovery", example: "e.g. A quest through ancient ruins to find lost knowledge" },
  { value: "Sci-Fi", label: "🚀 Science Fiction", description: "Futuristic tech and scientific concepts", example: "e.g. Exploring a space station to learn about physics" },
  { value: "Fantasy", label: "🧙 Fantasy", description: "Magical worlds and enchanted quests", example: "e.g. Using magical formulas (math) to save a kingdom" },
  { value: "Real-World", label: "🌍 Real-World", description: "Contemporary, relatable scenarios", example: "e.g. Starting a school project or community initiative" },
  { value: "Custom", label: "✨ Custom", description: "Define your own genre", example: "e.g. Horror, Western, Superhero, etc." },
]

const SETTING_SUGGESTIONS = [
  "A futuristic space academy",
  "An ancient library filled with secrets",
  "A modern-day science lab",
  "A magical forest kingdom",
  "An underwater research station",
]

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
  const [difficulty, setDifficulty] = useState(editingQuest?.difficulty || "Beginner")
  const [scheduledDate, setScheduledDate] = useState(editingQuest?.scheduled_date || "")
  const [badgeImageUrl, setBadgeImageUrl] = useState(editingQuest?.badge_image_url || "")
  const [certificateImageUrl, setCertificateImageUrl] = useState(editingQuest?.certificate_image_url || "")
  const [badgeImagePreview, setBadgeImagePreview] = useState<string | null>(editingQuest?.badge_image_url || null)
  const [certificateImagePreview, setCertificateImagePreview] = useState<string | null>(editingQuest?.certificate_image_url || null)
  const [badgeImageUploading, setBadgeImageUploading] = useState(false)
  const [certificateImageUploading, setCertificateImageUploading] = useState(false)
  const [status, setStatus] = useState(editingQuest?.status || "Draft")
  const [surveyLink, setSurveyLink] = useState(editingQuest?.survey_link || "")
  
  // SKILL STATE
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([])
  const [selectedSkillId, setSelectedSkillId] = useState(editingQuest?.skill_id || "")
  const [isCreatingSkill, setIsCreatingSkill] = useState(false)
  const [newSkillName, setNewSkillName] = useState("")
  const [newSkillIcon, setNewSkillIcon] = useState("🎯")

  // Step 2: Story
  const [storyGenre, setStoryGenre] = useState("Adventure")
  const [customGenre, setCustomGenre] = useState("")
  const [storyTopic, setStoryTopic] = useState("")
  const [storySetting, setStorySetting] = useState("")
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

  // Load skills on open
  useEffect(() => {
    if (open) {
      loadSkills()
    }
  }, [open])

  const loadSkills = async () => {
    try {
      const skills = await getSkills()
      setAvailableSkills(skills)
    } catch (error) {
      console.error("Failed to load skills", error)
    }
  }

  // Persist state when editing quest changes
  useEffect(() => {
    if (editingQuest && open) {
      setTitle(editingQuest.title || "")
      setDescription(editingQuest.description || "")
      setDifficulty(editingQuest.difficulty || "Beginner")
      setScheduledDate(editingQuest.scheduled_date || "")
      setBadgeImageUrl(editingQuest.badge_image_url || "")
      setCertificateImageUrl(editingQuest.certificate_image_url || "")
      setBadgeImagePreview(editingQuest.badge_image_url || null)
      setCertificateImagePreview(editingQuest.certificate_image_url || null)
      setStatus(editingQuest.status || "Draft")
      setSurveyLink(editingQuest.survey_link || "")
      setSelectedSkillId(editingQuest.skill_id || "") // Load skill
      setStories(editingQuest.stories?.map((s: any, i: number) => ({ title: s.title, content: s.content, order_index: i })) || [])
      setLearningResources(editingQuest.learning_resources?.map((r: any, i: number) => ({ 
        title: r.title, 
        description: r.description || "", 
        type: r.type, 
        external_url: r.external_url, 
        order_index: i 
      })) || [])
      setMaterialsNeeded(editingQuest.materials_needed || "")
      setGeneralInstructions(editingQuest.general_instructions || "")
      setLevels(editingQuest.levels || [])
    }
  }, [editingQuest, open])

  const handleCreateSkill = async () => {
    if (!newSkillName.trim()) return
    
    try {
      const newSkill = await createNewSkill(newSkillName.trim(), newSkillIcon)
      setAvailableSkills([...availableSkills, newSkill])
      setSelectedSkillId(newSkill.id)
      setIsCreatingSkill(false)
      setNewSkillName("")
      setNewSkillIcon("🎯")
      toast.success("Skill created!")
    } catch (error) {
      toast.error("Failed to create skill")
    }
  }

  const getValidationErrors = (stepToValidate: number) => {
    const newErrors: Record<string, string> = {}

    if (stepToValidate === 1) {
      if (!title.trim()) newErrors.title = "Quest name is required"
      if (!description.trim()) newErrors.description = "Description is required"
      if (!badgeImageUrl) newErrors.badgeImage = "Badge image is required"
      if (!certificateImageUrl) newErrors.certificateImage = "Certificate image is required"
      
      // Validate survey link if provided
      if (surveyLink.trim() && !isValidUrl(surveyLink.trim())) {
        newErrors.surveyLink = "Please enter a valid URL (must start with http:// or https://)"
      }
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

  const isValidUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
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
      toast.error("Please enter a quest title first (Step 1)")
      return
    }
    if (!description.trim()) {
      toast.error("Please enter a quest description first (Step 1)")
      return
    }
    if (!storyTopic.trim()) {
      toast.error("Please enter a learning topic")
      return
    }
    if (storyGenre === "Custom" && !customGenre.trim()) {
      toast.error("Please enter your custom genre")
      return
    }

    setIsGeneratingStory(true)
    try {
      const genreToUse = storyGenre === "Custom" ? customGenre.trim() : storyGenre

      const generatedStories = await generateQuestStory({
        title,
        description,
        difficulty,
        genre: genreToUse,
        topic: storyTopic.trim(),
        setting: storySetting.trim(),
        temperature: 0.7,
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
        skill_id: selectedSkillId || null, // SAVE SKILL ID
        scheduled_date: scheduledDate || null,
        badge_image_url: badgeImageUrl,
        certificate_image_url: certificateImageUrl,
        status,
        survey_link: surveyLink.trim() || null,
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
    setDifficulty("Beginner")
    setScheduledDate("")
    setBadgeImageUrl("")
    setCertificateImageUrl("")
    setBadgeImagePreview(null)
    setCertificateImagePreview(null)
    setStatus("Draft")
    setSurveyLink("")
    setStoryGenre("Adventure")
    setCustomGenre("")
    setStoryTopic("")
    setStorySetting("")
    setSelectedSkillId("")
    setIsCreatingSkill(false)
    setNewSkillName("")
    setNewSkillIcon("🎯")
    setStories([])
    setLearningResources([])
    setMaterialsNeeded("")
    setGeneralInstructions("")
    setLevels([])
    setErrors({})
  }

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen && !editingQuest) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  const stepTitles = ["Basic Details", "Story (Optional)", "Learning Resources (Optional)", "Materials & Instructions", "Quest Levels", "Review & Publish"]

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-[calc(100%-1rem)] sm:max-w-[calc(100%-2rem)] md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto bg-blue-50 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            {editingQuest ? "Edit Quest" : "Create New Quest"}
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between px-0 sm:px-4 my-4 sm:my-6 md:my-8 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5, 6].map((stepNum) => (
            <div key={stepNum} className="flex items-center flex-1 min-w-0">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-sm sm:text-base md:text-lg transition-colors flex-shrink-0 ${
                step >= stepNum ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
              }`}>
                {stepNum}
              </div>
              {stepNum < 6 && (
                <div className={`flex-1 h-0.5 sm:h-1 mx-1 sm:mx-2 md:mx-3 ${
                  step > stepNum ? "bg-blue-600" : "bg-gray-300"
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="text-center mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">{stepTitles[step - 1]}</h3>
        </div>

        {/* Step 1: Basic Details */}
        {step === 1 && (
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label className="text-gray-900 font-medium text-sm sm:text-base">Quest Name *</Label>
              <Input placeholder="Enter quest name" value={title} onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors({ ...errors, title: "" }) }} className={`mt-1 sm:mt-2 h-9 sm:h-10 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 ${errors.title ? "border-red-500" : ""}`} />
              {errors.title && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.title}</p>}
            </div>
            <div>
              <Label className="text-gray-900 font-medium text-sm sm:text-base">Description *</Label>
              <Textarea placeholder="Enter quest description" value={description} onChange={(e) => { setDescription(e.target.value); if (errors.description) setErrors({ ...errors, description: "" }) }} className={`mt-1 sm:mt-2 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 ${errors.description ? "border-red-500" : ""}`} rows={3} />
              {errors.description && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.description}</p>}
            </div>

            {/* SKILL SELECTION AREA - UPDATED */}
            <div>
              <Label className="text-gray-900 font-medium text-sm sm:text-base">Skill Category</Label>
              <div className="mt-1 sm:mt-2 flex gap-2">
                {!isCreatingSkill ? (
                  <>
                    <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
                      <SelectTrigger className="flex-1 h-9 sm:h-10 text-sm sm:text-base text-gray-900">
                        <SelectValue placeholder="Select a skill..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSkills.map((skill) => (
                           <SelectItem key={skill.id} value={skill.id}>
                             <span className="mr-2">{skill.icon}</span> {skill.name}
                           </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreatingSkill(true)}
                      className="h-9 sm:h-10 px-3"
                    >
                      <Plus className="w-4 h-4 mr-1" /> New
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex gap-2 w-full">
                      <Input
                        placeholder="Icon/Emoji"
                        value={newSkillIcon}
                        onChange={(e) => setNewSkillIcon(e.target.value)}
                        className="w-20 h-9 sm:h-10 text-sm sm:text-base text-center"
                        maxLength={2}
                      />
                      <Input 
                        placeholder="Enter new skill name..." 
                        value={newSkillName}
                        onChange={(e) => setNewSkillName(e.target.value)}
                        className="flex-1 h-9 sm:h-10 text-sm sm:text-base text-gray-900"
                      />
                      <Button 
                        type="button" 
                        onClick={handleCreateSkill}
                        className="h-9 sm:h-10 bg-green-600 hover:bg-green-700 px-3"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => setIsCreatingSkill(false)}
                        className="h-9 sm:h-10 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label className="text-gray-900 font-medium text-sm sm:text-base">Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="mt-1 sm:mt-2 h-9 sm:h-10 text-sm sm:text-base text-gray-900 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-900 font-medium text-sm sm:text-base">Scheduled Date</Label>
                <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="mt-1 sm:mt-2 h-9 sm:h-10 text-sm sm:text-base text-gray-900" />
              </div>
            </div>
            
            {/* Survey/Feedback Link Field */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="w-4 h-4 text-gray-600" />
                <Label className="text-gray-900 font-medium">Survey / Feedback Form Link (Optional)</Label>
              </div>
              <Input 
                placeholder="https://forms.google.com/..." 
                value={surveyLink} 
                onChange={(e) => { 
                  setSurveyLink(e.target.value); 
                  if (errors.surveyLink) setErrors({ ...errors, surveyLink: "" }) 
                }} 
                className={`h-10 text-gray-900 placeholder:text-gray-400 ${errors.surveyLink ? "border-red-500" : ""}`} 
              />
              {errors.surveyLink && <p className="text-red-500 text-sm mt-1">{errors.surveyLink}</p>}
              <p className="text-xs text-gray-500 mt-1">Participants will be able to access this survey after completing the quest</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-900 font-medium text-sm sm:text-base">Badge Image *</Label>
                {badgeImagePreview ? (
                  <div className="mt-1 sm:mt-2 h-24 sm:h-28 md:h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-100 relative group">
                    <img src={badgeImagePreview} alt="Badge" className="h-full object-contain p-2" />
                    <button onClick={removeBadgeImage} className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3 sm:w-4 sm:h-4" /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => badgeInputRef.current?.click()} disabled={badgeImageUploading} className={`mt-1 sm:mt-2 w-full h-24 sm:h-28 md:h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors ${badgeImageUploading ? "opacity-50" : ""}`}>
                    <div className="text-center"><Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-1 sm:mb-2" /><p className="text-xs sm:text-sm text-gray-500">{badgeImageUploading ? "Uploading..." : "Upload Badge"}</p></div>
                  </button>
                )}
                <input ref={badgeInputRef} type="file" accept="image/*" onChange={handleBadgeImageUpload} className="hidden" />
                {errors.badgeImage && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.badgeImage}</p>}
              </div>
              <div>
                <Label className="text-gray-900 font-medium text-sm sm:text-base">Certificate Image *</Label>
                {certificateImagePreview ? (
                  <div className="mt-1 sm:mt-2 h-24 sm:h-28 md:h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-100 relative group">
                    <img src={certificateImagePreview} alt="Certificate" className="h-full object-contain p-2" />
                    <button onClick={removeCertificateImage} className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3 sm:w-4 sm:h-4" /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => certificateInputRef.current?.click()} disabled={certificateImageUploading} className={`mt-1 sm:mt-2 w-full h-24 sm:h-28 md:h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors ${certificateImageUploading ? "opacity-50" : ""}`}>
                    <div className="text-center"><Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-1 sm:mb-2" /><p className="text-xs sm:text-sm text-gray-500">{certificateImageUploading ? "Uploading..." : "Upload Certificate"}</p></div>
                  </button>
                )}
                <input ref={certificateInputRef} type="file" accept="image/*" onChange={handleCertificateImageUpload} className="hidden" />
                {errors.certificateImage && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.certificateImage}</p>}
              </div>
            </div>
            <div>
              <Label className="text-gray-900 font-medium text-sm sm:text-base">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-1 sm:mt-2 h-9 sm:h-10 text-sm sm:text-base text-gray-900 w-full"><SelectValue /></SelectTrigger>
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
            {(!title.trim() || !description.trim()) && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-amber-800">
                <p className="font-medium mb-1">💡 Tip: Complete Step 1 first</p>
                <p>Fill in the quest title and description in Step 1.</p>
              </div>
            )}
            
            {/* AI Story Generator */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-5 space-y-5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-gray-900">Generate Story with AI</h4>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-900 font-medium">Pick a Genre *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {GENRES.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setStoryGenre(g.value)}
                      className={`text-left p-2.5 rounded-lg border-2 transition-colors ${
                        storyGenre === g.value
                          ? "border-purple-500 bg-purple-100"
                          : "border-gray-200 bg-white hover:border-purple-300"
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900">{g.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{g.description}</p>
                    </button>
                  ))}
                </div>

                {storyGenre === "Custom" && (
                  <div className="mt-3">
                    <Input
                      placeholder="Enter your custom genre (e.g., Horror, Western, Superhero)"
                      value={customGenre}
                      onChange={(e) => setCustomGenre(e.target.value)}
                      className="bg-white text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                )}

                {storyGenre !== "Custom" && (
                  <p className="text-xs text-purple-700 italic">
                    {GENRES.find(g => g.value === storyGenre)?.example}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label className="text-gray-900 font-medium">Topic *</Label>
                  <span className="text-xs text-gray-500">(the learning resource or lesson for context)</span>
                </div>
                <Input
                  placeholder="e.g. Photosynthesis, Ancient Rome, Python Programming, Fractions"
                  value={storyTopic}
                  onChange={(e) => setStoryTopic(e.target.value)}
                  className="bg-white text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-gray-900 font-medium">Setting <span className="text-gray-400 font-normal">(optional)</span></Label>
                <Input
                  placeholder="e.g. A futuristic space academy, a medieval kingdom..."
                  value={storySetting}
                  onChange={(e) => setStorySetting(e.target.value)}
                  className="bg-white text-gray-900 placeholder:text-gray-400"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {SETTING_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStorySetting(s)}
                      className="text-xs bg-white border border-gray-200 hover:border-purple-300 text-gray-600 px-2.5 py-1 rounded-full transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGenerateStory}
                disabled={isGeneratingStory || !title.trim() || !description.trim() || !storyTopic.trim() || (storyGenre === "Custom" && !customGenre.trim())}
                className="w-full gap-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600"
              >
                <Sparkles className="w-4 h-4" />
                {isGeneratingStory ? "Generating…" : "Generate Story"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Or add story segments manually</p>
              <Button onClick={addStory} variant="outline" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />Add Story
              </Button>
            </div>

            {stories.map((story, index) => (
              <div key={index} className={`bg-white rounded-lg p-3 sm:p-4 md:p-6 border-2 space-y-3 sm:space-y-4 ${errors[`story_${index}_title`] || errors[`story_${index}_content`] ? "border-red-300" : "border-gray-200"}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">Story Segment {index + 1}</h3>
                  <button onClick={() => removeStory(index)} className="text-red-500 hover:text-red-700"><Archive className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                </div>
                <div>
                  <Label className="text-gray-900 font-medium text-sm sm:text-base">Story Title</Label>
                  <Input placeholder="e.g., The Beginning of Your Journey" value={story.title} onChange={(e) => { updateStory(index, "title", e.target.value); if (errors[`story_${index}_title`]) setErrors({ ...errors, [`story_${index}_title`]: "" }) }} className={`mt-1 sm:mt-2 h-9 sm:h-10 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 ${errors[`story_${index}_title`] ? "border-red-500" : ""}`} />
                  {errors[`story_${index}_title`] && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors[`story_${index}_title`]}</p>}
                </div>
                <div>
                  <Label className="text-gray-900 font-medium text-sm sm:text-base">Story Content</Label>
                  <Textarea placeholder="Write the story content here..." value={story.content} onChange={(e) => { updateStory(index, "content", e.target.value); if (errors[`story_${index}_content`]) setErrors({ ...errors, [`story_${index}_content`]: "" }) }} rows={4} className={`text-sm sm:text-base text-gray-900 placeholder:text-gray-400 ${errors[`story_${index}_content`] ? "border-red-500" : ""}`} />
                  {errors[`story_${index}_content`] && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors[`story_${index}_content`]}</p>}
                </div>
              </div>
            ))}

            {stories.length === 0 && (
              <div className="text-center py-6 sm:py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-purple-400" />
                <p className="font-medium mb-1 text-sm sm:text-base">No stories added yet</p>
                <p className="text-xs sm:text-sm">Use AI to generate stories or add them manually</p>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
              <p className="text-xs sm:text-sm text-gray-600">Add learning resources to help participants</p>
              <Button onClick={addLearningResource} variant="outline" size="sm" className="gap-2 text-xs sm:text-sm h-8 sm:h-9">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />Add Resource
              </Button>
            </div>
            {learningResources.map((resource, index) => (
              <div key={index} className={`bg-white rounded-lg p-3 sm:p-4 md:p-6 border-2 space-y-3 sm:space-y-4 ${errors[`resource_${index}_title`] || errors[`resource_${index}_url`] || errors[`resource_${index}_type`] ? "border-red-300" : "border-gray-200"}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">Resource {index + 1}</h3>
                  <button onClick={() => removeLearningResource(index)} className="text-red-500 hover:text-red-700"><Archive className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                </div>
                <div>
                  <Label className="text-gray-900 font-medium text-sm sm:text-base">Resource Title</Label>
                  <Input placeholder="e.g., Introduction to Arduino" value={resource.title} onChange={(e) => { updateLearningResource(index, "title", e.target.value); if (errors[`resource_${index}_title`]) setErrors({ ...errors, [`resource_${index}_title`]: "" }) }} className={`mt-1 sm:mt-2 h-9 sm:h-10 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 ${errors[`resource_${index}_title`] ? "border-red-500" : ""}`} />
                  {errors[`resource_${index}_title`] && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors[`resource_${index}_title`]}</p>}
                </div>
                <div>
                  <Label className="text-gray-900 font-medium text-sm sm:text-base">Description (Optional)</Label>
                  <Textarea placeholder="Brief description of this resource" value={resource.description} onChange={(e) => updateLearningResource(index, "description", e.target.value)} className="text-sm sm:text-base text-gray-900 placeholder:text-gray-400" rows={2} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label className="text-gray-900 font-medium text-sm sm:text-base">Resource Type</Label>
                    <Select value={resource.type} onValueChange={(value) => { updateLearningResource(index, "type", value); if (errors[`resource_${index}_type`]) setErrors({ ...errors, [`resource_${index}_type`]: "" }) }}>
                      <SelectTrigger className={`mt-1 sm:mt-2 h-9 sm:h-10 text-sm sm:text-base text-gray-900 w-full ${errors[`resource_${index}_type`] ? "border-red-500" : ""}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="article">Article</SelectItem>
                        <SelectItem value="tutorial">Tutorial</SelectItem>
                        <SelectItem value="documentation">Documentation</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors[`resource_${index}_type`] && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors[`resource_${index}_type`]}</p>}
                  </div>
                  <div>
                    <Label className="text-gray-900 font-medium text-sm sm:text-base">Resource URL</Label>
                    <Input placeholder="https://..." value={resource.external_url} onChange={(e) => { updateLearningResource(index, "external_url", e.target.value); if (errors[`resource_${index}_url`]) setErrors({ ...errors, [`resource_${index}_url`]: "" }) }} className={`mt-1 sm:mt-2 h-9 sm:h-10 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 ${errors[`resource_${index}_url`] ? "border-red-500" : ""}`} />
                    {errors[`resource_${index}_url`] && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors[`resource_${index}_url`]}</p>}
                  </div>
                </div>
              </div>
            ))}
            {learningResources.length === 0 && (
              <div className="text-center py-6 sm:py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-xs sm:text-sm">No learning resources added yet. Resources are optional but helpful.</p>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label className="text-gray-900 font-medium text-sm sm:text-base">Materials Needed *</Label>
              <Textarea placeholder="List all materials needed for this quest" value={materialsNeeded} onChange={(e) => { setMaterialsNeeded(e.target.value); if (errors.materials) setErrors({ ...errors, materials: "" }) }} rows={4} className={`text-sm sm:text-base text-gray-900 placeholder:text-gray-400 ${errors.materials ? "border-red-500 mt-1 sm:mt-2" : "mt-1 sm:mt-2"}`} />
              {errors.materials && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.materials}</p>}
            </div>
            <div>
              <Label className="text-gray-900 font-medium text-sm sm:text-base">General Instructions *</Label>
              <Textarea placeholder="Provide general instructions or guidelines" value={generalInstructions} onChange={(e) => { setGeneralInstructions(e.target.value); if (errors.instructions) setErrors({ ...errors, instructions: "" }) }} rows={4} className={`text-sm sm:text-base text-gray-900 placeholder:text-gray-400 ${errors.instructions ? "border-red-500 mt-1 sm:mt-2" : "mt-1 sm:mt-2"}`} />
              {errors.instructions && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.instructions}</p>}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
              <p className="text-xs sm:text-sm text-gray-600">Define the levels/tasks participants must complete</p>
              <Button onClick={addLevel} variant="outline" size="sm" className="gap-2 text-xs sm:text-sm h-8 sm:h-9">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />Add Level
              </Button>
            </div>

            {errors.levels && <p className="text-red-500 text-xs sm:text-sm">{errors.levels}</p>}

            {levels.map((level, index) => (
              <div key={index} className={`bg-white rounded-lg p-3 sm:p-4 md:p-6 border-2 space-y-3 sm:space-y-4 ${errors[`level_${index}_title`] || errors[`level_${index}_desc`] ? "border-red-300" : "border-gray-200"}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">Level {index + 1}</h3>
                  <button onClick={() => removeLevel(index)} className="text-red-500 hover:text-red-700">
                    <Archive className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
                <div>
                  <Label className="text-gray-900 font-medium text-sm sm:text-base">Task Title *</Label>
                  <Input placeholder="e.g., Connect the LED circuit" value={level.title} onChange={(e) => { updateLevel(index, "title", e.target.value); if (errors[`level_${index}_title`]) setErrors({ ...errors, [`level_${index}_title`]: "" }) }} className={`mt-1 sm:mt-2 h-9 sm:h-10 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 ${errors[`level_${index}_title`] ? "border-red-500" : ""}`} />
                  {errors[`level_${index}_title`] && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors[`level_${index}_title`]}</p>}
                </div>
                <div>
                  <Label className="text-gray-900 font-medium text-sm sm:text-base">Task Description *</Label>
                  <Textarea placeholder="Describe what the participant needs to do in this level" value={level.description} onChange={(e) => { updateLevel(index, "description", e.target.value); if (errors[`level_${index}_desc`]) setErrors({ ...errors, [`level_${index}_desc`]: "" }) }} rows={3} className={`text-sm sm:text-base text-gray-900 placeholder:text-gray-400 ${errors[`level_${index}_desc`] ? "border-red-500" : ""}`} />
                  {errors[`level_${index}_desc`] && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors[`level_${index}_desc`]}</p>}
                </div>
              </div>
            ))}

            {levels.length === 0 && (
              <div className="text-center py-6 sm:py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-xs sm:text-sm">No levels added yet. Click "Add Level" to create one.</p>
              </div>
            )}
          </div>
        )}

        {step === 6 && (
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-white rounded-lg p-3 sm:p-4 space-y-2 text-xs sm:text-sm text-gray-900">
              <div><span className="font-medium text-gray-900">Quest Name:</span> {title}</div>
              <div><span className="font-medium text-gray-900">Difficulty:</span> {difficulty}</div>
              <div><span className="font-medium text-gray-900">Status:</span> {status}</div>
              {surveyLink && <div><span className="font-medium text-gray-900">Survey Link:</span> <a href={surveyLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{surveyLink}</a></div>}
              {/* Skill display in review */}
              <div><span className="font-medium text-gray-900">Skill:</span> {availableSkills.find(s => s.id === selectedSkillId)?.name || "None"}</div>
              <div><span className="font-medium text-gray-900">Stories:</span> {stories.filter(s => s.title && s.content).length} segment{stories.filter(s => s.title && s.content).length !== 1 ? "s" : ""}</div>
              <div><span className="font-medium text-gray-900">Learning Resources:</span> {learningResources.filter(r => r.title && r.external_url).length} resource{learningResources.filter(r => r.title && r.external_url).length !== 1 ? "s" : ""}</div>
              <div><span className="font-medium text-gray-900">Levels:</span> {levels.length} level{levels.length !== 1 ? "s" : ""}</div>
            </div>
            <p className="text-gray-900 text-xs sm:text-sm">Review the quest details above. Click "Create Quest" to save, or "Back" to make changes.</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-200">
          <div className="flex gap-2 sm:gap-3 order-2 sm:order-1">
            {step > 1 && <Button onClick={() => setStep(step - 1)} variant="outline" className="flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10">Back</Button>}
          </div>

          <div className="flex gap-2 sm:gap-3 order-1 sm:order-2">
            <Button onClick={() => onOpenChange(false)} variant="cancel" className="flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10">Cancel</Button>
            {step < 6 ? (
              <Button onClick={handleNextStep} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm h-9 sm:h-10">Next</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isLoading} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm h-9 sm:h-10">
                {isLoading ? "Saving..." : editingQuest ? "Update Quest" : "Create Quest"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}