"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { TerminalIcon as Terminal2 } from "lucide-react"
import type { Client } from "@/types/client"
import { AnimatedModal } from "@/components/ui/modal"

interface ShellModalProps {
  isOpen: boolean
  onClose: () => void
  client: Client
}

const ShellModal = ({ isOpen, onClose, client }: ShellModalProps) => {
  const [input, setInput] = useState("")
  const [history, setHistory] = useState<string[]>([
    `Connected to ${client.name} (${client.metadata.ip})`,
    `${client.metadata.os} - ${client.metadata.hostname}`,
    'Type "help" for available commands',
    "",
    `${client.metadata.username}@${client.metadata.hostname}:~$ `,
  ])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [history])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCommand()
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setInput(commandHistory[commandHistory.length - 1 - newIndex])
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(commandHistory[commandHistory.length - 1 - newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setInput("")
      }
    }
  }

  const handleCommand = () => {
    if (!input.trim()) return

    const newHistory = [...history, input]
    setCommandHistory((prev) => [input, ...prev])
    setHistoryIndex(-1)

    // Process command
    let output: string[] = []
    const cmd = input.trim().toLowerCase()

    if (cmd === "help") {
      output = [
        "Available commands:",
        "  help - Show this help message",
        "  clear - Clear the terminal",
        "  exit - Close the shell",
        "  whoami - Display current user",
        "  hostname - Display hostname",
        "  ls - List files",
        "  pwd - Print working directory",
        "  date - Show current date and time",
        "  echo [text] - Display text",
      ]
    } else if (cmd === "clear") {
      setHistory([])
      setInput("")
      return
    } else if (cmd === "exit") {
      onClose()
      return
    } else if (cmd === "whoami") {
      output = [client.metadata.username]
    } else if (cmd === "hostname") {
      output = [client.metadata.hostname]
    } else if (cmd === "ls") {
      output = ["Documents  Downloads  Pictures  Videos  config.sys  system.dat"]
    } else if (cmd === "pwd") {
      output = ["/home/" + client.metadata.username]
    } else if (cmd === "date") {
      output = [new Date().toString()]
    } else if (cmd.startsWith("echo ")) {
      output = [cmd.substring(5)]
    } else {
      output = [`Command not found: ${cmd}`]
    }

    setHistory([...newHistory, ...output, "", `${client.metadata.username}@${client.metadata.hostname}:~$ `])
    setInput("")
  }

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Shell - ${client.name}`}
      icon={<Terminal2 className="h-5 w-5 text-primary" />}
      initialWidth={800}
      initialHeight={500}
      minWidth={400}
      minHeight={300}
    >
      <div className="h-full flex flex-col">
        <div
          ref={terminalRef}
          className="glass-card rounded p-4 font-mono text-sm flex-grow overflow-y-auto whitespace-pre-wrap"
        >
          {history.map((line, index) => (
            <div key={index} className={line.includes("$ ") ? "flex" : ""}>
              <span>{line}</span>
              {line.includes("$ ") && index === history.length - 1 && (
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent border-none outline-none focus:ring-0"
                  autoFocus
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </AnimatedModal>
  )
}

export default ShellModal

