"use client"

import { useState } from "react"
import { Copy } from "lucide-react"
import { toast } from "sonner"

interface KeystrokeLogProps {
  keystrokes: string[]
}

export function KeystrokeLog({ keystrokes }: KeystrokeLogProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const text = keystrokes.join("\n")
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Keystrokes copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  if (keystrokes.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No keystroke data available</div>
  }

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md bg-secondary/50 hover:bg-secondary/80 transition-colors"
          title="Copy to clipboard"
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>

      {/* Fixed height container with standard overflow behavior */}
      <div className="h-80 overflow-y-auto border border-border/30 rounded-lg bg-background/20 backdrop-blur-sm">
        <div className="p-4">
          {keystrokes.map((keystroke, index) => {
            // Extract window information if available
            const windowMatch = keystroke.match(/$$in (.+?)$$/)
            const windowName = windowMatch ? windowMatch[1] : null

            // Format the keystroke text
            let keystrokeText = keystroke
            if (windowName) {
              keystrokeText = keystroke.replace(` (in ${windowName})`, "")
            }

            return (
              <div key={index} className="py-0.5 border-b border-border/30 last:border-0">
                <span className="text-primary-foreground/90">{index + 1}.</span>{" "}
                <span className="text-foreground">{keystrokeText}</span>
                {windowName && (
                  <span className="text-muted-foreground text-xs ml-2">
                    in <span className="italic">{windowName}</span>
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

