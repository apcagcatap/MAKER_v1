"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Search, Filter } from "lucide-react"
import { ParticipantCard } from "@/components/facilitator/participant-card"
import type { Profile } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ParticipantStats {
  participant: Profile
  questsCompleted: number
  questsInProgress: number
  totalQuests: number
  isAtRisk: boolean
}

interface ParticipantsListProps {
  participants: Profile[]
  participantStats: ParticipantStats[]
  questCountMap: Map<string, number>
}

export function ParticipantsList({ participants, participantStats, questCountMap }: ParticipantsListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  // Filter participants based on search query and status
  const filteredParticipants = useMemo(() => {
    let filtered = participantStats

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((stat) => {
        const name = stat.participant.display_name?.toLowerCase() || ""
        const email = stat.participant.email?.toLowerCase() || ""
        return name.includes(query) || email.includes(query)
      })
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((stat) => {
        switch (filterStatus) {
          case "at-risk":
            return stat.isAtRisk
          case "active":
            return stat.questsInProgress > 0
          case "completed":
            return stat.questsCompleted > 0 && stat.questsInProgress === 0
          case "inactive":
            return stat.questsInProgress === 0 && stat.questsCompleted === 0
          default:
            return true
        }
      })
    }

    return filtered
  }, [participantStats, searchQuery, filterStatus])

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="search"
            placeholder="Search participants by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-5 h-5 text-gray-400" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Participants</SelectItem>
              <SelectItem value="at-risk">At Risk</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed All</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
            <span className="text-sm font-semibold text-blue-900">
              {filteredParticipants.length} of {participants.length} participant{participants.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredParticipants.map((stat) => (
          <ParticipantCard
            key={stat.participant.id}
            participant={stat.participant}
            questsCompleted={stat.questsCompleted}
            questsInProgress={stat.questsInProgress}
            totalQuests={stat.totalQuests}
            isAtRisk={stat.isAtRisk}
          />
        ))}
      </div>

      {filteredParticipants.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {searchQuery || filterStatus !== "all"
              ? "No participants match your search or filter."
              : "No participants yet."}
          </p>
        </div>
      )}
    </div>
  )
}