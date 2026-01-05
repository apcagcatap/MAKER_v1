"use client"

import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  icon: LucideIcon
  iconBgColor: string
  iconColor: string
  value: number | string
  label: string
}

export function AdminStatCard({
  icon: Icon,
  iconBgColor,
  iconColor,
  value,
  label,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 ${iconBgColor} rounded-lg`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-slate-500">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
