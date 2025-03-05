'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { PolicyWizard } from './policy-wizard';
import { Policy } from '@/lib/types/policy';

interface PolicyWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (policy: Policy) => void;
  initialPolicy?: Partial<Policy>;
  credentialId?: string;
  preselectedScope?: 'GLOBAL' | 'PLUGIN' | 'CREDENTIAL' | null;
  plugins?: any[];
  credentials?: any[];
}

export function PolicyWizardDialog({
  open,
  onOpenChange,
  onComplete,
  initialPolicy,
  credentialId,
  preselectedScope,
  plugins,
  credentials
}: PolicyWizardDialogProps) {
  // Create a state for the policy to handle scope changes
  const [policyWithScope, setPolicyWithScope] = useState<Partial<Policy> | undefined>(initialPolicy);
  
  // Update the policy when the scope changes or dialog opens
  useEffect(() => {
    if (open) {
      setPolicyWithScope({
        ...initialPolicy || {},
        scope: preselectedScope || 'GLOBAL',
        isActive: true
      });
    }
  }, [open, preselectedScope, initialPolicy]);

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleComplete = (policy: Policy) => {
    onComplete(policy);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Policy</DialogTitle>
          <DialogDescription>
            Use the wizard to create a comprehensive policy for credential access control.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <PolicyWizard 
            initialPolicy={policyWithScope}
            credentialId={credentialId}
            onComplete={handleComplete}
            onCancel={handleCancel}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 