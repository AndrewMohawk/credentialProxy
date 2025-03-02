import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { PoliciesTable } from "@/components/policies-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function PoliciesPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Policies" text="Manage access control policies.">
        <Button asChild>
          <Link href="/policies/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Policy
          </Link>
        </Button>
      </DashboardHeader>
      <PoliciesTable />
    </DashboardShell>
  )
}

