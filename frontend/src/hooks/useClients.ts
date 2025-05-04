import { useState, useEffect } from 'react'
import axios from 'axios'
import { Client, ClientResponse } from '@/types/client'
import { toast } from 'sonner'
// Define the API base URL 
const API_BASE_URL = '/api'



type Clients = Client[];

export function useClients() {
  const [clients, setClients] = useState([] as Clients)
  const [totalClients, setTotalClients] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchClients = async () => {
    setIsLoading(true)
    try {
      // Get all clients info
      const response = await axios.get(`${API_BASE_URL}/GetAllRatInfo`)
      const clientsData = response.data.RatsMetaData.map((client: ClientResponse)=> ({
        id: client.ratId,
        name: client.name || `Client-${client.ratId}`,
        connected: client.connected, // We'll update this with real online status
        status: client.connected ? 'online' : 'offline',
        avatar: client.avatar || 'default-avatar.png',
        metadata: {
          os: client.os || 'Unknown',
          ip: client.ip || 'Unknown',
          location: client.location || 'Unknown',
          username: client.user || 'Unknown',
          hostname: client.hostname || 'Unknown',
          lastSeen: client.timestamp || new Date().toISOString(),
          cpuUsage: client.cpu_usage || 0,
          memoryUsage: parseInt(((client.memory_usage / client.memory) * 100).toPrecision(4)) || 0,
          diskUsage: parseInt(((client.used_storage / client.storage) * 100).toPrecision(4)) || 0,
          version: client.version || '1.0'
        }
      }))
      console.log("response: ", response.data)
      console.log("client: ", clientsData);

      // // Check online status for each client
      // const clientsWithStatus = await Promise.all(
      //   clientsData.map(async (client: Client) => {
      //     try {
      //       const statusResponse = await axios.get(`${API_BASE_URL}/OnlineStatus/${client.id}`)
      //       if (statusResponse.data.status === true) {
      //         client.connected = true
      //         client.status = 'online'
      //       } else {
      //         client.connected = false
      //         client.status = 'offline'
      //       }

      //       return {
      //         ...client,
      //       }
      //     } catch (error) {
      //       toast.error(`Failed to get status for client ${client.id}:`)
      //       console.error(`Failed to get status for client ${client.id}:`, error)

      //       return {
      //         ...client,
      //         connected: false
      //       }
      //     }
      //   })
      // )

      setClients(clientsData)
      setTotalClients(clientsData.filter((client) => client.connected).length)
    } catch (error) {
      toast.error('Failed to fetch clients')
      console.error('Failed to fetch clients:', error)

    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
    // Set up polling for updates
    const interval = setInterval(fetchClients, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    fetchClients()
  }

  const findClientById = (clientId: string) => {
    return clients.find(client => client.id === clientId)
  }

  return {
    clients,
    totalClients,
    isLoading,
    handleRefresh,
    findClientById
  }
}