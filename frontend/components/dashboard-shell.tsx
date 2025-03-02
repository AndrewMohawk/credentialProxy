import type React from "react"
import { MainNav } from "@/components/main-nav"
import { ModeToggle } from "@/components/mode-toggle"
import { GlassCard } from "@/components/glass-card"
import { BackgroundAnimation } from "@/components/background-animation"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="relative min-h-screen bg-transparent">
      <BackgroundAnimation />
      <div className="flex min-h-screen">
        <aside className="hidden md:flex md:w-64 md:flex-col">
          <GlassCard className="flex h-full flex-col">
            <div className="flex h-14 items-center px-4">
              <span className="text-lg font-semibold">Credential Proxy</span>
            </div>
            <MainNav />
          </GlassCard>
        </aside>
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
            <div className="container flex h-14 items-center justify-between py-4">
              <div className="md:hidden">
                <MainNav />
              </div>
              <div className="flex items-center gap-4">
                <ModeToggle />
              </div>
            </div>
          </header>
          <main className="flex-1 space-y-4 p-4 md:p-8">
            <div className="container">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}

