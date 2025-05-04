// src/components/dashboard/ExpandedClientInfo.tsx

// Expanded row content when a client row is clicked

import { SystemInfoCard } from "./SystemInfoCard"
import { ResourceUsageCard } from "./ResourceUsageCard"
import { QuickActionsCard } from "./QuickActionsCard"
import type { Client } from "@/types/client"

interface ExpandedClientInfoProps {
  client: Client
  onExecuteCommand: () => void
  onTakeScreenshot: () => void
  onExploreFiles: () => void
  onOpenShell: () => void
}

export function ExpandedClientInfo({ 
  client, 
  onExecuteCommand, 
  onTakeScreenshot, 
  onExploreFiles, 
  onOpenShell 
}: ExpandedClientInfoProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
      <SystemInfoCard 
        hostname={client.metadata.hostname}
        location={client.metadata.location}
        uptime={client.metadata.uptime}
        ip={client.metadata.ip}
        os={client.metadata.os}
        username={client.metadata.username}
        // showMobileInfo={true}
      />

      <ResourceUsageCard
        cpuUsage={client.metadata.cpuUsage}
        memoryUsage={client.metadata.memoryUsage}
        diskUsage={client.metadata.diskUsage}
      />

      <QuickActionsCard
        onExecuteCommand={onExecuteCommand}
        onTakeScreenshot={onTakeScreenshot}
        onExploreFiles={onExploreFiles}
        onOpenShell={onOpenShell}
        isConnected={client.connected}
      />
    </div>
  )
}