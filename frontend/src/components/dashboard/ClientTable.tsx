"use client"

import { ClientTableRow } from "@/components/dashboard/ClientTableRow"
import { ExpandedClientInfo } from "@/components/dashboard/ExpandedClientInfo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useClientsContext } from "@/contexts/ClientsContext"
import type { Client } from "@/types/client"
import { AnimatePresence, motion } from "framer-motion"
import { Laptop, RefreshCw, Search, Filter, X, HelpCircle } from "lucide-react"
import { Fragment, useMemo, useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ClientTableProps {
  clients: Client[]
  expandedRows: Record<string, boolean>
  onToggleRow: (clientId: string) => void
  onExecuteCommand: (clientId: string) => void
  onTakeScreenshot: (clientId: string) => void
  onExploreFiles: (clientId: string) => void
  onOpenShell: (clientId: string) => void
  isLoading: boolean
}

export function ClientTable({
  clients,
  expandedRows,
  onToggleRow,
  onExecuteCommand,
  onTakeScreenshot,
  onExploreFiles,
  onOpenShell,
  isLoading,
}: ClientTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [openPopover, setOpenPopover] = useState<"filter" | "help" | null>(null)
  const { totalClients, handleRefresh } = useClientsContext()

  // Filter clients based on search term and filters
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim() && !statusFilter) return clients

    let filtered = clients

    // Apply status filter if set
    if (statusFilter) {
      filtered = filtered.filter((client) => client.status === statusFilter)
    }

    // Apply search term if set
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(term) ||
          client.metadata.ip.toLowerCase().includes(term) ||
          client.metadata.os.toLowerCase().includes(term) ||
          client.metadata.username.toLowerCase().includes(term) ||
          client.metadata.hostname.toLowerCase().includes(term),
      )
    }

    return filtered
  }, [clients, searchTerm, statusFilter])

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter(null)
    setOpenPopover(null)
    toast.success("Filters cleared")
  }

  if (isLoading && clients.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner"></div>
        <span className="ml-3 text-muted-foreground">Loading clients...</span>
      </div>
    )
  }

  return (
    <div className="space-y-3 animate-fadeIn">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-3">
        {/* Search and filter section */}
        <div className="w-full sm:w-auto animate-slideInLeft animate-delay-100">
          <div className="flex items-center gap-2">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                <Search className="h-4 w-4" />
              </div>
              <Input
                type="text"
                className="glass-input-1 pl-10 pr-4 py-2 rounded-md w-full sm:max-w-xs text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter Button with Popover */}
            <Popover open={openPopover === "filter"} onOpenChange={(open) => {
              if (open) {
                setOpenPopover("filter")
              } else {
                setOpenPopover(null)
              }
            }}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={openPopover === "filter" ? "bg-primary/20" : ""}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3 glass-card shadow-lg" align="start">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium">Filter Options</h3>
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-7 px-2">
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStatusFilter("online")}
                    className={statusFilter === "online" ? "bg-primary/20" : ""}
                  >
                    <span className="status-indicator online mr-1.5"></span>
                    Online
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStatusFilter("offline")}
                    className={statusFilter === "offline" ? "bg-primary/20" : ""}
                  >
                    <span className="status-indicator offline mr-1.5"></span>
                    Offline
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStatusFilter("idle")}
                    className={statusFilter === "idle" ? "bg-primary/20" : ""}
                  >
                    <span className="status-indicator idle mr-1.5"></span>
                    Idle
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Help Button with Popover */}
            <Popover open={openPopover === "help"} onOpenChange={(open) => {
              if (open) {
                setOpenPopover("help")
              } else {
                setOpenPopover(null)
              }
            }}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={openPopover === "help" ? "bg-primary/20" : ""}
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3 glass-card shadow-lg" align="start">
                <h3 className="text-sm font-medium mb-2">Quick Help</h3>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Click on a row to expand client details</li>
                  <li>• Use search to find clients by name, IP, OS, etc.</li>
                  <li>• Filter clients by their online status</li>
                  <li>• Click action buttons to interact with clients</li>
                </ul>
              </PopoverContent>
            </Popover>

            {/* Fixed position for loading spinner */}
            <div className="w-10 h-10 flex justify-center items-center">
              {isLoading && <div className="loading-spinner"></div>}
            </div>
          </div>
        </div>

        <h2 className="text-lg sm:text-xl font-semibold mb-3 hidden sm:flex sm:mb-4 animate-slideInUp animate-delay-200">
          Clients
        </h2>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full sm:w-auto animate-slideInRight animate-delay-300">
          <div className="glass-card rounded-lg px-3 py-1.5 flex items-center gap-2 hidden sm:flex hover-scale">
            <Laptop className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span className="text-sm sm:text-base font-medium">Clients:</span>
            <span className="text-base sm:text-lg font-bold">{totalClients}</span>
          </div>
          <Button
            onClick={handleRefresh}
            className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-all text-sm sm:text-base hover-scale"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Applied filters summary */}
      {(searchTerm || statusFilter) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 animate-fadeIn">
          <span>Filters applied:</span>
          {searchTerm && (
            <span className="bg-secondary/50 px-2 py-1 rounded-full text-xs flex items-center gap-1">
              Search: {searchTerm}
              <button onClick={() => setSearchTerm("")}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {statusFilter && (
            <span className="bg-secondary/50 px-2 py-1 rounded-full text-xs flex items-center gap-1">
              Status: {statusFilter}
              <button onClick={() => setStatusFilter(null)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <button onClick={clearFilters} className="text-xs text-primary hover:underline">
            Clear all
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg glass-card animate-slideInUp animate-delay-400">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 sm:p-3 text-left"></th>
              <th className="p-2 sm:p-3 text-left">Status</th>
              <th className="p-2 sm:p-3 text-left">Name</th>
              <th className="p-2 sm:p-3 text-left hidden sm:table-cell">IP Address</th>
              <th className="p-2 sm:p-3 text-left hidden md:table-cell">OS</th>
              <th className="p-2 sm:p-3 text-left hidden md:table-cell">Username</th>
              <th className="p-2 sm:p-3 text-left hidden lg:table-cell">Last Seen</th>
              <th className="p-2 sm:p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <Fragment key={client.id}>
                  <ClientTableRow
                    client={client}
                    isExpanded={expandedRows[client.id] || false}
                    onToggleExpanded={() => onToggleRow(client.id)}
                    onExecuteCommand={() => onExecuteCommand(client.id)}
                    onTakeScreenshot={() => onTakeScreenshot(client.id)}
                    onExploreFiles={() => onExploreFiles(client.id)}
                    onOpenShell={() => onOpenShell(client.id)}
                    className="transition-all duration-300"
                  />

                  {/* Animated Expanded Client Info */}
                  <AnimatePresence>
                    {expandedRows[client.id] && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{
                          opacity: 1,
                          height: "auto",
                          transition: {
                            height: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2, delay: 0.1 },
                          },
                        }}
                        exit={{
                          opacity: 0,
                          height: 0,
                          transition: {
                            height: { duration: 0.2 },
                            opacity: { duration: 0.2 },
                          },
                        }}
                        className="border-t border-border bg-card/50 overflow-hidden"
                      >
                        <td colSpan={8} className="p-0">
                          <motion.div
                            initial={{ y: -20 }}
                            animate={{
                              y: 0,
                              transition: {
                                type: "spring",
                                stiffness: 500,
                                damping: 30,
                                delay: 0.1,
                              },
                            }}
                            className="p-3 sm:p-4"
                          >
                            <ExpandedClientInfo
                              client={client}
                              onExecuteCommand={() => onExecuteCommand(client.id)}
                              onTakeScreenshot={() => onTakeScreenshot(client.id)}
                              onExploreFiles={() => onExploreFiles(client.id)}
                              onOpenShell={() => onOpenShell(client.id)}
                            />
                          </motion.div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="p-4 text-center text-muted-foreground">
                  {searchTerm || statusFilter ? (
                    <>
                      No clients found matching your filters
                      <button onClick={clearFilters} className="ml-2 text-primary hover:underline">
                        Clear filters
                      </button>
                    </>
                  ) : (
                    "No clients found"
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Results summary */}
      <div className="text-xs text-muted-foreground animate-fadeIn animate-delay-500">
        {(searchTerm || statusFilter) && filteredClients.length > 0 && (
          <>
            Showing {filteredClients.length} of {clients.length} clients
          </>
        )}
      </div>
    </div>
  )
}