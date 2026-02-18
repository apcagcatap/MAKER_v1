import type { RecentUser } from "@/lib/actions/admin-dashboard"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }
  return email.charAt(0).toUpperCase()
}

interface RecentUsersCardProps {
  users: RecentUser[]
}

export function RecentUsersCard({ users }: RecentUsersCardProps) {
  return (
    <Card className="admin-card h-full">
      <CardHeader>
        <CardTitle className="text-base">New Users</CardTitle>
        <CardDescription>Latest registrations</CardDescription>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No users yet</p>
        ) : (
          <div className="space-y-4">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  {u.avatar_url && (
                    <AvatarImage src={u.avatar_url} alt={u.display_name || u.email} />
                  )}
                  <AvatarFallback className="text-xs bg-[#004A98] text-white">
                    {getInitials(u.display_name, u.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {u.display_name || u.email}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {u.display_name ? u.email : ""}{" "}
                    {u.role !== "participant" && (
                      <Badge variant="outline" className="text-[10px] ml-1 capitalize">
                        {u.role}
                      </Badge>
                    )}
                  </p>
                </div>
                <span className="text-[11px] text-gray-400 shrink-0">
                  {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
