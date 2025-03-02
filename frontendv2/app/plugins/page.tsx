import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { PluginsGrid } from "@/components/plugins-grid"

export default function PluginsPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Plugins" text="Manage credential type plugins." />
      <PluginsGrid />
    </DashboardShell>
  )
}

