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
import { Calendar, CheckCircle2, Circle, Clock, Mail } from "lucide-react"
import { getQuestParticipants } from "@/lib/actions/quests"
import { cn } from "@/lib/utils"

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
      if (Array.isArray(data)) {
        setParticipants(data as unknown as Participant[])
      } else {
        setParticipants([])
      }
    } catch (error) {
      console.error("Failed to load participants", error)
      setParticipants([])
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0 px-2.5 py-0.5 gap-1.5 whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </Badge>
        )
      case "in_progress":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0 px-2.5 py-0.5 gap-1.5 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5" />
            In Progress
          </Badge>
        )
      default:
        return <Badge variant="secondary" className="capitalize">{status}</Badge>
    }
  }

  const renderProgressInfo = (participant: Participant) => {
    if (participant.status === "completed") {
      return (
        <div className="w-full space-y-1.5">
           <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Mission Complete</span>
            <span className="text-xs font-bold text-green-700">100%</span>
          </div>
          <Progress value={100} className="h-2.5 bg-green-100 [&>div]:bg-green-500 rounded-full" />
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
       stepText = "In Progress"
    }

    return (
      <div className="w-full space-y-1.5">
        <div className="flex items-end justify-between gap-4">
           <div className="flex flex-col min-w-0">
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{stepText}</span>
             <span className="text-sm font-semibold text-gray-900 truncate block w-full" title={currentTitle}>
               {currentTitle}
             </span>
           </div>
           <span className="text-sm font-bold text-blue-600 tabular-nums">
             {participant.progress}%
           </span>
        </div>
        <Progress value={participant.progress} className="h-2.5 bg-gray-100 rounded-full" />
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 bg-white border-0 shadow-2xl overflow-hidden rounded-2xl">
        
        {/* Header */}
        <DialogHeader className="p-6 pb-4 bg-white border-b border-gray-100 shrink-0">
          <DialogTitle style={{ fontFamily: "Poppins, sans-serif" }} className="text-2xl font-semibold text-gray-900">
            Participants <span className="text-gray-300 mx-2">|</span> <span className="text-[#4A90E2]">{questTitle}</span>
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {participants.length} Enrolled
            </span>
          </div>
        </DialogHeader>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4 sm:p-6 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Spinner className="h-10 w-10 text-blue-500" />
              <p className="text-sm font-medium text-gray-500">Loading participants...</p>
            </div>
          ) : participants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <Circle className="h-8 w-8 text-blue-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No participants yet</h3>
              <p className="text-gray-500 mt-1">When users start this quest, they'll appear here.</p>
            </div>
          ) : (
            participants.map((p, index) => (
              <div 
                key={`${p.profiles?.id}-${index}`}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
              >
                {/* Desktop: Grid Layout | Mobile: Flex Column */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-5 items-center">
                  
                  {/* Profile Section (Span 5) */}
                  <div className="md:col-span-5 flex items-center gap-4 min-w-0">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm shrink-0">
                      <AvatarImage src={p.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-lg">
                        {p.profiles?.display_name?.substring(0, 1).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0 overflow-hidden">
                      <span className="font-bold text-gray-900 truncate text-base">
                        {p.profiles?.display_name || "Unknown User"}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5 truncate">
                        <Mail className="w-3 h-3 shrink-0" />
                        <span className="truncate">{p.profiles?.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Section (Span 4) */}
                  <div className="md:col-span-4 w-full min-w-0 border-t md:border-t-0 border-gray-100 pt-4 md:pt-0 mt-2 md:mt-0">
                    {renderProgressInfo(p)}
                  </div>

                  {/* Status Section (Span 3) */}
                  <div className="md:col-span-3 w-full flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-1 md:gap-2 border-t md:border-t-0 border-gray-100 pt-4 md:pt-0 mt-2 md:mt-0 pl-1">
                    {getStatusBadge(p.status)}
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400" title="Date Started">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{p.started_at ? new Date(p.started_at).toLocaleDateString() : "N/A"}</span>
                    </div>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}