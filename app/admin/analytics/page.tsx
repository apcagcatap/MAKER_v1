"use client"

import * as React from "react"
import "@/app/admin/admin.css"
import { CalendarIcon, Download, Loader2, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { getAnalyticsData } from "@/lib/actions/analytics"

// Import PDF libraries
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const chartConfig = {
  desktop: { label: "Users", color: "#2563eb" },
  completion: { label: "Completion %", color: "#1e40af" },
} satisfies ChartConfig

export default function AnalyticsPage() {
  const [date, setDate] = React.useState<Date | undefined>(undefined)
  const [rawQuests, setRawQuests] = React.useState<any[]>([])
  const [engagementData, setEngagementData] = React.useState<any[]>([])
  const [questFilter, setQuestFilter] = React.useState("published")
  const [loading, setLoading] = React.useState(true)
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false)

  // 1. Fetch Dynamic Data (Re-runs when 'date' changes)
  React.useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // Pass the selected date to the server action
        const data = await getAnalyticsData(date)
        setEngagementData(data.engagement)
        setRawQuests(data.quests)
      } catch (e) {
        console.error("Failed to load analytics:", e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [date]) // <--- Dependency array now includes 'date'

  // 2. Filter Logic
  const filteredQuests = React.useMemo(() => {
    if (questFilter === "all") return rawQuests
    if (questFilter === "published") return rawQuests.filter(q => q.is_active)
    if (questFilter === "archived") return rawQuests.filter(q => !q.is_active)
    return rawQuests
  }, [rawQuests, questFilter])

  // 3. PDF Generation
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
      pdf.text("Maker Analytics Report", 14, 20)
      
      pdf.setFontSize(12)
      // Display the "Snapshot Date" in the PDF header
      const reportDate = date ? format(date, "PPP") : format(new Date(), "PPP")
      pdf.text(`Snapshot Date: ${reportDate}`, 14, 30)

      const topMargin = 40
      pdf.addImage(imgData, "PNG", 0, topMargin, pdfWidth, imgHeight)

      pdf.save(`maker_report_${format(new Date(), "yyyy-MM-dd")}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF report.")
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const resetDate = () => setDate(undefined)

  return (
    <div className="admin-wrapper p-6 md:p-8 max-w-7xl mx-auto">
      <div className="admin-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="admin-title">Analytics & Reports</h1>
          <p className="admin-subtitle">
            {date 
              ? `Viewing historical data as of ${format(date, "MMMM d, yyyy")}` 
              : "Live insights from the Maker database."}
          </p>
        </div>
        
        <p className="text-sm text-muted-foreground hidden sm:block">
          Select filters below to customize your report.
        </p>
      </div>

      {/* Main Content ID for HTML2Canvas */}
      <div id="analytics-dashboard-content" className="space-y-6 bg-white p-4 rounded-lg relative min-h-[400px]">
        
        {loading && (
          <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Chart 1: Engagement */}
        <Card className="border-none shadow-none">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>
              {date ? `Signups up to ${format(date, "MMM yyyy")}` : "All time signups by month"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={engagementData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <ChartTooltip 
                  content={<ChartTooltipContent className="bg-white text-blue-600 border-blue-200 shadow-md" />} 
                />
                <Line dataKey="desktop" type="monotone" stroke="var(--color-desktop)" strokeWidth={2} dot />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Chart 2: Quest Completion */}
        <Card className="border-none shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Quest Completion Rates</CardTitle>
              <CardDescription>
                 {date ? `Completion status as of ${format(date, "MMM d, yyyy")}` : "Current completion rates"}
              </CardDescription>
            </div>
            {/* Filter Dropdown */}
            <div data-html2canvas-ignore>
              <Select value={questFilter} onValueChange={setQuestFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quests</SelectItem>
                  <SelectItem value="published">Published Only</SelectItem>
                  <SelectItem value="archived">Archived Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={filteredQuests}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="quest" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                <ChartTooltip 
                  content={<ChartTooltipContent className="bg-white text-blue-600 border-blue-200 shadow-md" />} 
                />
                <Bar dataKey="completion" fill="var(--color-completion)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Controls Section */}
      <div className="pt-6 border-t mt-6">
        <h3 className="text-lg font-semibold mb-4">Export Report</h3>
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex gap-2 w-full md:w-auto">
            <div className="grid w-full md:w-[250px] gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Filter by Date</span>}
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
              <Button variant="ghost" size="icon" onClick={resetDate} title="Reset to Live Data">
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>

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
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}