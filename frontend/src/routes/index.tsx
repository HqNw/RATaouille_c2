import { Route, Routes } from "react-router-dom"
import { ClientsPage } from "@/pages/clients/ClientsPage"
import { DashboardPage } from "@/pages/dashboard/DashboardPage"
import { KeyloggerPage } from "@/pages/keylogger/KeyloggerPage"
// import { CommandCenterPage } from "@/pages/command-center/CommandCenterPage"
// import { FileManagerPage } from "@/pages/file-manager/FileManagerPage"
// import { ServerConfigPage } from "@/pages/server-config/ServerConfigPage"
// import { SecurityPage } from "@/pages/security/SecurityPage"
import { SettingsPage } from "@/pages/settings/SettingsPage"

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/clients" element={<ClientsPage />} />
      <Route path="/keylogger" element={<KeyloggerPage />} />
      {/* <Route path="/command-center" element={<CommandCenterPage />} />
      <Route path="/file-manager" element={<FileManagerPage />} /> */}
      {/* <Route path="/server-config" element={<ServerConfigPage />} /> */}
      {/* <Route path="/security" element={<SecurityPage />} /> */}
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  )
}

