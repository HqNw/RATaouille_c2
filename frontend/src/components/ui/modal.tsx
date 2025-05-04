"use client"

import type React from "react"

import { type ReactNode, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

interface AnimatedModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  icon?: React.ReactNode
  containerClass?: string
  initialWidth?: number
  initialHeight?: number
  minWidth?: number
  minHeight?: number
}

export function AnimatedModal({
  isOpen,
  onClose,
  children,
  title,
  icon,
  containerClass = "max-w-md",
  initialWidth = 500,
  initialHeight = 400,
  minWidth = 300,
  minHeight = 200,
}: AnimatedModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({
    width: initialWidth,
    height: initialHeight,
  })

  // Resize state
  const [isResizing, setIsResizing] = useState(false)
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0, direction: "" })

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    window.addEventListener("keydown", handleEscapeKey)
    return () => window.removeEventListener("keydown", handleEscapeKey)
  }, [isOpen, onClose])

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  // Handle resize
  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const direction = resizeStartRef.current.direction
      const deltaX = e.clientX - resizeStartRef.current.x
      const deltaY = e.clientY - resizeStartRef.current.y

      let newWidth = resizeStartRef.current.width
      let newHeight = resizeStartRef.current.height

      // Calculate new dimensions based on direction
      if (direction.includes("e")) {
        newWidth = Math.max(resizeStartRef.current.width + deltaX, minWidth)
      } else if (direction.includes("w")) {
        newWidth = Math.max(resizeStartRef.current.width - deltaX, minWidth)
      }

      if (direction.includes("s")) {
        newHeight = Math.max(resizeStartRef.current.height + deltaY, minHeight)
      } else if (direction.includes("n")) {
        newHeight = Math.max(resizeStartRef.current.height - deltaY, minHeight)
      }

      setDimensions({ width: newWidth, height: newHeight })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.body.classList.remove("select-none")
      document.body.style.cursor = "auto"
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing, minWidth, minHeight])

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.preventDefault()
    e.stopPropagation()

    // Store initial values
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: dimensions.width,
      height: dimensions.height,
      direction,
    }

    // Set cursor based on direction
    document.body.style.cursor = `${direction}-resize`
    document.body.classList.add("select-none")

    setIsResizing(true)
  }

  // Calculate content height based on modal dimensions and whether there's a title/footer
  const contentHeight = title
    ? dimensions.height - 120 // 120px accounts for header (64px) and footer (56px)
    : dimensions.height - 64 // 64px accounts for just the footer

  // Performance optimizations:
  // 1. Use "popLayout" mode for AnimatePresence (more direct, less orchestration)
  // 2. Use simpler animation properties with hardware acceleration hints
  return (
    <AnimatePresence mode="popLayout">
      {isOpen && (
        <div className="fixed inset-0 flex justify-center items-center z-50 p-4 will-change-transform">
          {/* Backdrop with simpler animation */}
          <motion.div
            className="fixed inset-0 bg-background/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.12,  
              ease: [0.4, 0, 0.6, 1] // Simple ease-in-out
            }}
          />

          {/* Modal content with optimized animation */}
          <motion.div
            ref={modalRef}
            className="glass-card rounded-lg shadow-lg relative z-10 flex flex-col will-change-transform"
            style={{
              width: dimensions.width,
              height: dimensions.height,
              contain: "content", // Containment hint for browser
              translateZ: 0, // Force GPU acceleration
            }}
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ 
              duration: 0.15,
              ease: [0.4, 0, 0.6, 1] // Simple ease-in-out
            }}
            layoutId="modal" // Helps with smoother transitions
          >
            {/* Header with title and close button */}
            {title && (
              <div className="flex justify-between items-center p-4 border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                  {icon}
                  <h2 className="font-bold">{title}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground rounded-full p-1 hover:bg-muted/20 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Modal body */}
            <div className="flex-grow overflow-auto">
              <div className="p-4 h-full">{children}</div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border flex justify-end bg-card/50 shrink-0">
              <button
                onClick={onClose}
                className="bg-muted text-muted-foreground px-4 py-2 rounded hover:bg-muted/80 transition-colors"
              >
                Close
              </button>
            </div>

            {/* Resize handle - bottom right corner */}
            <div
              className="absolute bottom-0 right-0 w-8 h-8 cursor-se-resize z-50"
              onMouseDown={(e) => handleResizeStart(e, "se")}
            >
              <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-primary" />
            </div>

            {/* Resize handle - bottom edge */}
            <div
              className="absolute bottom-0 left-8 right-8 h-2 cursor-s-resize z-50"
              onMouseDown={(e) => handleResizeStart(e, "s")}
            />

            {/* Resize handle - right edge */}
            <div
              className="absolute right-0 top-8 bottom-8 w-2 cursor-e-resize z-50"
              onMouseDown={(e) => handleResizeStart(e, "e")}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}