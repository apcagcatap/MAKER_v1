import {
  Activity,
  UserPlus,
  PlayCircle,
  CheckCircle2,
  MessageSquare,
} from "lucide-react"
import type { ActivityItem } from "@/lib/actions/admin-dashboard"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const activityIcons: Record<string, typeof Activity> = {
  signup: UserPlus,
  quest_start: PlayCircle,
  quest_complete: CheckCircle2,
  forum_post: MessageSquare,
}

const activityColors: Record<string, string> = {
  signup: "bg-blue-100 text-blue-600",
  quest_start: "bg-amber-100 text-amber-600",
  quest_complete: "bg-emerald-100 text-emerald-600",
  forum_post: "bg-purple-100 text-purple-600",
}

interface ActivityFeedProps {
  items: ActivityItem[]
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <Card className="admin-card h-full">
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
        <CardDescription>Latest platform events</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const IconComp = activityIcons[item.type] || Activity
              const colorClasses = activityColors[item.type] || "bg-gray-100 text-gray-600"
              return (
                <div key={item.id} className="flex items-start gap-3">
                  <div className={`rounded-full p-2 mt-0.5 ${colorClasses}`}>
                    <IconComp className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">
                        {item.user_display_name || item.user_email}
                      </span>{" "}
                      <span className="text-gray-500">{item.description}</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
