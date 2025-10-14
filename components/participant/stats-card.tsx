import type React from "react"
interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  gradient: string
}

export function StatsCard({ title, value, icon, gradient }: StatsCardProps) {
  return (
    <div className={`rounded-xl p-6 text-white ${gradient} shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/90 text-sm font-semibold mb-2">{title}</p>
          <p className="text-4xl font-bold">{value}</p>
        </div>
        <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">{icon}</div>
      </div>
    </div>
  )
}
