// src/components/dashboard/SystemInfoCard.tsx

interface SystemInfoCardProps {
  hostname: string
  location: string
  uptime: string
  ip: string
  os: string
  username: string
  // showMobileInfo?: boolean
}

export function SystemInfoCard({
  hostname,
  location,
  uptime,
  ip,
  os,
  username,
  // showMobileInfo = false
}: SystemInfoCardProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-medium text-xs sm:text-sm">System Information</h3>
      <div className="grid grid-cols-2 gap-1 text-xs sm:text-sm">
        <div className="text-muted-foreground ">User:</div>
        <div>{username}</div>
        <div className="text-muted-foreground ">IP:</div>
        <div>{ip}</div>
        <div className="text-muted-foreground ">OS:</div>
        <div>{os}</div>
        <div className="text-muted-foreground">Hostname:</div>
        <div>{hostname}</div>
        <div className="text-muted-foreground">Location:</div>
        <div>{location}</div>
        <div className="text-muted-foreground">Uptime:</div>
        <div>{uptime}</div>
      </div>
    </div>
  )
}