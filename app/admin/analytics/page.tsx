"use client"

import * as React from "react"
import "@/app/admin/admin.css"
import { Download } from "lucide-react"
import { format } from "date-fns"
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { getAnalyticsData } from "@/lib/actions/analytics"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Updated chart config with blue color scheme
const chartConfig = {
  desktop: { label: "Users", color: "#2563eb" },
  completion: { label: "Completion %", color: "#1e40af" },
} satisfies ChartConfig

export default function AnalyticsPage() {
  const [rawQuests, setRawQuests] = React.useState<any[]>([])
  const [engagementData, setEngagementData] = React.useState<any[]>([])
  // Removed xpData state
  const [questFilter, setQuestFilter] = React.useState("published")
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      try {
        const data = await getAnalyticsData()
        setEngagementData(data.engagement)
        setRawQuests(data.quests)
        // Removed setXpData
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Filtering Logic
  const filteredQuests = React.useMemo(() => {
    if (questFilter === "all") return rawQuests
    if (questFilter === "published") return rawQuests.filter(q => q.is_active)
    if (questFilter === "archived") return rawQuests.filter(q => !q.is_active)
    return rawQuests
  }, [rawQuests, questFilter])

  // CSV Download Function
  const downloadCSV = () => {
    const headers = ["Quest Name", "Completion Rate", "Status"]
    const rows = rawQuests.map(q => [q.quest, `${q.completion}%`, q.is_active ? "Published" : "Archived"])
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", `maker_analytics_${format(new Date(), "yyyy-MM-dd")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) return <div className="p-10 text-center">Fetching live data...</div>

  // Custom tooltip styling: White background, blue text
  const tooltipStyle = "bg-white text-blue-600 border-blue-200 shadow-md"

  return (
    <div className="admin-wrapper p-6 md:p-8 max-w-7xl mx-auto">
      <div className="admin-header flex justify-between items-center mb-8">
        <div>
          <h1 className="admin-title">System Insights</h1>
          <p className="admin-subtitle">Monitor quest engagement and user growth.</p>
        </div>
        <Button onClick={downloadCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Chart 1: Engagement (Correctly Sorted) */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>New signups over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={engagementData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <ChartTooltip 
                  content={<ChartTooltipContent className={tooltipStyle} />} 
                />
                <Line dataKey="desktop" type="monotone" stroke="var(--color-desktop)" strokeWidth={2} dot />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Chart 2: Quest Completion (With Filter) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Quest Completion Rates</CardTitle>
              <CardDescription>Percentage of users who finished each quest</CardDescription>
            </div>
            <Select value={questFilter} onValueChange={setQuestFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Quests</SelectItem>
                <SelectItem value="published">Published Only</SelectItem>
                <SelectItem value="archived">Archived Only</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <BarChart data={filteredQuests}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="quest" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                <ChartTooltip 
                  content={<ChartTooltipContent className={tooltipStyle} />} 
                />
                <Bar dataKey="completion" fill="var(--color-completion)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}