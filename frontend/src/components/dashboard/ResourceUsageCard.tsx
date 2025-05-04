// src/components/dashboard/ResourceUsageCard.tsx

import { ResourceBar } from "@/components/common/ResourceBar"

interface ResourceUsageCardProps {
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
}

export function ResourceUsageCard({ cpuUsage, memoryUsage, diskUsage }: ResourceUsageCardProps) {
  return (
    <div className="space-y-2 sm:space-y-3">
      <h3 className="font-medium text-xs sm:text-sm">Resource Usage</h3>
      <div className="space-y-1.5 sm:space-y-2">
        <ResourceBar type="cpu" value={cpuUsage} />
        <ResourceBar type="memory" value={memoryUsage} />
        <ResourceBar type="disk" value={diskUsage} />
      </div>
    </div>
  )
}