"use client"

import { useState } from "react"
import { ClientsList } from "@/pages/clients/ClientsList"
import { ModalManager } from "@/components/modals/ModalManager"
import { useClientsContext } from "@/contexts/ClientsContext"
import { AppLayout } from "@/components/layout/AppLayout"

export function ClientsPage() {
  const { findClientById } = useClientsContext()
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [modals, setModals] = useState({
    command: false,
    fileExplorer: false,
    screenshot: false,
    shell: false,
  })

  const handleOpenModal = (clientId: string, modalType: keyof typeof modals) => {
    setSelectedClient(clientId)
    setModals((prev) => ({ ...prev, [modalType]: true }))
  }

  const handleCloseModals = () => {
    setModals({
      command: false,
      fileExplorer: false,
      screenshot: false,
      shell: false,
    })
  }

  return (
    <AppLayout headerTitle="Clients">
      <ClientsList
        onExecuteCommand={(clientId) => handleOpenModal(clientId, "command")}
        onTakeScreenshot={(clientId) => handleOpenModal(clientId, "screenshot")}
        onExploreFiles={(clientId) => handleOpenModal(clientId, "fileExplorer")}
        onOpenShell={(clientId) => handleOpenModal(clientId, "shell")}
      />

      {selectedClient && (
        <ModalManager client={findClientById(selectedClient) || null} modals={modals} onCloseModals={handleCloseModals} />
      )}
    </AppLayout>
  )
}

