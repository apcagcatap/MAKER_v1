import type React from "react"

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  gradient: string
}

export function StatsCard({ title, value, icon, gradient }: StatsCardProps) {
  return (
    <div className={`rounded-xl p-4 sm:p-6 text-white ${gradient}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-white/80 text-xs sm:text-sm font-medium truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className="bg-white/20 rounded-lg p-2 sm:p-3 ml-2 flex-shrink-0">{icon}</div>
      </div>
    </div>
  )
}