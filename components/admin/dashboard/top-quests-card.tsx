import type { TopQuest } from "@/lib/actions/admin-dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface TopQuestsCardProps {
  quests: TopQuest[]
}

export function TopQuestsCard({ quests }: TopQuestsCardProps) {
  return (
    <Card className="admin-card h-full">
      <CardHeader>
        <CardTitle className="text-base">Top Quests</CardTitle>
        <CardDescription>By participation</CardDescription>
      </CardHeader>
      <CardContent>
        {quests.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No quest data yet</p>
        ) : (
          <div className="space-y-4">
            {quests.map((q, i) => (
              <div key={q.id} className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-gray-700 leading-tight line-clamp-1">
                    {i + 1}. {q.title}
                  </span>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {q.completionRate}%
                  </Badge>
                </div>
                <Progress value={q.completionRate} className="h-1.5 [&>div]:bg-[#ED262A]" />
                <p className="text-[11px] text-gray-400">
                  {q.participants} participants · {q.completions} completed
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
