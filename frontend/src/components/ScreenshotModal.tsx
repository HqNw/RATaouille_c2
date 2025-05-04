"use client"

import { useState, useEffect } from "react"
import { Monitor, Download, RefreshCw } from "lucide-react"
import type { Client } from "@/types/client"
import { AnimatedModal } from "@/components/ui/modal"
import axios from "axios"
import { toast } from "sonner"

interface ScreenshotModalProps {
  isOpen: boolean
  onClose: () => void
  client: Client
}

const API_BASE_URL = "/api"

const ScreenshotModal = ({ isOpen, onClose, client }: ScreenshotModalProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [screenshotUrl, setScreenshotUrl] = useState("")
  const [timestamp, setTimestamp] = useState("")
  // const [screenshotData, setScreenshotData] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      takeScreenshot()
    }
    
    // Cleanup on unmount or close
    return () => {
      if (screenshotUrl.startsWith('blob:')) {
        URL.revokeObjectURL(screenshotUrl)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const takeScreenshot = async () => {
    setIsLoading(true)

    try {
      // Call the API to take a screenshot
      const response = await axios.get(`${API_BASE_URL}/TakeScreenshot/${client.id}`)
      
      // Extract the base64 data and timestamp from the response
      const { data: base64, timestamp: serverTimestamp } = response.data
      
      // Create a blob URL for the image
      const blob = new Blob(
        [Uint8Array.from(atob(base64), c => c.charCodeAt(0))], 
        { type: 'image/png' }
      )
      
      // Set the timestamp from the server
      setTimestamp(new Date(serverTimestamp * 1000).toLocaleString())
      
      const url = URL.createObjectURL(blob)
      
      setScreenshotUrl(url)
      // setScreenshotData(base64)
      setTimestamp(new Date().toLocaleString())
      
    } catch (error) {
      console.error("Error taking screenshot:", error)
      toast.error("Failed to take screenshot. The client might be offline.")
    } finally {
      setIsLoading(false)
    }
  }

  const downloadScreenshot = () => {
    if (!screenshotUrl) return
    
    const link = document.createElement('a')
    link.href = screenshotUrl
    link.download = `screenshot-${client.name}-${new Date().getTime()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Screenshot - ${client.name}`}
      icon={<Monitor className="h-5 w-5 text-primary" />}
      initialWidth={1000}
      initialHeight={700}
      minWidth={600}
      minHeight={400}
    >
      <div className="flex flex-col h-full space-y-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {timestamp ? `Captured: ${timestamp}` : "Taking screenshot..."}
          </div>
          <button
            onClick={takeScreenshot}
            disabled={isLoading}
            className="bg-primary text-primary-foreground px-3 py-1.5 rounded flex items-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full"></div>
                <span>Capturing...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Retake ScreenShot</span>
              </>
            )}
          </button>
        </div>

        <div className="glass-card rounded overflow-hidden flex-grow relative">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : screenshotUrl ? (
            <div className="relative h-full overflow-auto">
              <img
                src={screenshotUrl}
                alt={`Screenshot of ${client.name}`}
                className="w-full h-auto"
              />
              <div className="absolute top-2 right-2">
                <button
                  onClick={downloadScreenshot}
                  className="bg-card/80 backdrop-blur-sm text-foreground p-2 rounded hover:bg-card transition-colors"
                  title="Download screenshot"
                >
                  <Download className="h-5 w-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-full text-muted-foreground">
              Failed to load screenshot
            </div>
          )}
        </div>
      </div>
    </AnimatedModal>
  )
}

export default ScreenshotModal