"use client"

import { Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface FilterOption {
  value: string
  label: string
}

interface FilterConfig {
  placeholder: string
  value: string
  onChange: (value: string) => void
  options: FilterOption[]
  allLabel?: string
}

interface AdminFilterCardProps {
  searchPlaceholder: string
  searchValue: string
  onSearchChange: (value: string) => void
  filters?: FilterConfig[]
}

export function AdminFilterCard({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filters = [],
}: AdminFilterCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className={`grid grid-cols-1 md:grid-cols-${filters.length + 1} gap-4`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          {filters.map((filter, index) => (
            <Select key={index} value={filter.value} onValueChange={filter.onChange}>
              <SelectTrigger>
                <SelectValue placeholder={filter.placeholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{filter.allLabel || "All"}</SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
