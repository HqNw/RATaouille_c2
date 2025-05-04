"use client"

import {
  LogOut,
  Moon,
  Sun,
  Settings,
  ServerCog,
  LayoutDashboard,
  ShieldAlert,
  Users,
  Terminal,
  HardDrive,
  Laptop,
  X,
  Keyboard,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/ThemeProvider"
import { Button } from "@/components/ui/button"
import { Link, useLocation } from "react-router-dom"
import { useMemo } from "react"

export interface SidebarItem {
  icon: string
  title: string
  link?: string
  onClick?: () => void
  type?: "link" | "button"
}

interface SidebarProps {
  isMobileMenuOpen: boolean
  onCloseMobileMenu?: () => void
  items?: SidebarItem[]
}

export function Sidebar({ isMobileMenuOpen, onCloseMobileMenu, items = [] }: SidebarProps) {
  const { theme, setTheme } = useTheme()
  const location = useLocation()

  // Determine active item based on current path
  const activeItem = useMemo(() => {
    // Get the current path without query parameters
    const currentPath = location.pathname

    // Find matching item, prioritizing exact matches
    const exactMatch = items.find((item) => item.link === currentPath)
    if (exactMatch) return exactMatch.title

    // Check for partial matches (for nested routes)
    // Only match if it's not the home route to avoid false positives
    if (currentPath !== "/") {
      const partialMatch = items.find((item) => item.link && item.link !== "/" && currentPath.startsWith(item.link))
      if (partialMatch) return partialMatch.title
    }

    // Default to matching '/' for home route
    if (currentPath === "/") {
      return items.find((item) => item.link === "/")?.title || "Dashboard"
    }

    return "Dashboard" // Fallback default
  }, [location.pathname, items])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const renderIcon = (icon: string) => {
    switch (icon) {
      case "dashboard":
        return <LayoutDashboard className="w-5 h-5 mr-3" />
      case "clients":
        return <Laptop className="w-5 h-5 mr-3" />
      case "keyboard":
        return <Keyboard className="w-5 h-5 mr-3" />
      case "terminal":
        return <Terminal className="w-5 h-5 mr-3" />
      case "file-manager":
        return <HardDrive className="w-5 h-5 mr-3" />
      case "server":
        return <ServerCog className="w-5 h-5 mr-3" />
      case "security":
        return <ShieldAlert className="w-5 h-5 mr-3" />
      case "users":
        return <Users className="w-5 h-5 mr-3" />
      case "settings":
        return <Settings className="w-5 h-5 mr-3" />
      default:
        return <Laptop className="w-5 h-5 mr-3" />
    }
  }

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" onClick={onCloseMobileMenu} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-64 glass-card transition-all duration-300 transform",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <div className="flex items-center gap-2 animate-fadeIn">
              <ServerCog className="h-6 w-6 text-primary animate-pulse" />
              <h2 className="text-xl font-bold gradient-text animate-pulse">RATaouille</h2>
            </div>

            {/* Mobile close button */}
            <Button
              onClick={onCloseMobileMenu}
              variant="ghost"
              size="icon"
              className="lg:hidden hover-scale"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {items.map((item, index) => {
              const isActive = item.title === activeItem

              const commonProps = {
                key: item.title,
                className: cn(
                  "flex items-start p-2 w-full rounded-md",
                  "transition-all duration-300 hover:bg-secondary/50 hover:translate-x-1",
                  isActive
                    ? "bg-gradient-to-r muted-foreground/60 from-primary/30 text-primary-foreground"
                    : "text-foreground/80",
                  "animate-slideInLeft",
                ),
                style: { animationDelay: `${0.1 + index * 0.05}s` },
                children: (
                  <>
                    {renderIcon(item.icon)}
                    <span>{item.title}</span>
                  </>
                ),
              }

              // Render as button if onClick is provided
              if (item.onClick) {
                return <Button {...commonProps} onClick={item.onClick} type="button" key={item.title} />
              }

              if (item.link) {
                return (
                  <Link
                    {...commonProps}
                    key={item.title}
                    to={item.link}
                    onClick={isActive ? undefined : onCloseMobileMenu}
                  />
                )
              }

              // Default to Link if link is provided
              return <a {...commonProps} href={item.link || "#"} key={item.title} />
            })}
          </nav>

          <div className="p-4 border-t border-border animate-fadeIn animate-delay-500">
            <Button
              variant={"secondary"}
              onClick={toggleTheme}
              className="flex items-center p-2 w-full rounded-md hover:bg-primary/90 transition-all duration-300 hover-scale"
            >
              {theme === "light" ? <Moon className="w-5 h-5 mr-3" /> : <Sun className="w-5 h-5 mr-3" />}
              <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
            </Button>

            <span className="block h-px my-2 bg-border"></span>

            <Button
              variant={"link"}
              onClick={() => {
                window.location.href = "/settings"
              }}
              className="flex items-center p-2 w-full rounded-md hover:bg-secondary/50 transition-all duration-300 hover:translate-x-1"
            >
              <Settings className="w-5 h-5 mr-3" />
              <span>Settings</span>
            </Button>
            <Button
              variant={"link"}
              onClick={() => {
                window.location.href = "/"
              }}
              className="flex items-center p-2 w-full mt-2 rounded-md hover:bg-secondary/50 transition-all duration-300 hover:translate-x-1"
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
