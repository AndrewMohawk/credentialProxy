import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RecentActivityProps {
  className?: string
}

export function RecentActivity({ className }: RecentActivityProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-card dark:bg-gray-800/80', className)}>
      <div className="p-6 pb-4">
        <h3 className="text-lg font-semibold text-card-foreground dark:text-gray-200">Recent Activity</h3>
        <p className="text-sm text-muted-foreground dark:text-gray-400">Latest credential access events</p>
      </div>
      <div>
        {recentActivities.map((activity, index) => (
          <Link
            key={index}
            href={`/audit-logs?application=${activity.applicationId}&operation=${encodeURIComponent(activity.operation)}`}
            className="flex items-center gap-4 border-t border-border p-4 hover:bg-muted/50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div
              className={cn(
                'h-2 w-2 rounded-full flex-shrink-0',
                activity.status === 'approved'
                  ? 'bg-green-500'
                  : activity.status === 'denied'
                    ? 'bg-red-500'
                    : 'bg-yellow-500',
              )}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4">
                <p className="font-medium truncate text-card-foreground dark:text-gray-200">{activity.application}</p>
                <Badge
                  variant={
                    activity.status === 'approved'
                      ? 'default'
                      : activity.status === 'denied'
                        ? 'destructive'
                        : 'outline'
                  }
                  className="flex-shrink-0"
                >
                  {activity.status}
                </Badge>
              </div>
              <p className="text-sm font-mono text-muted-foreground dark:text-gray-400 mt-1">{activity.operation}</p>
              <div className="flex items-center justify-between mt-1">
                <Badge variant="outline" className="text-xs font-normal">
                  {activity.credentialType}
                </Badge>
                <span className="text-sm text-muted-foreground dark:text-gray-400">{activity.time}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

const recentActivities = [
  {
    applicationId: 'app1',
    application: 'Analytics Dashboard',
    credentialType: 'API Key',
    operation: 'GET /api/data',
    status: 'approved',
    time: '2 minutes ago',
  },
  {
    applicationId: 'app2',
    application: 'Monitoring Service',
    credentialType: 'OAuth',
    operation: 'POST /api/metrics',
    status: 'approved',
    time: '15 minutes ago',
  },
  {
    applicationId: 'app3',
    application: 'External Processor',
    credentialType: 'Ethereum',
    operation: 'eth_sendTransaction',
    status: 'denied',
    time: '32 minutes ago',
  },
  {
    applicationId: 'app4',
    application: 'Data Sync Tool',
    credentialType: 'Database',
    operation: 'SELECT * FROM users',
    status: 'pending',
    time: '1 hour ago',
  },
  {
    applicationId: 'app5',
    application: 'Backup Service',
    credentialType: 'API Key',
    operation: 'GET /api/backup',
    status: 'approved',
    time: '2 hours ago',
  },
];

