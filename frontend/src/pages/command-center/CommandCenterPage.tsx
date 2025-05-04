import { AppLayout } from "@/components/layout/AppLayout"

export function CommandCenterPage() {
  return (
    <AppLayout headerTitle="Command Center">
      <div className="glass-card p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Command Center</h2>
        <p>Execute commands across multiple clients simultaneously.</p>
      </div>
    </AppLayout>
  )
}

