"use client"

import { Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface AdminSearchCardProps {
  placeholder: string
  value: string
  onChange: (value: string) => void
}

export function AdminSearchCard({ placeholder, value, onChange }: AdminSearchCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardContent>
    </Card>
  )
}
