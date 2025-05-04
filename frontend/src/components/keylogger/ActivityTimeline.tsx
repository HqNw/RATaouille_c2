"use client"

import { useState, useEffect } from "react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import type { KeylogEntry } from "@/types/keylogger"

interface ActivityTimelineProps {
  keylogData: KeylogEntry[]
  timeRange: "1h" | "24h" | "7d" | "30d"
}

interface TimelineDataPoint {
  time: string
  count: number
}

export function ActivityTimeline({ keylogData, timeRange }: ActivityTimelineProps) {
  const [timelineData, setTimelineData] = useState<TimelineDataPoint[]>([])

  // Process keylog data to generate timeline
  useEffect(() => {
    if (keylogData.length === 0) {
      setTimelineData([])
      return
    }

    // Determine time intervals based on range
    let interval: number
    let format: (date: Date) => string

    switch (timeRange) {
      case "1h":
        interval = 5 * 60 * 1000 // 5 minutes
        format = (date) => `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`
        break
      case "24h":
        interval = 60 * 60 * 1000 // 1 hour
        format = (date) => `${date.getHours()}:00`
        break
      case "7d":
        interval = 24 * 60 * 60 * 1000 // 1 day
        format = (date) => `${date.getMonth() + 1}/${date.getDate()}`
        break
      case "30d":
        interval = 24 * 60 * 60 * 1000 * 2 // 2 days
        format = (date) => `${date.getMonth() + 1}/${date.getDate()}`
        break
    }

    // Get time range
    const now = new Date().getTime()
    const timeRangeMs = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    }[timeRange]

    const startTime = now - timeRangeMs

    // Create time buckets
    const buckets: Record<number, number> = {}
    const bucketCount = Math.ceil(timeRangeMs / interval)

    for (let i = 0; i < bucketCount; i++) {
      const bucketTime = startTime + i * interval
      buckets[bucketTime] = 0
    }

    // Count keystrokes in each bucket
    keylogData.forEach((entry) => {
      const entryTime = entry.timestamp
      if (entryTime >= startTime && entryTime <= now) {
        const bucketIndex = Math.floor((entryTime - startTime) / interval)
        const bucketTime = startTime + bucketIndex * interval
        buckets[bucketTime] = (buckets[bucketTime] || 0) + entry.keys.length
      }
    })

    // Convert to array for chart
    const data = Object.entries(buckets).map(([time, count]) => ({
      time: format(new Date(Number.parseInt(time))),
      count,
    }))

    setTimelineData(data)
  }, [keylogData, timeRange])

  if (keylogData.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No keystroke data available</div>
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={timelineData}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" tick={{ fill: "var(--foreground)" }} />
          <YAxis
            tick={{ fill: "var(--foreground)" }}
            label={{
              value: "Keystrokes",
              angle: -90,
              position: "insideLeft",
              style: { fill: "var(--foreground)" },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
            formatter={(value) => [`${value} keystrokes`, "Activity"]}
          />
          <Area type="monotone" dataKey="count" stroke="var(--primary)" fillOpacity={1} fill="url(#colorCount)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

