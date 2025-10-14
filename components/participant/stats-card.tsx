import type React from "react"
interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  gradient: string
}

export function StatsCard({ title, value, icon, gradient }: StatsCardProps) {
  return (
    <div className={`rounded-xl px-4 py-5 text-white ${gradient} shadow-lg`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/90 text-sm font-semibold">{title}</p>
        <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm flex-shrink-0">
          {icon}
        </div>
      </div>
      <p className="text-4xl font-bold leading-none">{value}</p>
    </div>
  )
}
