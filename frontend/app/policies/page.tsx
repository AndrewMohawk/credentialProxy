'use client';

import { PoliciesPage } from './components/policies-page';
import { Suspense } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { DashboardHeader } from '@/components/dashboard-header';

// Simple loading component
function LoadingFallback() {
  return (
    <div className="flex justify-center items-center h-[40vh]">
      <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
    </div>
  );
}

export default function Page() {
  return (
    <DashboardShell>
      <Suspense fallback={<LoadingFallback />}>
        <PoliciesPage />
      </Suspense>
    </DashboardShell>
  );
}

