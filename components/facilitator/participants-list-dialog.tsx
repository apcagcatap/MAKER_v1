"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, CheckCircle2, Circle, Clock } from "lucide-react"
import { getQuestParticipants } from "@/lib/actions/quests"

interface ParticipantsListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  questId: string
  questTitle: string
  questLevels: Array<{ title: string; description: string }>
}

interface Participant {
  status: string
  progress: number
  current_level: number
  started_at: string
  completed_at: string | null
  profiles: {
    id: string
    display_name: string
    email: string
    avatar_url: string | null
  }
}

export function ParticipantsListDialog({
  open,
  onOpenChange,
  questId,
  questTitle,
  questLevels,
}: ParticipantsListDialogProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open && questId) {
      loadParticipants()
    }
  }, [open, questId])

  const loadParticipants = async () => {
    setIsLoading(true)
    try {
      const data = await getQuestParticipants(questId)
      setParticipants(data as unknown as Participant[])
    } catch (error) {
      console.error("Failed to load participants", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0 px-3 py-1 gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </Badge>
        )
      case "in_progress":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0 px-3 py-1 gap-1">
            <Clock className="w-3 h-3" />
            In Progress
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const renderProgressInfo = (participant: Participant) => {
    if (participant.status === "completed") {
      return (
        <div className="w-full">
           <div className="flex justify-between mb-1">
            <span className="text-xs font-semibold text-green-600">100% Complete</span>
          </div>
          <Progress value={100} className="h-2 bg-green-100 [&>div]:bg-green-500" />
        </div>
      )
    }
    
    // Calculate current level info
    let currentTitle = "Loading..."
    let stepText = `Step ${participant.current_level + 1}`

    if (questLevels && questLevels.length > 0) {
      const levelIndex = participant.current_level || 0
      if (levelIndex < questLevels.length) {
        currentTitle = questLevels[levelIndex].title
      } else {
        currentTitle = "Finalizing..."
      }
    } else {
       currentTitle = "General Progress"
       stepText = ""
    }

    return (
      <div className="w-full space-y-2">
        <div className="flex items-start justify-between gap-2">
           <div className="flex flex-col">
             <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stepText}</span>
             <span className="text-sm font-semibold text-gray-900 line-clamp-1" title={currentTitle}>
               {currentTitle}
             </span>
           </div>
           <span className="text-xs font-bold text-blue-600 whitespace-nowrap">
             {participant.progress}%
           </span>
        </div>
        <Progress value={participant.progress} className="h-2" />
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-gray-50/50">
        <DialogHeader className="p-6 pb-4 bg-white border-b border-gray-100">
          <DialogTitle style={{ fontFamily: "Poppins, sans-serif" }} className="text-xl">
            Participants for <span className="text-[#4A90E2]">{questTitle}</span>
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            {participants.length} {participants.length === 1 ? 'user' : 'users'} enrolled
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Spinner className="h-8 w-8 text-blue-500" />
              <p className="text-sm text-gray-500">Loading participants...</p>
            </div>
          ) : participants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
              <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                <Circle className="h-6 w-6 text-gray-300" />
              </div>
              <p className="text-gray-900 font-medium">No participants yet</p>
              <p className="text-sm text-gray-500">Share this quest to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {participants.map((p, index) => (
                <div 
                  key={`${p.profiles?.id}-${index}`}
                  className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row gap-5 items-start sm:items-center"
                >
                  {/* User Profile Section */}
                  <div className="flex items-center gap-4 min-w-[200px] flex-shrink-0">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                      <AvatarImage src={p.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="bg-blue-50 text-blue-600 font-semibold">
                        {p.profiles?.display_name?.substring(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-gray-900 truncate pr-2">
                        {p.profiles?.display_name || "Unknown User"}
                      </span>
                      <span className="text-xs text-gray-500 truncate" title={p.profiles?.email}>
                        {p.profiles?.email}
                      </span>
                    </div>
                  </div>

                  {/* Divider for Desktop */}
                  <div className="hidden sm:block w-px h-12 bg-gray-100"></div>

                  {/* Progress Section */}
                  <div className="flex-1 w-full min-w-0">
                    {renderProgressInfo(p)}
                  </div>

                  {/* Divider for Desktop */}
                  <div className="hidden sm:block w-px h-12 bg-gray-100"></div>

                  {/* Meta Section (Status & Date) */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto gap-3 sm:gap-1 min-w-[140px]">
                    {getStatusBadge(p.status)}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500" title="Date Started">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{p.started_at ? new Date(p.started_at).toLocaleDateString() : "-"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}