'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PolicyWizard } from '@/components/policies/policy-wizard';
import { Policy } from '@/lib/types/policy';
import { toast } from '@/components/ui/use-toast';
import { DashboardShell } from '@/components/dashboard-shell';
import { DashboardHeader } from '@/components/dashboard-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NewPolicyPage() {
  const router = useRouter();

  const handleComplete = (policy: Policy) => {
    toast({
      title: 'Policy Created',
      description: `Successfully created policy: ${policy.name}`,
    });
    router.push('/policies');
  };

  const handleCancel = () => {
    router.push('/policies');
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Create New Policy"
        text="Define a new policy to control access to your credentials"
      >
        <Button variant="outline" onClick={handleCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Policies
        </Button>
      </DashboardHeader>
      
      <PolicyWizard
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </DashboardShell>
  );
} 