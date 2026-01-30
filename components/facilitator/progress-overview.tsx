"use client"

import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react"

interface ProgressOverviewProps {
  stats: {
    totalParticipants: number
    activeParticipants: number
    completionRate: number
    averageProgress: number
    atRisk: number
  }
}

export function ProgressOverview({ stats }: ProgressOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-sm text-gray-600 mb-1">Total Participants</p>
        <p className="text-3xl font-bold text-gray-900">{stats.totalParticipants}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-sm text-gray-600 mb-1">Active Now</p>
        <p className="text-3xl font-bold text-blue-600">{stats.activeParticipants}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
        <div className="flex items-end gap-2">
          <p className="text-3xl font-bold text-green-600">{stats.completionRate}%</p>
          {stats.completionRate >= 70 ? (
            <TrendingUp className="w-5 h-5 text-green-500 mb-1" />
          ) : stats.completionRate >= 50 ? (
            <Minus className="w-5 h-5 text-yellow-500 mb-1" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-500 mb-1" />
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-sm text-gray-600 mb-1">Avg Progress</p>
        <p className="text-3xl font-bold text-purple-600">{stats.averageProgress}%</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-sm text-gray-600 mb-1">At Risk</p>
        <div className="flex items-end gap-2">
          <p className="text-3xl font-bold text-red-600">{stats.atRisk}</p>
          {stats.atRisk > 0 && <AlertTriangle className="w-5 h-5 text-red-500 mb-1" />}
        </div>
      </div>
    </div>
  )
}