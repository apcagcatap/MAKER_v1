"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { getQuestParticipgants } from "@/lib/actions/quests"

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
      // Map the generic result to our typed interface
      // Note: Supabase returns single object or array depending on query, 
      // but our action returns array. Casting for safety.
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
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">In Progress</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getCurrentPart = (participant: Participant) => {
    if (participant.status === "completed") {
      return "All levels completed"
    }
    
    // Check if we have level info
    if (questLevels && questLevels.length > 0) {
      const levelIndex = participant.current_level || 0
      if (levelIndex < questLevels.length) {
        return `Level ${levelIndex + 1}: ${questLevels[levelIndex].title}`
      }
    }
    
    // Fallback if no levels defined or index out of bounds
    return `${participant.progress}% Completed`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "Poppins, sans-serif" }}>
            Participants for: <span className="text-[#4A90E2]">{questTitle}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto mt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-8 w-8 text-blue-500" />
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No participants have started this quest yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Current Part / Progress</TableHead>
                  <TableHead>Started</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((p, index) => (
                  <TableRow key={`${p.profiles.id}-${index}`}>
                    <TableCell className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={p.profiles.avatar_url || undefined} />
                        <AvatarFallback>
                          {p.profiles.display_name?.substring(0, 2).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {p.profiles.display_name || "Unknown User"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {p.profiles.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(p.status)}</TableCell>
                    <TableCell className="text-sm">
                      {getCurrentPart(p)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(p.started_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}