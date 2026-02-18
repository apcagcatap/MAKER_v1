"use client"

import * as React from "react"
import "@/app/admin/admin.css"
import { CalendarIcon, Download, Loader2, RefreshCw, Filter } from "lucide-react"
import { format } from "date-fns"
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis, Brush } from "recharts"
import { getAnalyticsData } from "@/lib/actions/analytics"

import jsPDF from "jspdf"
import html2canvas from "html2canvas"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const chartConfig = {
  users: { label: "New Users", color: "#2563eb" },
  completion: { label: "Monthly Close Rate %", color: "#0ea5e9" },
} satisfies ChartConfig

export default function AnalyticsPage() {
  const [date, setDate] = React.useState<Date | undefined>(undefined)
  const [questData, setQuestData] = React.useState<any[]>([])
  const [engagementData, setEngagementData] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false)
  
  // Filter State
  const [statusFilter, setStatusFilter] = React.useState("Published")

  // Load Data (Triggered by Date Change)
  React.useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await getAnalyticsData(date)
        setEngagementData(data.engagement)
        setQuestData(data.quests)
      } catch (e) {
        console.error("Failed to load analytics:", e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [date])

  // Filter the Quest Data based on selection
  const filteredQuestData = React.useMemo(() => {
    if (statusFilter === "All") return questData
    return questData.filter((q) => q.status === statusFilter)
  }, [questData, statusFilter])

  // Helper to determine color based on completion rate
  const getRateColor = (rate: number) => {
    if (rate >= 70) return "text-green-600" // High
    if (rate >= 30) return "text-orange-500" // Medium
    return "text-red-600" // Low
  }

  // PDF Generation
  const handleDownloadPDF = async () => {
    const element = document.getElementById("analytics-dashboard-content")
    if (!element) return

    setIsGeneratingPdf(true)
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const imgProps = pdf.getImageProperties(imgData)
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width
      
      pdf.setFontSize(18)
      pdf.text("Maker Monthly Report", 14, 20)
      
      pdf.setFontSize(12)
      const reportDate = date ? format(date, "MMMM yyyy") : format(new Date(), "MMMM yyyy")
      pdf.text(`Reporting Period: ${reportDate}`, 14, 30)

      const topMargin = 40
      pdf.addImage(imgData, "PNG", 0, topMargin, pdfWidth, imgHeight)

      pdf.save(`maker_report_${format(date || new Date(), "yyyy-MM")}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF report.")
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const resetDate = () => setDate(undefined)

  const displayDate = date || new Date()

  return (
    <div className="admin-wrapper p-4 md:p-6">
      <div className="admin-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h1 className="admin-title text-2xl sm:text-3xl font-bold">Analytics & Reports</h1>
          <p className="admin-subtitle text-sm sm:text-base text-gray-500 mt-1">
            {date 
              ? `Viewing data for ${format(date, "MMMM yyyy")}` 
              : `Current Month Overview (${format(new Date(), "MMMM")})`}
          </p>
        </div>
      </div>

      <div id="analytics-dashboard-content" className="space-y-4">
        <div className="space-y-6 bg-white p-4 rounded-lg relative min-h-[400px]">
           {loading && (
            <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}

          {/* Chart 1: Engagement (Daily) */}
          <Card className="border-none shadow-none p-0">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg sm:text-xl">Daily Signups</CardTitle>
              <CardDescription>
                New users registered in {format(displayDate, "MMMM yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              {/* UPDATED: Responsive height (250px mobile / 300px desktop) */}
              <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full">
                <LineChart data={engagementData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tickMargin={10}
                    fontSize={12}
                    label={{ value: 'Day', position: 'insideBottom', offset: -5, fontSize: 10 }} 
                  />
                  <YAxis axisLine={false} tickLine={false} allowDecimals={false} fontSize={12} />
                  <ChartTooltip 
                    content={<ChartTooltipContent className="bg-white text-[#ED262A] border-[#ED262A]/20 shadow-md" />} 
                  />
                  <Line 
                    dataKey="users" 
                    type="monotone" 
                    stroke="var(--color-users)" 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={{ r: 6, fill: "#ef4444" }} 
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Chart 2: Quest Completion (Monthly) with Filter & Zoom */}
          <Card className="border-none shadow-none p-0">
            {/* UPDATED: Header flex-col on mobile to prevent squashing */}
            <CardHeader className="px-0 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
              <div className="space-y-1">
                <CardTitle className="text-lg sm:text-xl">Quest Performance</CardTitle>
                <CardDescription>
                  Completion rate (Completions / Starts)
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                 <Filter className="w-4 h-4 text-gray-500" />
                 <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Quests</SelectItem>
                    <SelectItem value="Published">Published</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                    <SelectItem value="Draft">Drafts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="px-0">
              {/* UPDATED: Responsive height */}
              <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full">
                <BarChart data={filteredQuestData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="quest" 
                    axisLine={false} 
                    tickLine={false} 
                    minTickGap={10} 
                    fontSize={12}
                  />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} />
                  
                  <ChartTooltip 
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        const rateColorClass = getRateColor(data.completion)
                        
                        return (
                          <div className="bg-white p-3 border border-blue-200 shadow-md rounded-lg text-sm text-gray-700">
                            <div className="font-bold mb-1 max-w-[200px] break-words">{data.quest}</div>
                            <div className="text-xs text-gray-500 mb-2">Status: {data.status}</div>
                            
                            <div className={cn("font-bold", rateColorClass)}>
                              Rate: {data.completion}%
                            </div>
                            
                            <div className="text-xs text-gray-500 mt-1">
                              {data.completes} completed / {data.starts} started
                            </div>
                          </div>
                        )
                      }
                      return null
                    }} 
                  />
                  
                  <Bar 
                    dataKey="completion" 
                    fill="#0ea5e9"
                    radius={[4, 4, 0, 0]} 
                  />
                  
                  <Brush 
                    dataKey="quest" 
                    height={30} 
                    stroke="#2563eb" 
                    alwaysShowText={false}
                    tickFormatter={() => ""} 
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Controls */}
      <Card className="mt-6 border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Report Controls</CardTitle>
          <CardDescription>Select a month to view its specific performance data.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end w-full">
            <div className="flex gap-2 w-full md:w-auto">
              {/* UPDATED: w-full for mobile date picker */}
              <div className="grid w-full md:w-[250px] gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      className={cn(
                        "w-full justify-start text-left font-normal bg-blue-600 hover:bg-blue-700 text-white",
                        !date && "text-blue-50"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "MMMM yyyy") : <span>Pick a Month</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {date && (
                <Button variant="ghost" size="icon" onClick={resetDate} title="Reset to Current Month">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* UPDATED: w-full for mobile download button */}
            <Button 
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 min-w-[140px]"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf || loading}
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}