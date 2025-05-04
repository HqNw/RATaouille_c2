"use client"

import { type ReactNode, useState } from "react"
import { Header } from "@/components/layout/Header"
import { Sidebar } from "@/components/layout/Sidebar"
import { navigationItems } from "@/config/navigation"

interface AppLayoutProps {
  children: ReactNode
  headerTitle?: string
}

export function AppLayout({ children, headerTitle = "Dashboard" }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        items={navigationItems}
      />

      <div className="flex flex-col flex-1 w-full lg:pl-64">
        <Header title={headerTitle} onToggleMobileMenu={toggleMobileMenu} />
        <main className="flex-1 overflow-y-auto p-4">
          <div className="container mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}

