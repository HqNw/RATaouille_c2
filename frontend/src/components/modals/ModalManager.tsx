// src/components/modals/ModalManager.tsx

import CommandModal from "@/components/CommandModal"
import FileExplorerModal from "@/components/FileExplorerModal"
import ScreenshotModal from "@/components/ScreenshotModal"
import ShellModal from "@/components/ShellModal"
import type { Client } from "@/types/client"

interface ModalManagerProps {
  client: Client | null
  modals: {
    command: boolean
    fileExplorer: boolean
    screenshot: boolean
    shell: boolean
  }
  onCloseModals: () => void
}

export function ModalManager({ client, modals, onCloseModals }: ModalManagerProps) {
  if (!client) return null

  const handleCloseCommand = () => {
    onCloseModals()
  }

  const handleCloseFileExplorer = () => {
    onCloseModals()
  }

  const handleCloseScreenshot = () => {
    onCloseModals()
  }

  const handleCloseShell = () => {
    onCloseModals()
  }

  return (
    <>
      <CommandModal
        isOpen={modals.command}
        onClose={handleCloseCommand}
        client={client}
      />

      <FileExplorerModal
        isOpen={modals.fileExplorer}
        onClose={handleCloseFileExplorer}
        client={client}
      />

      <ScreenshotModal
        isOpen={modals.screenshot}
        onClose={handleCloseScreenshot}
        client={client}
      />

      <ShellModal 
        isOpen={modals.shell} 
        onClose={handleCloseShell} 
        client={client} 
      />
    </>
  )
}