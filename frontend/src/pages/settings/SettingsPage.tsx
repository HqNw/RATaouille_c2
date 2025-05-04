import { AppLayout } from "@/components/layout/AppLayout"

export function SettingsPage() {
  return (
    <AppLayout headerTitle="Settings">
      <div className="glass-card p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Application Settings</h2>
        <p>Configure application preferences and user settings.</p>
      </div>
    </AppLayout>
  )
}

