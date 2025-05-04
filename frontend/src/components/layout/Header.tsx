"use client"

import { Menu, Server } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  title: string
  onToggleMobileMenu?: () => void
}

export function Header({ title, onToggleMobileMenu }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 glass-header py-2 px-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {/* Mobile menu toggle button */}
          <Button
            onClick={onToggleMobileMenu}
            variant="ghost"
            size="icon"
            className="lg:hidden mr-2"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Server className="h-7 w-7 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
        </div>
      </div>
    </header>
  )
}

