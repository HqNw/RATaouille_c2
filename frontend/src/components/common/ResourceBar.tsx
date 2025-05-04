"use client"

import { Cpu, MemoryStick, Database } from "lucide-react"
import { useMemo } from "react"

interface ResourceBarProps {
  type: "cpu" | "memory" | "disk"
  value: number
}

export function ResourceBar({ type, value }: ResourceBarProps) {
  const getIcon = () => {
    switch (type) {
      case "cpu":
        return <Cpu className="h-3 w-3" />
      case "memory":
        return <MemoryStick className="h-3 w-3" />
      case "disk":
        return <Database className="h-3 w-3" />
    }
  }

  const getLabel = () => {
    switch (type) {
      case "cpu":
        return "CPU"
      case "memory":
        return "Memory"
      case "disk":
        return "Disk"
    }
  }

  // Dynamic gradient from blue (0%) to yellow (50%) to red (100%)
  const gradientStyle = useMemo(() => {
    // Calculate color based on value (0-100)
    let r, g, b;
    
    if (value < 50) {
      // Transition from blue to yellow (blue decreases, green increases)
      const factor = value / 50;
      r = Math.floor(0 + factor * 255);
      g = Math.floor(0 + factor * 255);
      b = Math.floor(255 - factor * 255);
    } else {
      // Transition from yellow to red (green decreases)
      const factor = (value - 50) / 50;
      r = 255;
      g = Math.floor(255 - factor * 255);
      b = 0;
    }

    // Create gradient with darker and lighter versions of the main color
    const mainColor = `rgb(${r}, ${g}, ${b})`;
    const darkerColor = `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`;
    const lighterColor = `rgb(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)})`;

    return {
      background: `linear-gradient(90deg, ${darkerColor} 0%, ${mainColor} 50%, ${lighterColor} 100%)`,
    };
  }, [value]);

  // Get text color based on value
  const getValueTextColor = () => {
    if (value > 90) return "text-red-400 font-semibold"
    if (value > 75) return "text-amber-400"
    if (value > 50) return "text-yellow-400"
    return "text-blue-400"
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="flex items-center gap-1">
          {getIcon()} {getLabel()}
        </span>
        <span className={getValueTextColor()}>{value}%</span>
      </div>
      <div className="w-full bg-muted/40 rounded-full h-1.5 sm:h-2.5 overflow-hidden backdrop-blur-sm p-0.5">
        <div
          className="h-full rounded-full transition-all duration-500 shadow-inner shadow-white/10"
          style={{
            width: `${value}%`,
            ...gradientStyle,
          }}
        ></div>
      </div>
    </div>
  )
}