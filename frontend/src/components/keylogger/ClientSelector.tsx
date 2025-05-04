"use client"

import type { Client } from "@/types/client"

interface ClientSelectorProps {
  clients: Client[]
  selectedClientId: string | null
  onClientChange: (clientId: string) => void
}

export function ClientSelector({ clients, selectedClientId, onClientChange }: ClientSelectorProps) {
  return (
    <div className="flex items-center">
      <select
        className="glass-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        value={selectedClientId || ""}
        onChange={(e) => onClientChange(e.target.value)}
      >
        <option value="">Select a client</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name} ({client.metadata.ip})
          </option>
        ))}
      </select>
    </div>
  )
}

