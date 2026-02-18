"use client"

import { useRef, useState } from "react"
import { createAdminForum, updateAdminForum } from "@/lib/actions/admin-forums"
import { Loader2, Save } from "lucide-react"
import { useRouter } from "next/navigation"

export interface Forum {
  id: string
  title: string
  description: string | null
  created_at: string
  created_by: string | null
}

interface ForumFormProps {
  forum?: Forum
  onSuccess?: () => void
}

export function ForumForm({ forum, onSuccess }: ForumFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const res = forum
        ? await updateAdminForum(forum.id, formData)
        : await createAdminForum(formData)

      if (res.error) {
        alert(`Error: ${res.error}`)
      } else {
        if (!forum) {
          formRef.current?.reset()
        }
        if (onSuccess) {
          onSuccess()
        } else {
          router.push("/admin/forums")
          router.refresh()
        }
      }
    } catch (error) {
      console.error("Error saving forum:", error)
      alert("Failed to save forum")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-white shadow-sm text-black">
      <div className="grid gap-2">
        <label htmlFor="title" className="text-sm font-medium">
          Title <span className="text-[#ED262A]">*</span>
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={forum?.title}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ED262A]/20 focus:border-[#ED262A] transition-all"
          placeholder="e.g. General Discussion"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={forum?.description ?? ""}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ED262A]/20 focus:border-[#ED262A] transition-all resize-none min-h-25"
          placeholder="What is this forum about?"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={() => router.push("/admin/forums")}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-2 bg-[#ED262A] text-white rounded-md hover:bg-[#c41e22] transition-colors disabled:opacity-50 shadow-sm hover:shadow"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{forum ? "Saving..." : "Creating..."}</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{forum ? "Save Changes" : "Create Forum"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
