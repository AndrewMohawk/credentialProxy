import { DashboardShell } from '@/components/dashboard-shell';
import { DashboardHeader } from '@/components/dashboard-header';
import { SystemStatus } from '@/components/system-status';
import { GlassCard } from '@/components/glass-card';

export default function SystemStatusPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="System Status" text="Overview of your system's operational status." />
      <GlassCard>
        <SystemStatus />
      </GlassCard>
    </DashboardShell>
  );
}

