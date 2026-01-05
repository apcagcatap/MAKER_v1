"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LucideIcon } from "lucide-react"

interface Column {
  key: string
  label: string
  className?: string
}

interface AdminDataTableProps<T> {
  title: string
  icon: LucideIcon
  columns: Column[]
  data: T[]
  loading: boolean
  emptyMessage: string
  renderRow: (item: T) => React.ReactNode
}

export function AdminDataTable<T extends { id: string }>({
  title,
  icon: Icon,
  columns,
  data,
  loading,
  emptyMessage,
  renderRow,
}: AdminDataTableProps<T>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          {title} ({data.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-slate-500">{emptyMessage}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key} className={col.className}>
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>{data.map((item) => renderRow(item))}</TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
