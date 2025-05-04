"use client"

// src/components/dashboard/ClientTableRow.tsx

import { ChevronDown, ChevronRight, Terminal, Monitor, HardDrive, TerminalIcon as Terminal2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/StatusBadge"
import { formatDate } from "@/utils/format"
import type { Client } from "@/types/client"

interface ClientTableRowProps {
  client: Client
  isExpanded: boolean
  onToggleExpanded: () => void
  onExecuteCommand: () => void
  onTakeScreenshot: () => void
  onExploreFiles: () => void
  onOpenShell: () => void
  className?: string
}

export function ClientTableRow({
  client,
  isExpanded,
  onToggleExpanded,
  onExecuteCommand,
  onTakeScreenshot,
  onExploreFiles,
  onOpenShell,
  className = "",
}: ClientTableRowProps) {
  return (
    <tr
      className={`border-t border-border hover:bg-muted/50 ${!client.connected ? "opacity-60" : ""} ${className} transition-all duration-300`}
    >
      <td className="p-2 sm:p-3">
        <Button
          onClick={onToggleExpanded}
          className="p-1.5 sm:p-2 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all hover-scale"
        >
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </td>
      <td className="p-2 sm:p-3">
        <StatusBadge status={client.status} />
      </td>
      <td className="p-2 sm:p-3 font-medium">{client.name}</td>
      <td className="p-2 sm:p-3 hidden sm:table-cell">{client.metadata.ip}</td>
      <td className="p-2 sm:p-3 hidden md:table-cell">{client.metadata.os}</td>
      <td className="p-2 sm:p-3 hidden md:table-cell">{client.metadata.username}</td>
      <td className="p-2 sm:p-3 hidden lg:table-cell">{formatDate(client.metadata.lastSeen)}</td>
      <td className="p-2 sm:p-3">
        {!isExpanded && (
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              onClick={onExecuteCommand}
              disabled={!client.connected}
              className="p-1 sm:p-1.5 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed hover-scale tooltip"
              data-tooltip="Execute Command"
            >
              <Terminal className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              onClick={onTakeScreenshot}
              disabled={!client.connected}
              className="p-1 sm:p-1.5 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed hover-scale tooltip"
              data-tooltip="Take Screenshot"
            >
              <Monitor className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              onClick={onExploreFiles}
              disabled={!client.connected}
              className="p-1 sm:p-1.5 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed hidden sm:block hover-scale tooltip"
              data-tooltip="Explore Files"
            >
              <HardDrive className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              onClick={onOpenShell}
              disabled={!client.connected}
              className="p-1 sm:p-1.5 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed hidden sm:block hover-scale tooltip"
              data-tooltip="Open Shell"
            >
              <Terminal2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        )}
      </td>
    </tr>
  )
}
