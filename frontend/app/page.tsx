import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { Overview } from "@/components/overview"
import { RecentActivity } from "@/components/recent-activity"
import { CredentialsSummary } from "@/components/credentials-summary"
import { ApplicationsSummary } from "@/components/applications-summary"

export default function Home() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Dashboard" text="Overview of your credential proxy system." className="mb-4" />
      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <CredentialsSummary />
        <ApplicationsSummary />
        <Overview />
      </div>
      <RecentActivity />
    </DashboardShell>
  )
}

