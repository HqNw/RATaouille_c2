import {
  Terminal,
  Monitor,
  HardDrive,
  TerminalIcon as Terminal2,
  Info,
  Laptop,
  Clock,
  Cpu,
  MemoryStick,
  Database,
} from "lucide-react"
import type { Client } from "@/types/client"
import { Button } from "@/components/ui/button"

interface ClientCardProps {
  client: Client
  onExecuteCommand: () => void
  onTakeScreenshot: () => void
  onExploreFiles: () => void
  onOpenShell: () => void
}

const ClientCard = ({ client, onExecuteCommand, onTakeScreenshot, onExploreFiles, onOpenShell }: ClientCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "offline":
        return "bg-red-500"
      case "idle":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString()
    } catch (e) {
      console.error("Error parsing date:", e);
      return "Unknown"
    }
  }

  return (
    <div className={`glass-card rounded-lg overflow-hidden ${!client.connected ? "opacity-60" : ""}`}>
      <div className="p-4 border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Laptop className="h-5 w-5 text-primary" />
          <h3 className="font-bold">{client.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded-full ${getStatusColor(client.status)}`}></span>
          <span className="text-sm capitalize">{client.status}</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">IP:</span>
          </div>
          <div>{client.ip}</div>

          <div className="flex items-center gap-1">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">OS:</span>
          </div>
          <div>{client.metadata.os}</div>

          <div className="flex items-center gap-1">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Hostname:</span>
          </div>
          <div>{client.metadata.hostname}</div>

          <div className="flex items-center gap-1">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Username:</span>
          </div>
          <div>{client.metadata.username}</div>

          <div className="flex items-center gap-1">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Location:</span>
          </div>
          <div>{client.metadata.location}</div>

          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Uptime:</span>
          </div>
          <div>{client.metadata.uptime}</div>

          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Last Seen:</span>
          </div>
          <div>{formatDate(client.metadata.lastSeen)}</div>
        </div>

        <div className="space-y-2">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1">
                <Cpu className="h-3 w-3" /> CPU
              </span>
              <span>{client.metadata.cpuUsage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: `${client.metadata.cpuUsage}%` }}></div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1">
                <MemoryStick className="h-3 w-3" /> Memory
              </span>
              <span>{client.metadata.memoryUsage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: `${client.metadata.memoryUsage}%` }}></div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1">
                <Database className="h-3 w-3" /> Disk
              </span>
              <span>{client.metadata.diskUsage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: `${client.metadata.diskUsage}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-card border-t border-border grid grid-cols-2 gap-2">
        <Button
          onClick={onExecuteCommand}
          disabled={!client.connected}
          variant="secondary"
          size="sm"
          className="w-full flex items-center justify-center gap-1"
        >
          <Terminal className="h-4 w-4" />
          <span>Execute Command</span>
        </Button>

        <Button
          onClick={onTakeScreenshot}
          disabled={!client.connected}
          variant="secondary"
          size="sm"
          className="w-full flex items-center justify-center gap-1"
        >
          <Monitor className="h-4 w-4" />
          <span>Take Screenshot</span>
        </Button>

        <Button
          onClick={onExploreFiles}
          disabled={!client.connected}
          variant="secondary"
          size="sm"
          className="w-full flex items-center justify-center gap-1"
        >
          <HardDrive className="h-4 w-4" />
          <span>Explore Files</span>
        </Button>

        <Button
          onClick={onOpenShell}
          disabled={!client.connected}
          variant="secondary"
          size="sm"
          className="w-full flex items-center justify-center gap-1"
        >
          <Terminal2 className="h-4 w-4" />
          <span>Open Shell</span>
        </Button>
      </div>
    </div>
  )
}

export default ClientCard

