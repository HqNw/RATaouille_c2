export interface ClientMetadata {
  os: string
  ip: string  
  hostname: string
  username: string
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  uptime: string
  lastSeen: number
  location: string
}

export interface Client {
  id: string
  name: string
  metadata: ClientMetadata
  status: "online" | "offline" | "idle"
  connected: boolean
}

export interface ClientResponse {  
  "avatar": string,
  "connected": boolean,
  "name": string,
  "version": string,
  "cpu": number,
  "cpu_usage": number,
  "hostname": string,
  "ip": string,
  "location": string,
  "memory": number,
  "memory_usage": number,
  "os": string,
  "ratId": number,
  "storage": number,
  "timestamp": number,
  "used_storage": number,
  "user": string
}