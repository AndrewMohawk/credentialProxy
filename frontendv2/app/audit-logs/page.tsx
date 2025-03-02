import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { AuditLogsTable } from "@/components/audit-logs-table"
import { DateRangePicker } from "@/components/date-range-picker"

export default function AuditLogsPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Audit Logs" text="View all credential access and usage logs.">
        <DateRangePicker />
      </DashboardHeader>
      <AuditLogsTable />
    </DashboardShell>
  )
}

