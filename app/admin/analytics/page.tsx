"use client"

import * as React from "react"
import "@/app/admin/admin.css"
import { CalendarIcon, Download, Loader2, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { getAnalyticsData } from "@/lib/actions/analytics"

import jsPDF from "jspdf"
import html2canvas from "html2canvas"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const chartConfig = {
  users: { label: "New Users", color: "#ED262A" },
  completion: { label: "Monthly Close Rate %", color: "#ED262A" },
} satisfies ChartConfig

export default function AnalyticsPage() {
  const [date, setDate] = React.useState<Date | undefined>(undefined)
  const [questData, setQuestData] = React.useState<any[]>([])
  const [engagementData, setEngagementData] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false)

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
    <div className="admin-wrapper p-6 md:p-8 max-w-7xl mx-auto">
      <div className="admin-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="admin-title">Analytics & Reports</h1>
          <p className="admin-subtitle">
            {date 
              ? `Viewing data for ${format(date, "MMMM yyyy")}` 
              : `Current Month Overview (${format(new Date(), "MMMM")})`}
          </p>
        </div>
      </div>

      <div id="analytics-dashboard-content" className="space-y-6">
        <div className="space-y-6 bg-white p-4 rounded-lg relative min-h-[400px]">
           {loading && (
            <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#ED262A]" />
            </div>
          )}

          {/* Chart 1: Engagement (Daily) */}
          <Card className="border-none shadow-none">
            <CardHeader>
              <CardTitle>Daily Signups</CardTitle>
              <CardDescription>
                New users registered in {format(displayDate, "MMMM yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <LineChart data={engagementData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tickMargin={10}
                    label={{ value: 'Day of Month', position: 'insideBottom', offset: -5 }} 
                  />
                  <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                  <ChartTooltip 
                    content={<ChartTooltipContent className="bg-white text-[#ED262A] border-[#ED262A]/20 shadow-md" />} 
                  />
                  <Line dataKey="users" type="monotone" stroke="var(--color-users)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Chart 2: Quest Completion (Monthly) - No Filter */}
          <Card className="border-none shadow-none">
            <CardHeader>
              <CardTitle>Quest Performance</CardTitle>
              <CardDescription>
                Completion rate (Completions / Starts) for {format(displayDate, "MMMM")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={questData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="quest" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <ChartTooltip 
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-white p-3 border border-[#ED262A]/20 shadow-md rounded-lg text-sm text-[#ED262A]">
                            <div className="font-bold mb-1">{data.quest}</div>
                            <div>Rate: {data.completion}%</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {data.completes} completed / {data.starts} started
                            </div>
                          </div>
                        )
                      }
                      return null
                    }} 
                  />
                  <Bar dataKey="completion" fill="var(--color-completion)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Controls */}
      <Card className="mt-6 border shadow-sm">
        <CardHeader>
          <CardTitle>Report Controls</CardTitle>
          <CardDescription>Select a month to view its specific performance data.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex gap-2 w-full md:w-auto">
              <div className="grid w-full md:w-[250px] gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "justify-start text-left font-normal border-[#ED262A] bg-[#ED262A] text-white hover:bg-[#c41e22]",
                        !date 
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "MMMM yyyy") : <span>Pick a Month</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
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

            <Button
              className="w-full md:w-auto bg-[#ED262A] hover:bg-[#c41e22] min-w-[140px]"
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