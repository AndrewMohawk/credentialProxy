'use client';

import type React from 'react';
import Link from 'next/link';
import { Home, Key, AppWindow, FileText, Activity, PlugIcon as Plugin, BarChart2, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

const navItems = [
  { href: '/', icon: Home, label: 'Dashboard' },
  { href: '/credentials', icon: Key, label: 'Credentials' },
  { href: '/applications', icon: AppWindow, label: 'Applications' },
  { href: '/policies', icon: FileText, label: 'Policies' },
  { href: '/audit-logs', icon: Activity, label: 'Audit Logs' },
  { href: '/plugins', icon: Plugin, label: 'Plugins' },
  { href: '/system-status', icon: BarChart2, label: 'System Status' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <nav className={cn('flex md:flex-col space-x-2 md:space-x-0 md:space-y-1', className)} {...props}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            'hover:bg-muted hover:text-foreground',
            pathname === item.href ? 'bg-muted text-foreground' : 'text-muted-foreground',
          )}
        >
          <item.icon className="mr-2 h-4 w-4" />
          <span className="hidden md:inline">{item.label}</span>
        </Link>
      ))}
      <button
        className={cn(
          'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          'hover:bg-muted hover:text-foreground text-muted-foreground',
        )}
        onClick={() => {
          console.log('Logout clicked from MainNav');
          logout();
        }}
      >
        <LogOut className="mr-2 h-4 w-4" />
        <span className="hidden md:inline">Logout</span>
      </button>
    </nav>
  );
}

