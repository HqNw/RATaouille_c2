"use client"

import { useState, useEffect } from "react"
import type { KeylogEntry } from "@/types/keylogger"

interface KeyboardHeatmapProps {
  keylogData: KeylogEntry[]
}

export function KeyboardHeatmap({ keylogData }: KeyboardHeatmapProps) {
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({})
  console.log("Keylog data:", keylogData) // For debugging
  
  // Process keylog data to generate heatmap
  useEffect(() => {
    if (keylogData.length > 0) {
      const keyFrequency: Record<string, number> = {}

      keylogData.forEach((entry) => {
        if (!entry.keys) return

        if (Array.isArray(entry.keys)) {
          entry.keys.forEach((key) => {
            if (typeof key === "string") {
              // Handle single characters
              const processedKey = key.toLowerCase()
              if (processedKey) {
                keyFrequency[processedKey] = (keyFrequency[processedKey] || 0) + 1
              }
            }
          })
        } else if (typeof entry.keys === "string") {
          // Handle if keys is a string (shouldn't happen, but just in case)
          const processedKey = entry.keys.toLowerCase()
          keyFrequency[processedKey] = (keyFrequency[processedKey] || 0) + 1
        }
      })

      console.log("Heatmap data:", keyFrequency) // For debugging
      setHeatmapData(keyFrequency)
    } else {
      setHeatmapData({})
    }
  }, [keylogData])
  // Find the maximum frequency for color scaling
  const maxFrequency = Math.max(...Object.values(heatmapData), 1)

  // Keyboard layout
  const keyboardRows = [
    ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Backspace"],
    ["Tab", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"],
    ["Caps", "a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "Enter"],
    ["Shift", "z", "x", "c", "v", "b", "n", "m", ",", ".", "/", "Shift"],
    ["Ctrl", "Win", "Alt", "Space", "Alt", "Win", "Menu", "Ctrl"],
  ]

  // Get color intensity based on frequency - HSL approach
  const getKeyColor = (key: string) => {
    // Get frequency for this key (case insensitive)
    const frequency = heatmapData[key.toLowerCase()] || 0

    // No keystrokes for this key
    if (frequency === 0) {
      return {
        style: {},
        className: "",
      }
    }

    // Calculate intensity (between 0 and 1)
    let intensity

    // Use linear scaling if max frequency is low
    if (maxFrequency <= 10) {
      intensity = Math.max(0.1, Math.min(frequency / maxFrequency, 1))
    }
    // Use logarithmic scaling if max frequency is high
    else {
      const logMax = Math.log(maxFrequency + 1)
      const logFreq = Math.log(frequency + 1)
      intensity = Math.max(0.1, Math.min(logFreq / logMax, 1))
    }

    // Using HSL colors: hue goes from 210 (blue) to 0 (red) as intensity increases
    const hue = Math.round(210 - intensity * 210)

    // Saturation increases with intensity
    const saturation = Math.round(70 + intensity * 30)

    // Lightness starts higher and gets a bit darker with intensity
    const lightness = Math.round(70 - intensity * 30)

    // Text color based on lightness (dark text on light bg, light text on dark bg)
    const textColor = lightness > 50 ? "text-gray-900" : "text-white"

    return {
      style: {
        backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
      },
      className: textColor,
    }
  }

  // Get key width based on key name
  const getKeyWidth = (key: string) => {
    switch (key) {
      case "Backspace":
        return "col-span-2"
      case "Tab":
        return "w-12"
      case "Caps":
        return "w-14"
      case "Enter":
        return "w-14"
      case "Shift":
        return "w-16"
      case "Ctrl":
      case "Alt":
        return "w-10"
      case "Win":
        return "w-10"
      case "Space":
        return "w-32"
      case "Menu":
        return "w-10"
      default:
        return "w-8"
    }
  }

  return (
    <div className="keyboard-heatmap">
      {keylogData.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No keystroke data available</div>
      ) : (
        <div className="space-y-1 max-w-3xl mx-auto">
          {keyboardRows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-1">
              {row.map((key, keyIndex) => {
                const frequency = heatmapData[key.toLowerCase()] || 0
                const { style, className } = getKeyColor(key)
                return (
                  <div
                    key={`${rowIndex}-${keyIndex}`}
                    className={`
                      ${getKeyWidth(key)} h-8 sm:h-10 rounded flex items-center justify-center 
                      text-xs sm:text-sm font-medium ${className} 
                      transition-colors duration-200
                    `}
                    style={style}
                    title={`${key}: ${frequency} keystrokes`}
                  >
                    {key}
                  </div>
                )
              })}
            </div>
          ))}

          {/* HSL color legend */}
          <div className="mt-6 flex justify-center items-center gap-2">
            <div className="text-xs text-muted-foreground">Low</div>
            <div className="flex gap-1">
              {Array.from({ length: 6 }, (_, i) => {
                const intensity = i / 5
                const hue = Math.round(210 - intensity * 210)
                const saturation = Math.round(70 + intensity * 30)
                const lightness = Math.round(70 - intensity * 30)

                return (
                  <div
                    key={i}
                    className="w-6 h-4 rounded"
                    style={{ backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)` }}
                  ></div>
                )
              })}
            </div>
            <div className="text-xs text-muted-foreground">High</div>
          </div>
        </div>
      )}
    </div>
  )
}
