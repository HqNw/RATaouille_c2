"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useClients } from "@/hooks/useClients"
import type { Client } from "@/types/client"

interface ClientsContextType {
  clients: Client[]
  totalClients: number
  isLoading: boolean
  handleRefresh: () => void
  findClientById: (id: string) => Client | undefined
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined)

export function ClientsProvider({ children }: { children: ReactNode }) {
  const clientsData = useClients()

  return <ClientsContext.Provider value={clientsData}>{children}</ClientsContext.Provider>
}

export function useClientsContext() {
  const context = useContext(ClientsContext)

  if (context === undefined) {
    throw new Error("useClientsContext must be used within a ClientsProvider")
  }

  return context
}

