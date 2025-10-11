import type React from "react"
interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  gradient: string
}

export function StatsCard({ title, value, icon, gradient }: StatsCardProps) {
  return (
    <div className={`rounded-xl p-6 text-white ${gradient}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className="bg-white/20 rounded-lg p-3">{icon}</div>
      </div>
    </div>
  )
}
