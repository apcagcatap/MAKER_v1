import type { SignupSparkline as SignupSparklineType } from "@/lib/actions/admin-dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface SignupSparklineProps {
  data: SignupSparklineType[]
}

export function SignupSparkline({ data }: SignupSparklineProps) {
  const max = Math.max(...data.map((s) => s.count), 1)

  return (
    <Card className="admin-card h-full">
      <CardHeader>
        <CardTitle className="text-base">New Signups</CardTitle>
        <CardDescription>Last 14 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-0.75 h-20">
          {data.map((d, i) => {
            const heightPx = Math.max((d.count / max) * 80, 3)
            return (
              <div key={i} className="flex-1 group relative" title={`${d.day}: ${d.count}`}>
                <div
                  className="w-full bg-[#004A98] rounded-t-lg transition-all hover:bg-[#ED262A]"
                  style={{ height: `${heightPx}px` }}
                />
              </div>
            )
          })}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-gray-400">{data[0]?.day}</span>
          <span className="text-[10px] text-gray-400">{data[data.length - 1]?.day}</span>
        </div>
      </CardContent>
    </Card>
  )
}
