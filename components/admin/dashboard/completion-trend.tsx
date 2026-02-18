import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface CompletionTrendProps {
  data: { month: string; completions: number; starts: number }[]
}

export function CompletionTrend({ data }: CompletionTrendProps) {
  const maxVal = Math.max(...data.map((t) => Math.max(t.starts, t.completions)), 1)

  return (
    <Card className="admin-card h-full">
      <CardHeader>
        <CardTitle className="text-base">Quest Activity</CardTitle>
        <CardDescription>Starts vs completions (6 months)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((m) => (
            <div key={m.month} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700 w-10">{m.month}</span>
                <span className="text-gray-400">
                  {m.starts} started · {m.completions} completed
                </span>
              </div>
              <div className="flex gap-1 h-3">
                <div
                  className="bg-[#004A98]/30 rounded-sm transition-all"
                  style={{ width: `${Math.max((m.starts / maxVal) * 100, 2)}%` }}
                  title={`${m.starts} started`}
                />
                <div
                  className="bg-[#ED262A] rounded-sm transition-all"
                  style={{ width: `${Math.max((m.completions / maxVal) * 100, 2)}%` }}
                  title={`${m.completions} completed`}
                />
              </div>
            </div>
          ))}
          <div className="flex items-center gap-4 text-[11px] text-gray-400 pt-1">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-2 bg-[#004A98]/30 rounded-sm" />
              Started
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-2 bg-[#ED262A] rounded-sm" />
              Completed
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
