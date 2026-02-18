import {
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"
import type { KpiCard as KpiCardType } from "@/lib/actions/admin-dashboard"
import { Card, CardContent } from "@/components/ui/card"

function TrendIndicator({
  trend,
  changePercent,
}: {
  trend: "up" | "down" | "flat"
  changePercent: number
}) {
  if (trend === "up")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
        <TrendingUp className="h-3 w-3" />+{changePercent}%
      </span>
    )
  if (trend === "down")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
        <TrendingDown className="h-3 w-3" />
        {changePercent}%
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
      <Minus className="h-3 w-3" />
      0%
    </span>
  )
}

interface KpiCardProps {
  kpi: KpiCardType
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  iconBg: string
}

export function KpiCard({ kpi, icon: Icon, iconColor, iconBg }: KpiCardProps) {
  return (
    <Card className="admin-card">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{kpi.label}</p>
            <p className="text-3xl font-bold mt-1 text-gray-900">
              {kpi.value.toLocaleString()}
            </p>
            <div className="mt-1">
              <TrendIndicator trend={kpi.trend} changePercent={kpi.changePercent} />
              <span className="text-xs text-gray-400 ml-1">vs last month</span>
            </div>
          </div>
          <div className={`rounded-xl p-3 ${iconBg}`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
