// src/components/common/StatusBadge.tsx

interface StatusBadgeProps {
  status: string
  showText?: boolean
}

export function StatusBadge({ status, showText = true }: StatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-emerald-500 animate-pulse"
      case "offline":
        return "bg-red-500"
      case "idle":
        return "bg-amber-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <span className={`h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full ${getStatusColor(status)}`}></span>
      {showText && <span className="capitalize hidden xs:inline">{status}</span>}
    </div>
  )
}
