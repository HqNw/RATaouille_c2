"use client"

import { useState } from "react"
import { ClientTable } from "@/components/dashboard/ClientTable"
import { useClientsContext } from "@/contexts/ClientsContext"

interface ClientsListProps {
  onExecuteCommand: (clientId: string) => void
  onTakeScreenshot: (clientId: string) => void
  onExploreFiles: (clientId: string) => void
  onOpenShell: (clientId: string) => void
}

export function ClientsList({ onExecuteCommand, onTakeScreenshot, onExploreFiles, onOpenShell }: ClientsListProps) {
  const { clients, isLoading } = useClientsContext()
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  const toggleRowExpanded = (clientId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [clientId]: !prev[clientId],
    }))
  }

  return (
    <ClientTable
      clients={clients}
      expandedRows={expandedRows}
      onToggleRow={toggleRowExpanded}
      onExecuteCommand={onExecuteCommand}
      onTakeScreenshot={onTakeScreenshot}
      onExploreFiles={onExploreFiles}
      onOpenShell={onOpenShell}
      isLoading={isLoading}
    />
  )
}

