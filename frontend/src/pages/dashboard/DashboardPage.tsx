"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { useClientsContext } from "@/contexts/ClientsContext"
import { Laptop, Server, AlertTriangle, Cpu, HardDrive } from "lucide-react"
import { StatusBadge } from "@/components/common/StatusBadge"
import { ResourceBar } from "@/components/common/ResourceBar"
import { formatDate } from "@/utils/format"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Pie, PieChart } from "recharts"
import * as React from "react"

// Updated chart config with direct color values
const statusChartConfig = {
  clients: {
    label: "Clients",
  },
  online: {
    label: "Online",
    color: "#22c55e", // Green color
  },
  offline: {
    label: "Offline",
    color: "#71717a", // Zinc-500 color
  },
}

export function DashboardPage() {
  const { clients } = useClientsContext()
  const [systemHealth, setSystemHealth] = useState({
    avgCpu: 0,
    avgMemory: 0,
    avgDisk: 0,
  })
  const [statusDistribution, setStatusDistribution] = useState({
    online: 0,
    offline: 0,
  })


  // Calculate system health metrics and status distribution
  useEffect(() => {
    if (clients.length > 0) {
      // Save previous counts for trend calculation

      // Calculate averages
      const cpuSum = clients.reduce((sum, client) => sum + client.metadata.cpuUsage, 0)
      const memorySum = clients.reduce((sum, client) => sum + client.metadata.memoryUsage, 0)
      const diskSum = clients.reduce((sum, client) => sum + client.metadata.diskUsage, 0)

      setSystemHealth({
        avgCpu: Number.parseFloat((cpuSum / clients.length).toFixed(1)),
        avgMemory: Number.parseFloat((memorySum / clients.length).toFixed(1)),
        avgDisk: Number.parseFloat((diskSum / clients.length).toFixed(1)),
      })

      // Calculate status distribution
      const online = clients.filter((client) => client.status === "online").length
      const offline = clients.filter((client) => client.status === "offline").length

      setStatusDistribution({
        online,
        offline,
      })

    }
  }, [clients])

  // Get clients with critical resource usage (CPU or memory > 80%)
  const criticalClients = clients.filter((client) => client.metadata.cpuUsage > 80 || client.metadata.memoryUsage > 90)

  // Get top resource consumers
  const topCpuConsumers = [...clients]
    .sort((a, b) => b.metadata.cpuUsage - a.metadata.cpuUsage)
    .slice(0, 3)

  const topMemoryConsumers = [...clients]
    .sort((a, b) => b.metadata.memoryUsage - a.metadata.memoryUsage)
    .slice(0, 3)

  // Updated chart data with explicit colors
  const clientStatusChartData = [
    {
      status: "online",
      clients: statusDistribution.online,
      fill: statusChartConfig.online.color // Using explicit color
    },
    {
      status: "offline",
      clients: statusDistribution.offline,
      fill: statusChartConfig.offline.color // Using explicit color
    },
  ]

  // Calculate total clients for display in the center of chart
  const totalClients = React.useMemo(() => {
    return statusDistribution.online + statusDistribution.offline;
  }, [statusDistribution])

  return (
    <AppLayout headerTitle="Dashboard">
      {/* Welcome Banner - Simplified */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-5 rounded-lg mb-6"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-1">System Overview</h1>
            <p className="text-muted-foreground">
              {criticalClients.length > 0 ?
                `${criticalClients.length} client${criticalClients.length > 1 ? 's' : ''} need${criticalClients.length === 1 ? 's' : ''} attention` :
                'All systems normal'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {criticalClients.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="flex items-center gap-1.5"
                asChild
              >
                <Link to="/clients">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  View Alerts
                </Link>
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Primary Statistics - Original card style */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        <div className="glass-card p-4 rounded-lg flex items-center hover:shadow-md transition-all">
          <div className="p-3 rounded-full bg-primary/10 mr-4">
            <Laptop className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-2xl font-bold">{clients.length}</div>
            <div className="text-xs text-muted-foreground">Total Clients</div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-lg flex items-center hover:shadow-md transition-all">
          <div className="p-3 rounded-full bg-green-500/10 mr-4">
            <Server className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <div className="text-2xl font-bold">{statusDistribution.online}</div>
            <div className="text-xs text-muted-foreground">Online Clients</div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-lg flex items-center hover:shadow-md transition-all">
          <div className="p-3 rounded-full bg-red-500/10 mr-4">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <div className="text-2xl font-bold">{criticalClients.length}</div>
            <div className="text-xs text-muted-foreground">Critical Issues</div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-lg flex items-center hover:shadow-md transition-all">
          <div className="p-3 rounded-full bg-primary/10 mr-4">
            <Cpu className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-2xl font-bold">
              {systemHealth.avgCpu > 70 || systemHealth.avgMemory > 70 ? "Warning" : "Good"}
            </div>
            <div className="flex items-center">
              <div className={`h-2 w-2 rounded-full ${systemHealth.avgCpu > 70 || systemHealth.avgMemory > 70 ? "bg-yellow-500" : "bg-green-500"} mr-2`}></div>
              <span className="text-xs text-muted-foreground">System Health</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Critical Issues Section */}
      {criticalClients.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-6"
        >
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>Critical Issues</CardTitle>
                <CardDescription>Clients that require immediate attention</CardDescription>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link to="/clients">View All</Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">Client</th>
                      <th className="text-left py-2 px-3 font-medium">Status</th>
                      <th className="text-left py-2 px-3 font-medium">CPU</th>
                      <th className="text-left py-2 px-3 font-medium">Memory</th>
                      <th className="text-left py-2 px-3 font-medium hidden md:table-cell">Last Seen</th>
                      <th className="text-right py-2 px-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {criticalClients.slice(0, 3).map((client) => (
                      <tr key={client.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-3">
                          <Link to={`/clients`} className="hover:text-primary transition-colors flex items-center">
                            <div className="h-2 w-2 rounded-full bg-red-500 mr-2 animate-pulse"></div>
                            {client.name}
                          </Link>
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={client.status} />
                        </td>
                        <td className="py-3 px-3">
                          <span className={client.metadata.cpuUsage > 80 ? "text-red-500 font-semibold" : ""}>
                            {client.metadata.cpuUsage}%
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={client.metadata.memoryUsage > 80 ? "text-red-500 font-semibold" : ""}>
                            {client.metadata.memoryUsage}%
                          </span>
                        </td>
                        <td className="py-3 px-3 hidden md:table-cell">{formatDate(client.metadata.lastSeen)}</td>
                        <td className="py-3 px-3 text-right">
                          <Button size="sm" variant="outline">
                            Investigate
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Dashboard Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Client Status Distribution - Fixed Pie Chart */}
          <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
              <CardTitle>Client Status</CardTitle>
              <CardDescription>Active monitoring status</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              <div className="mx-auto aspect-square max-h-[270px]">
                <PieChart width={270} height={270}>
                  <Pie
                    data={clientStatusChartData}
                    dataKey="clients"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    strokeWidth={0}
                    paddingAngle={2}

                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  />
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground text-3xl font-bold"
                  >
                    {totalClients}
                  </text>
                  <text
                    x="50%"
                    y="50%"
                    dy={24}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-muted-foreground text-sm"
                  >
                    Clients
                  </text>
                </PieChart>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
              {/* <div className="flex items-center gap-2 font-medium leading-none">
                {trend.direction === "up" ? (
                  <>
                    Trending up by {trend.percentage}% 
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </>
                ) : (
                  <>
                    Trending down by {trend.percentage}% 
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  </>
                )}
              </div> */}
              <div className="leading-none text-muted-foreground">
                {statusDistribution.online} online, {statusDistribution.offline} offline clients
              </div>
            </CardFooter>
          </Card>

          {/* System Health */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <Cpu className="h-4 w-4 mr-2 text-primary" />
                      Average CPU Usage
                    </span>
                    <span className={systemHealth.avgCpu > 70 ? "text-red-500" : ""}>{systemHealth.avgCpu}%</span>
                  </div>
                  <ResourceBar type="cpu" value={systemHealth.avgCpu} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <Server className="h-4 w-4 mr-2 text-green-500" />
                      Average Memory Usage
                    </span>
                    <span className={systemHealth.avgMemory > 70 ? "text-red-500" : ""}>{systemHealth.avgMemory}%</span>
                  </div>
                  <ResourceBar type="memory" value={systemHealth.avgMemory} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <HardDrive className="h-4 w-4 mr-2 text-secondary" />
                      Average Disk Usage
                    </span>
                    <span className={systemHealth.avgDisk > 70 ? "text-red-500" : ""}>{systemHealth.avgDisk}%</span>
                  </div>
                  <ResourceBar type="disk" value={systemHealth.avgDisk} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resource Usage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top CPU Consumers */}
          <Card>
            <CardHeader>
              <CardTitle>Top CPU Consumers</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {topCpuConsumers.map((client) => (
                  <div key={`cpu-${client.id}`} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{client.name}</span>
                      <span className={client.metadata.cpuUsage > 80 ? "text-red-500 font-semibold" : ""}>
                        {client.metadata.cpuUsage}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${client.metadata.cpuUsage > 90 ? 'bg-red-500' :
                            client.metadata.cpuUsage > 70 ? 'bg-yellow-500' :
                              'bg-green-500'
                          }`}
                        style={{ width: `${client.metadata.cpuUsage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Memory Consumers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Memory Consumers</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {topMemoryConsumers.map((client) => (
                  <div key={`memory-${client.id}`} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{client.name}</span>
                      <span className={client.metadata.memoryUsage > 80 ? "text-red-500 font-semibold" : ""}>
                        {client.metadata.memoryUsage}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${client.metadata.memoryUsage > 90 ? 'bg-red-500' :
                            client.metadata.memoryUsage > 70 ? 'bg-yellow-500' :
                              'bg-green-500'
                          }`}
                        style={{ width: `${client.metadata.memoryUsage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </AppLayout>
  )
}