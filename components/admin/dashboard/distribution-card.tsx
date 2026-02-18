import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DistributionItem {
  label: string
  count: number
  fill: string
  dotOnly?: boolean
}

interface DistributionCardProps {
  title: string
  items: DistributionItem[]
}

export function DistributionCard({ title, items }: DistributionCardProps) {
  const total = items.reduce((acc, cur) => acc + cur.count, 0)

  return (
    <Card className="admin-card h-full">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => {
            const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
            return (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    {item.dotOnly && (
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                    )}
                    <span className="font-medium text-gray-700">{item.label}</span>
                  </span>
                  <span className="text-gray-500">
                    {item.count} <span className="text-gray-400">({pct}%)</span>
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: item.fill }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
