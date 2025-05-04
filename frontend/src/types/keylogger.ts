export interface KeylogEntry {
  id: string
  timestamp: number
  keys: string[]
  application: string
  windowTitle: string
}

export interface ApplicationData {
  applicationName: string
  keystrokeCount: number
  windowTitles: string[]
}

// Add a new type for the raw keylogger data from the API
export interface KeyloggerApiResponse {
  Success?: {
    KeylogData: Array<{
      keystrokes: string[]
      statistics: {
        duration: number
        key_frequency: Record<string, number>
        total_keys: number
        window_activity: Record<string, number>
      }
    }>
  }
}

