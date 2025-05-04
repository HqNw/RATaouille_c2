"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import type { ApplicationData } from "@/types/keylogger"

interface ApplicationContextProps {
  applicationData: ApplicationData[]
}

export function ApplicationContext({ applicationData }: ApplicationContextProps) {
  // Colors for the pie chart
  const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]

  if (applicationData.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No application context data available</div>
  }

  // Sort by keystroke count
  const sortedData = [...applicationData].sort((a, b) => b.keystrokeCount - a.keystrokeCount)

  // Table data
  const tableData = sortedData.slice(0, 5)

  // Chart data (limit to top 5, combine others)
  const chartData = sortedData.slice(0, 5)

  // Add "Others" category if there are more than 5 applications
  if (sortedData.length > 5) {
    const othersCount = sortedData.slice(5).reduce((sum, app) => sum + app.keystrokeCount, 0)

    if (othersCount > 0) {
      chartData.push({
        applicationName: "Others",
        keystrokeCount: othersCount,
        windowTitles: [],
        percentage: 0, // Will be calculated later
      })
    }
  }

  // Calculate total keystrokes for percentage display
  const totalKeystrokes = applicationData.reduce((sum, app) => sum + app.keystrokeCount, 0)

  // Convert keystroke counts to estimated time (assuming average typing speed)
  const calculateTimeFromKeystrokes = (keystrokeCount: number): string => {
    // Assuming average typing speed of 40 WPM (200 CPM or ~3.3 CPS)
    const seconds = Math.round(keystrokeCount / 3.3);
    
    if (seconds < 60) {
      return `${seconds} sec`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} min`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Pie chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="keystrokeCount"
              nameKey="applicationName"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name, props) => {
                const keystrokeCount = value as number;
                const timeSpent = calculateTimeFromKeystrokes(keystrokeCount);
                return [`${keystrokeCount} keystrokes (${timeSpent})`, name];
              }}
              contentStyle={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-64">
        <table className="w-full text-sm">
          <thead className="bg-muted sticky top-0">
            <tr>
              <th className="p-2 text-left">Application</th>
              <th className="p-2 text-left">Activity Time</th>
              <th className="p-2 text-left">%</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((app, index) => {
              const percentage = ((app.keystrokeCount / totalKeystrokes) * 100).toFixed(1)
              const timeSpent = calculateTimeFromKeystrokes(app.keystrokeCount)

              return (
                <tr key={index} className="border-t border-border">
                  <td className="p-2">{app.applicationName}</td>
                  <td className="p-2">{timeSpent}</td>
                  <td className="p-2">{percentage}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Recent window titles */}
      <div className="md:col-span-2 mt-2">
        <h4 className="text-sm font-medium mb-2">Recent Window Titles</h4>
        <div className="glass-card p-2 rounded-lg max-h-32 overflow-auto">
          <ul className="space-y-1 text-xs">
            {sortedData.slice(0, 3).flatMap((app, appIndex) =>
              app.windowTitles.slice(0, 2).map((title, titleIndex) => (
                <li key={`${appIndex}-${titleIndex}`} className="flex items-start gap-2">
                  <span className="font-medium">{app.applicationName}:</span>
                  <span className="text-muted-foreground truncate">{title}</span>
                </li>
              )),
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}