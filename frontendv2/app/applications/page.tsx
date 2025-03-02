import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { ApplicationsTable } from "@/components/applications-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function ApplicationsPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Applications" text="Manage third-party applications.">
        <Button asChild>
          <Link href="/applications/new">
            <Plus className="mr-2 h-4 w-4" />
            Register Application
          </Link>
        </Button>
      </DashboardHeader>
      <ApplicationsTable />
    </DashboardShell>
  )
}

