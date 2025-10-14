"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import type { Quest, UserQuest, QuestPage, Task, LearningResource } from "@/lib/types"

type Props = {
  quest: Quest
  initialUserQuest: UserQuest | null
  pages: QuestPage[]
  tasks: Task[]
  resources: LearningResource[]
}

export default function QuestFlow({ quest, initialUserQuest, pages, tasks, resources }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [userQuest, setUserQuest] = useState<UserQuest | null>(initialUserQuest)
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [saving, setSaving] = useState<boolean>(false)

  // Map tasks by page_number for quick access
  const tasksByPage = useMemo(() => {
    const map = new Map<number, Task[]>()
    tasks.forEach((t) => {
      if (t.page_number == null) return
      const list = map.get(t.page_number) || []
      list.push(t)
      map.set(t.page_number, list)
    })
    return map
  }, [tasks])

  const totalPages = pages.length

  // Ensure a user_quests row exists when opening the flow
  useEffect(() => {
    const ensureStarted = async () => {
      if (userQuest) return
      setSaving(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase
        .from("user_quests")
        .insert({ user_id: user.id, quest_id: quest.id, status: "in_progress", progress: 0, started_at: new Date().toISOString() })
        .select("*")
        .single<UserQuest>()
      if (!error) setUserQuest(data)
      setSaving(false)
    }
    ensureStarted()
  }, [quest.id, supabase, userQuest])

  const percent = Math.round(((currentIndex + 1) / Math.max(1, totalPages)) * 100)

  const goNext = async () => {
    const newIndex = Math.min(currentIndex + 1, totalPages - 1)
    setCurrentIndex(newIndex)
    await updateProgress(newIndex)
  }

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1))

  const updateProgress = async (index: number) => {
    if (!userQuest) return
    const newProgress = Math.max(userQuest.progress || 0, Math.round(((index + 1) / Math.max(1, totalPages)) * 100))
    if (newProgress === userQuest.progress) return
    setSaving(true)
    const { data, error } = await supabase
      .from("user_quests")
      .update({ progress: newProgress })
      .eq("id", userQuest.id)
      .select("*")
      .single<UserQuest>()
    if (!error && data) setUserQuest(data)
    setSaving(false)
  }

  const completeQuest = async () => {
    if (!userQuest) return
    setSaving(true)
    const { data, error } = await supabase
      .from("user_quests")
      .update({ status: "completed", progress: 100, completed_at: new Date().toISOString() })
      .eq("id", userQuest.id)
      .select("*")
      .single<UserQuest>()
    if (!error && data) setUserQuest(data)
    setSaving(false)
  }

  const page = pages[currentIndex]
  const pageTasks = page ? tasksByPage.get(page.page_number) || [] : []

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{quest.title}</h1>
        <p className="text-gray-600">{quest.description}</p>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Progress</span>
          <span className="font-semibold text-blue-600">{userQuest?.progress ?? percent}%</span>
        </div>
        <Progress value={userQuest?.progress ?? percent} className="h-2" />
      </div>

      {page && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: page.content || "" }} />
          </div>

          {pageTasks.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Tasks</h3>
              <ul className="list-disc pl-6 text-blue-900">
                {pageTasks.map((t) => (
                  <li key={t.id}>{t.description}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" onClick={goPrev} disabled={currentIndex === 0 || saving}>
          Previous
        </Button>
        {currentIndex < totalPages - 1 ? (
          <Button onClick={goNext} disabled={saving}>
            {saving ? "Saving..." : "Next"}
          </Button>
        ) : (
          <Button onClick={completeQuest} disabled={saving || userQuest?.status === "completed"}>
            {userQuest?.status === "completed" ? "Completed" : saving ? "Saving..." : "Finish"}
          </Button>
        )}
      </div>

      {resources.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold mb-3">Explore Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resources.map((r) => (
              <div key={r.id} className="rounded-xl border p-4">
                <h4 className="font-semibold mb-1">{r.title}</h4>
                <div className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: r.content || "" }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
