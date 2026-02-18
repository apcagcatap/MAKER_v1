import type React from "react"

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  gradient: string
  progress?: number // Optional progress percentage (0-100)
  subtext?: string  // Optional text (e.g., "450 / 1000 XP")
}

export function StatsCard({ title, value, icon, gradient, progress, subtext }: StatsCardProps) {
  return (
    <div className={`rounded-xl p-4 sm:p-6 text-white ${gradient} relative overflow-hidden`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 min-w-0 z-10">
          <p className="text-white/80 text-xs sm:text-sm font-medium truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className="bg-white/20 rounded-lg p-2 sm:p-3 ml-2 flex-shrink-0 z-10 backdrop-blur-sm">
          {icon}
        </div>
      </div>
      
      {/* Optional Progress Bar Section */}
      {typeof progress === 'number' && (
        <div className="mt-2 space-y-1.5 z-10 relative">
          <div className="flex justify-between text-xs text-white/90 font-medium">
             <span>Progress</span>
             <span>{subtext}</span>
          </div>
          {/* Custom white progress bar */}
          <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white/90 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}