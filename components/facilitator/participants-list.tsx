"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { ParticipantCard } from "@/components/facilitator/participant-card"
import type { Profile } from "@/lib/types"

interface ParticipantsListProps {
  participants: Profile[]
  questCountMap: Map<string, number>
}

export function ParticipantsList({ participants, questCountMap }: ParticipantsListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Filter participants based on search query
  const filteredParticipants = useMemo(() => {
    if (!searchQuery.trim()) return participants

    const query = searchQuery.toLowerCase()
    return participants.filter((participant) => {
      const name = participant.display_name?.toLowerCase() || ""
      const email = participant.email?.toLowerCase() || ""
      return name.includes(query) || email.includes(query)
    })
  }, [participants, searchQuery])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="search"
            placeholder="Search participants by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="ml-4 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
          <span className="text-sm font-semibold text-blue-900">
            {filteredParticipants.length} of {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredParticipants.map((participant) => (
          <ParticipantCard
            key={participant.id}
            participant={participant}
            questsCompleted={questCountMap.get(participant.id) || 0}
          />
        ))}
      </div>

      {filteredParticipants.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {searchQuery ? "No participants match your search." : "No participants yet."}
          </p>
        </div>
      )}
    </div>
  )
}