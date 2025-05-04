import { ThemeProvider } from "@/components/ThemeProvider"
import { BrowserRouter } from "react-router-dom"
import { AppRoutes } from "@/routes"
import { ClientsProvider } from "@/contexts/ClientsContext"
import { Toaster } from "@/components/ui/sonner"
import "./App.css"

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <Toaster
        toastOptions={{
          className: "bg-background text-foreground",
          style: {
            background: "var(--background)",
            color: "var(--foreground)",
          },
        }}
        position="top-right"
      />
      <BrowserRouter>
        <ClientsProvider>
          <div className="app-container">
            <div className="app-background"></div>
            <AppRoutes />
          </div>
        </ClientsProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App

