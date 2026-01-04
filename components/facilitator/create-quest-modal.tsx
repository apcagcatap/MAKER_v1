"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, Upload, X } from "lucide-react"
import { createQuest, updateQuest, uploadImage } from "@/lib/actions/quests"
import { toast } from "sonner"

interface QuestLevel {
  title: string
  description: string
}

interface CreateQuestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingQuest?: {
    id: string
    title: string
    description: string
    difficulty: string
    scheduled_date: string | null
    badge_image_url: string | null
    certificate_image_url: string | null
    status: string
    materials_needed: string
    general_instructions: string
    levels: QuestLevel[]
  }
}

export function CreateQuestModal({ open, onOpenChange, editingQuest }: CreateQuestModalProps) {
  const router = useRouter()
  const badgeInputRef = useRef<HTMLInputElement>(null)
  const certificateInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // Basic Details
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

  // Materials & Instructions
  const [materialsNeeded, setMaterialsNeeded] = useState(editingQuest?.materials_needed || "")
  const [generalInstructions, setGeneralInstructions] = useState(editingQuest?.general_instructions || "")

  // Quest Levels
  const [levels, setLevels] = useState<QuestLevel[]>(editingQuest?.levels || [])

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  const getValidationErrors = (stepToValidate: number) => {
    const newErrors: Record<string, string> = {}

    // Step 1 validation
    if (stepToValidate === 1) {
      if (!title.trim()) newErrors.title = "Quest name is required"
      if (!description.trim()) newErrors.description = "Description is required"
      if (!badgeImageUrl) newErrors.badgeImage = "Badge image is required"
      if (!certificateImageUrl) newErrors.certificateImage = "Certificate image is required"
    }

    // Step 2 validation
    if (stepToValidate === 2) {
      if (!materialsNeeded.trim()) newErrors.materials = "Materials needed is required"
      if (!generalInstructions.trim()) newErrors.instructions = "General instructions are required"
    }

    // Step 3 validation
    if (stepToValidate === 3) {
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
      const errorMessage = error instanceof Error ? error.message : "Failed to upload badge image"
      console.error("Badge upload error:", error)
      toast.error(errorMessage)
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
      const errorMessage = error instanceof Error ? error.message : "Failed to upload certificate image"
      console.error("Certificate upload error:", error)
      toast.error(errorMessage)
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

  const addLevel = () => {
    setLevels([...levels, { title: "", description: "" }])
  }

  const removeLevel = (index: number) => {
    setLevels(levels.filter((_, i) => i !== index))
  }

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
    // Validate all steps before submission
    const step1Errors = getValidationErrors(1)
    const step2Errors = getValidationErrors(2)
    const step3Errors = getValidationErrors(3)

    if (Object.keys(step1Errors).length > 0 || Object.keys(step2Errors).length > 0 || Object.keys(step3Errors).length > 0) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsLoading(true)
    try {
      const questData = {
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
      }

      if (editingQuest) {
        await updateQuest(editingQuest.id, questData)
        toast.success("Quest updated successfully")
      } else {
        await createQuest(questData)
        toast.success("Quest created successfully")
      }

      // Close modal and signal to refresh
      resetForm()
      onOpenChange(false)

      // Refresh the page to get updated quests
      setTimeout(() => router.refresh(), 300)
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
    setStatus("Draft")
    setMaterialsNeeded("")
    setGeneralInstructions("")
    setLevels([])
  }

  const handleClose = (refresh = false) => {
    onOpenChange(refresh)
    resetForm()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-blue-50">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-gray-900">Create New Quest</DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-8 my-6">
          {[1, 2, 3, 4].map((stepNum) => (
            <div key={stepNum} className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                  step >= stepNum
                    ? "bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {stepNum}
              </div>
              {stepNum < 4 && (
                <div
                  className={`w-12 h-0.5 ${
                    step > stepNum ? "bg-blue-600" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Basic Details */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Basic Details</h2>

            <div>
              <Label className="text-gray-900 font-medium">Quest Name *</Label>
              <Input
                placeholder="Enter quest name"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (errors.title) setErrors({ ...errors, title: "" })
                }}
                className={`mt-2 h-10 ${errors.title ? "border-red-500" : ""}`}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <Label className="text-gray-900 font-medium">Description *</Label>
              <Textarea
                placeholder="Enter quest description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  if (errors.description) setErrors({ ...errors, description: "" })
                }}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-900 font-medium">Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="mt-2 h-10">
                    <SelectValue />
                  </SelectTrigger>
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
                <Label className="text-gray-900 font-medium">Scheduled For</Label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="mt-2 h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-900 font-medium">Badge Image *</Label>
                {badgeImagePreview ? (
                  <div className="mt-2 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 bg-gray-100 relative group">
                    <img src={badgeImagePreview} alt="Badge preview" className="h-full object-contain p-2" />
                    <button
                      onClick={removeBadgeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => badgeInputRef.current?.click()}
                    disabled={badgeImageUploading}
                    className={`mt-2 w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors ${
                      badgeImageUploading ? "opacity-50" : ""
                    }`}
                  >
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">{badgeImageUploading ? "Uploading..." : "Upload Badge Image"}</p>
                    </div>
                  </button>
                )}
                <input
                  ref={badgeInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBadgeImageUpload}
                  className="hidden"
                />
                {errors.badgeImage && <p className="text-red-500 text-sm mt-1">{errors.badgeImage}</p>}
              </div>

              <div>
                <Label className="text-gray-900 font-medium">Certificate Image *</Label>
                {certificateImagePreview ? (
                  <div className="mt-2 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 bg-gray-100 relative group">
                    <img src={certificateImagePreview} alt="Certificate preview" className="h-full object-contain p-2" />
                    <button
                      onClick={removeCertificateImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => certificateInputRef.current?.click()}
                    disabled={certificateImageUploading}
                    className={`mt-2 w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors ${
                      certificateImageUploading ? "opacity-50" : ""
                    }`}
                  >
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">{certificateImageUploading ? "Uploading..." : "Upload Certificate Image"}</p>
                    </div>
                  </button>
                )}
                <input
                  ref={certificateInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCertificateImageUpload}
                  className="hidden"
                />
                {errors.certificateImage && <p className="text-red-500 text-sm mt-1">{errors.certificateImage}</p>}
              </div>
            </div>

            <div>
              <Label className="text-gray-900 font-medium">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-2 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 2: Materials & Instructions */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Materials & Instructions</h2>

            <div>
              <Label className="text-gray-900 font-medium">Materials Needed *</Label>
              <Textarea
                placeholder="List all materials needed for this quest (e.g., Arduino board, LED lights, breadboard)"
                value={materialsNeeded}
                onChange={(e) => {
                  setMaterialsNeeded(e.target.value)
                  if (errors.materials) setErrors({ ...errors, materials: "" })
                }}
                className={errors.materials ? "border-red-500 mt-2" : "mt-2"}
              />
              {errors.materials && <p className="text-red-500 text-sm mt-1">{errors.materials}</p>}
            </div>

            <div>
              <Label className="text-gray-900 font-medium">General Instructions *</Label>
              <Textarea
                placeholder="Provide general instructions or guidelines for completing this quest"
                value={generalInstructions}
                onChange={(e) => {
                  setGeneralInstructions(e.target.value)
                  if (errors.instructions) setErrors({ ...errors, instructions: "" })
                }}
                className={errors.instructions ? "border-red-500 mt-2" : "mt-2"}
              />
              {errors.instructions && <p className="text-red-500 text-sm mt-1">{errors.instructions}</p>}
            </div>
          </div>
        )}

        {/* Step 3: Quest Levels */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Quest Levels *</h2>
              <Button
                onClick={addLevel}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Level
              </Button>
            </div>

            {errors.levels && <p className="text-red-500 text-sm">{errors.levels}</p>}

            {levels.map((level, index) => (
              <div
                key={index}
                className={`bg-white rounded-lg p-6 border-2 space-y-4 ${
                  errors[`level_${index}_title`] || errors[`level_${index}_desc`]
                    ? "border-red-300"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">Level {index + 1}</h3>
                  <button
                    onClick={() => removeLevel(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <Label className="text-gray-900 font-medium">Task Title *</Label>
                  <Input
                    placeholder="e.g., Connect the LED circuit"
                    value={level.title}
                    onChange={(e) => {
                      updateLevel(index, "title", e.target.value)
                      if (errors[`level_${index}_title`])
                        setErrors({ ...errors, [`level_${index}_title`]: "" })
                    }}
                    className={`mt-2 h-10 ${errors[`level_${index}_title`] ? "border-red-500" : ""}`}
                  />
                  {errors[`level_${index}_title`] && (
                    <p className="text-red-500 text-sm mt-1">{errors[`level_${index}_title`]}</p>
                  )}
                </div>

                <div>
                  <Label className="text-gray-900 font-medium">Task Description *</Label>
                  <Textarea
                    placeholder="Describe what the participant needs to do in this level"
                    value={level.description}
                    onChange={(e) => {
                      updateLevel(index, "description", e.target.value)
                      if (errors[`level_${index}_desc`])
                        setErrors({ ...errors, [`level_${index}_desc`]: "" })
                    }}
                    className={errors[`level_${index}_desc`] ? "border-red-500" : ""}
                  />
                  {errors[`level_${index}_desc`] && (
                    <p className="text-red-500 text-sm mt-1">{errors[`level_${index}_desc`]}</p>
                  )}
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

        {/* Step 4: Review & Publish */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Review & Publish</h2>

            <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
              <div>
                <span className="font-medium">Quest Name:</span> {title}
              </div>
              <div>
                <span className="font-medium">Difficulty:</span> {difficulty}
              </div>
              <div>
                <span className="font-medium">Status:</span> {status}
              </div>
              <div>
                <span className="font-medium">Levels:</span> {levels.length} level{levels.length !== 1 ? "s" : ""}
              </div>
            </div>

            <p className="text-gray-600 text-sm">
              Review the quest details above. Click "Next" to save, or "Cancel" to discard changes.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-6 border-t border-gray-200">
          <div className="flex gap-3">
            {step > 1 && (
              <Button
                onClick={() => setStep(step - 1)}
                variant="outline"
              >
                Back
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => handleClose()}
              variant="outline"
            >
              Cancel
            </Button>

            {step < 4 ? (
              <Button
                onClick={handleNextStep}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? "Saving..." : editingQuest ? "Update Quest" : "Create Quest"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
