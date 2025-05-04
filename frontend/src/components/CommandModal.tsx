"use client"

import { useState } from "react"
import { Terminal, Play, Clipboard } from "lucide-react"
import type { Client } from "@/types/client"
import { AnimatedModal } from "@/components/ui/modal"
import axios from "axios"
import { toast } from "sonner"

interface CommandModalProps {
  isOpen: boolean
  onClose: () => void
  client: Client
}

interface CommandResponse {
  stdout: string
  stderr: string
  return_code: number
}

const API_BASE_URL = "/api"

const CommandModal = ({ isOpen, onClose, client }: CommandModalProps) => {
  const [command, setCommand] = useState("")
  const [output, setOutput] = useState("")
  const [isExecuting, setIsExecuting] = useState(false)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const executeCommand = async (cmd: string) => {
    try {
      setIsExecuting(true)
      setError(null)

      // Call the backend API to execute the command on the client machine
      const response = await axios.post(`${API_BASE_URL}/ExecuteCommand`, {
        ratId: client.id,
        command: cmd,
      })

      // Extract command output from response
      const commandOutput = response.data as CommandResponse

      // Format the output
      let formattedOutput = ""
      if (commandOutput.stdout) {
        formattedOutput += commandOutput.stdout
      }

      if (commandOutput.stderr) {
        formattedOutput += commandOutput.stderr ? "\n" + commandOutput.stderr : ""
      }

      if (commandOutput.return_code !== 0) {
        formattedOutput += formattedOutput
          ? `\nExit code: ${commandOutput.return_code}`
          : `Exit code: ${commandOutput.return_code}`
      }

      setOutput(formattedOutput || "Command executed with no output")
      setCommandHistory((prev) => [...prev, cmd])
      setCommand("")
    } catch (err) {
      console.error("Error executing command:", err)
      toast.error("Failed to execute command. The client might be offline or the command timed out.")
      setError("Failed to execute command. The client might be offline or the command timed out.")
      setOutput("")
    } finally {
      setIsExecuting(false)
    }
  }

  const handleExecute = () => {
    if (!command.trim()) return
    executeCommand(command)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output)
  }

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Execute Command on ${client.name}`}
      icon={<Terminal className="h-5 w-5 text-primary" />}
      initialWidth={600}
      initialHeight={500}
      minWidth={400}
      minHeight={300}
    >
      <div className="flex flex-col h-full space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleExecute()}
            placeholder="Enter command..."
            className="flex-1 glass-input rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isExecuting}
          />
          <button
            onClick={handleExecute}
            disabled={isExecuting || !command.trim()}
            className="bg-primary text-primary-foreground px-4 py-2 rounded flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExecuting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full"></div>
                <span>Executing...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Execute</span>
              </>
            )}
          </button>
        </div>

        {commandHistory.length > 0 && (
          <div className="text-sm">
            <div className="text-muted-foreground mb-1">Command History:</div>
            <div className="flex flex-wrap gap-1">
              {commandHistory.map((cmd, index) => (
                <button
                  key={index}
                  onClick={() => setCommand(cmd)}
                  className="bg-muted text-muted-foreground px-2 py-1 rounded text-xs hover:bg-muted/80"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-destructive/20 border border-destructive text-destructive p-3 rounded text-sm">
            {error}
          </div>
        )}

        {output && (
          <div className="relative flex-grow">
            <div className="absolute top-2 right-2 z-10">
              <button
                onClick={copyToClipboard}
                className="bg-muted text-muted-foreground p-1 rounded hover:bg-muted/80"
                title="Copy to clipboard"
              >
                <Clipboard className="h-4 w-4" />
              </button>
            </div>
            <pre className="bg-background border border-border rounded p-4 overflow-auto h-full text-sm whitespace-pre-wrap">
              {output}
            </pre>
          </div>
        )}
      </div>
    </AnimatedModal>
  )
}

export default CommandModal

