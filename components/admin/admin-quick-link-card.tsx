"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface AdminQuickLinkCardProps {
  href: string
  icon: LucideIcon
  iconBgColor: string
  iconColor: string
  title: string
  description: string
}

export function AdminQuickLinkCard({
  href,
  icon: Icon,
  iconBgColor,
  iconColor,
  title,
  description,
}: AdminQuickLinkCardProps) {
  return (
    <Link href={href}>
      <Card className="hover:bg-slate-50 transition-colors cursor-pointer">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 ${iconBgColor} rounded-lg`}>
              <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-slate-500">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
