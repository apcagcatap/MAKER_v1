"use client"

import * as React from "react"
import "@/app/admin/admin.css" // Import the admin styles
import { CalendarIcon, Download } from "lucide-react"
import { format } from "date-fns"
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// --- Mock Data ---

const engagementData = [
  { month: "JAN", desktop: 10 },
  { month: "FEB", desktop: 20 },
  { month: "MAR", desktop: 25 },
  { month: "APR", desktop: 40 },
  { month: "MAY", desktop: 50 },
  { month: "JUN", desktop: 60 },
]

const questData = [
  { quest: "ARDUINO1", completion: 20 },
  { quest: "CLEAN WORLD", completion: 40 },
]

// --- Chart Configs ---

const engagementConfig = {
  desktop: {
    label: "Users",
    color: "#2563eb",
  },
} satisfies ChartConfig

const questConfig = {
  completion: {
    label: "Completion Rate",
    color: "#1e40af",
  },
} satisfies ChartConfig

export default function AnalyticsPage() {
  const [date, setDate] = React.useState<Date>()

  const handleDownload = () => {
    console.log("Generating report for:", date)
    alert("Report generation started...")
  }

  return (
    <div className="admin-wrapper p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header Section matching User Management */}
      <div className="admin-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="admin-title">Analytics & Reports</h1>
          <p className="admin-subtitle">
            Gain detailed insights into user behavior and system performance.
          </p>
        </div>
        {/* We can place the primary action here if needed, or keep it in the specific section below */}
      </div>

      <div className="space-y-6">
        {/* User Engagement Chart */}
        <Card>
          <CardHeader className="items-center pb-4">
            <CardTitle>User Engagement Over Time</CardTitle>
            <CardDescription>Latest of 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={engagementConfig} className="h-[300px] w-full">
              <LineChart
                accessibilityLayer
                data={engagementData}
                margin={{
                  left: 12,
                  right: 12,
                  top: 20,
                  bottom: 20
                }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  domain={[0, 70]}
                  tickCount={8}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Line
                  dataKey="desktop"
                  type="linear"
                  stroke="var(--color-desktop)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Quest Completion Chart */}
        <Card>
          <CardHeader className="items-center pb-4">
            <CardTitle>Quest Completion Rates</CardTitle>
            <CardDescription>Latest of 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={questConfig} className="h-[300px] w-full">
              <BarChart accessibilityLayer data={questData} barSize={60}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="quest"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  domain={[0, 45]}
                  tickCount={10}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="completion" fill="var(--color-completion)" radius={2} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Generate Custom Reports Section */}
        <div className="pt-4">
          <h3 className="text-lg font-semibold mb-4">Generate Custom Reports</h3>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            
            <div className="grid w-full md:w-[250px] gap-2">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Report Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="engagement">User Engagement</SelectItem>
                  <SelectItem value="completion">Quest Completion</SelectItem>
                  <SelectItem value="activity">User Activity</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                    {date ? format(date, "PPP") : <span>dd/mm/yyyy</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button 
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
              onClick={handleDownload}
            >
              Generate Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}