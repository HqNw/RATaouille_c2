// src/components/dashboard/QuickActionsCard.tsx

import { Terminal, Monitor, HardDrive, TerminalIcon as Terminal2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface QuickActionsCardProps {
  onExecuteCommand: () => void
  onTakeScreenshot: () => void
  onExploreFiles: () => void
  onOpenShell: () => void
  isConnected: boolean
}

export function QuickActionsCard({ 
  onExecuteCommand, 
  onTakeScreenshot, 
  onExploreFiles, 
  onOpenShell, 
  isConnected 
}: QuickActionsCardProps) {
  return (
    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
      <h3 className="font-medium text-xs sm:text-sm">Quick Actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
        <Button
          onClick={onExecuteCommand}
          disabled={!isConnected}
          className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2 bg-secondary text-secondary-foreground p-1.5 sm:p-2 rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
        >
          <Terminal className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>Execute Command</span>
        </Button>
        <Button
          onClick={onTakeScreenshot}
          disabled={!isConnected}
          className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2 bg-secondary text-secondary-foreground p-1.5 sm:p-2 rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
        >
          <Monitor className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>Screenshot</span>
        </Button>
        <Button
          onClick={onExploreFiles}
          disabled={!isConnected}
          className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2 bg-secondary text-secondary-foreground p-1.5 sm:p-2 rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
        >
          <HardDrive className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>Explore Files</span>
        </Button>
        <Button
          onClick={onOpenShell}
          disabled={!isConnected}
          className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2 bg-secondary text-secondary-foreground p-1.5 sm:p-2 rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
        >
          <Terminal2 className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>Shell</span>
        </Button>
      </div>
    </div>
  )
}