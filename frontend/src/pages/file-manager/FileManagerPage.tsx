import { AppLayout } from "@/components/layout/AppLayout"

export function FileManagerPage() {
  return (
    <AppLayout headerTitle="File Manager">
      <div className="glass-card p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">File Manager</h2>
        <p>Browse and manage files on remote clients.</p>
      </div>
    </AppLayout>
  )
}

