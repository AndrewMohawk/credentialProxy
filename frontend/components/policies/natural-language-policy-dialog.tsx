'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PolicySentenceBuilder } from './policy-sentence-builder';
import { PolicyTemplateSelector } from './policy-template-selector';
import { PolicyVisualization } from './policy-visualization';
import { Credential } from '@/lib/types/credential';
import { Plugin } from '@/lib/types/plugin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Code2, Eye, FileText } from 'lucide-react';

// Define the policy data interface
export interface PolicyData {
  name: string;
  description: string;
  scope: 'global' | 'credential' | 'plugin';
  credentialId?: string;
  pluginId?: string;
  rules: any[];
  [key: string]: any;
}

// Define the tabs
enum PolicyTab {
  NATURAL = 'natural',
  TEMPLATES = 'templates',
  VISUALIZATION = 'visualization',
  ADVANCED = 'advanced',
}

export interface NaturalLanguagePolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (policyData: PolicyData) => void;
  availableCredentials?: Credential[];
  availablePlugins?: Plugin[];
  initialCredentialId?: string;
  initialScope?: 'global' | 'credential' | 'plugin';
}

export const NaturalLanguagePolicyDialog: React.FC<NaturalLanguagePolicyDialogProps> = ({
  open,
  onOpenChange,
  onComplete,
  availableCredentials = [],
  availablePlugins = [],
  initialCredentialId,
  initialScope = 'global',
}) => {
  const [activeTab, setActiveTab] = useState<PolicyTab>(PolicyTab.NATURAL);
  const [policyData, setPolicyData] = useState<PolicyData>({
    name: '',
    description: '',
    scope: initialScope,
    credentialId: initialCredentialId || (availableCredentials.length > 0 ? availableCredentials[0].id : undefined),
    rules: [],
  });

  // Reset policy data when dialog opens
  useEffect(() => {
    if (open) {
      setPolicyData({
        name: '',
        description: '',
        scope: initialScope,
        credentialId: initialCredentialId || (availableCredentials.length > 0 ? availableCredentials[0].id : undefined),
        rules: [],
      });
      setActiveTab(PolicyTab.NATURAL);
    }
  }, [open, initialScope, initialCredentialId, availableCredentials]);

  const handleSentenceUpdate = (updatedPolicy: Partial<PolicyData>) => {
    setPolicyData(prev => ({
      ...prev,
      ...updatedPolicy,
      // Preserve the credential ID if it was already set
      credentialId: updatedPolicy.credentialId || prev.credentialId,
    }));
  };

  const handleTemplateSelect = (template: PolicyData) => {
    setPolicyData(prev => ({
      ...template,
      // Preserve the credential ID if it was already set and the scope is credential
      credentialId: (template.scope === 'credential' || prev.scope === 'credential') 
        ? (template.credentialId || prev.credentialId) 
        : undefined,
    }));
    setActiveTab(PolicyTab.NATURAL);
  };

  const handleComplete = () => {
    // Ensure we have a credential ID if the scope is credential
    const finalPolicyData = { ...policyData };
    
    if (finalPolicyData.scope === 'credential' && !finalPolicyData.credentialId && availableCredentials.length > 0) {
      finalPolicyData.credentialId = availableCredentials[0].id;
    }
    
    onComplete(finalPolicyData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Policy</DialogTitle>
          <DialogDescription>
            Define what applications can do with a simple natural language policy
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PolicyTab)} className="mt-4">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value={PolicyTab.NATURAL} className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Natural</span>
              <span className="sm:hidden">Natural</span>
            </TabsTrigger>
            <TabsTrigger value={PolicyTab.TEMPLATES} className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
              <span className="sm:hidden">Templates</span>
            </TabsTrigger>
            <TabsTrigger value={PolicyTab.VISUALIZATION} className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Visual</span>
              <span className="sm:hidden">Visual</span>
            </TabsTrigger>
            <TabsTrigger value={PolicyTab.ADVANCED} className="flex items-center gap-1">
              <Code2 className="h-4 w-4" />
              <span className="hidden sm:inline">Advanced</span>
              <span className="sm:hidden">Advanced</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={PolicyTab.NATURAL} className="py-4">
            <div className="mb-4 p-4 bg-muted rounded-md border">
              <h3 className="text-sm font-medium mb-2">Natural Language Policy Builder</h3>
              <p className="text-sm text-muted-foreground">
                Create policies using simple sentences in the format: 
                "If <strong>[application]</strong> wants to do <strong>[action]</strong> then <strong>[allow/block]</strong>"
              </p>
            </div>
            <PolicySentenceBuilder 
              availableCredentials={availableCredentials}
              availablePlugins={availablePlugins}
              preselectedCredentialId={initialCredentialId}
              preselectedScope={initialScope}
              onPolicyUpdate={handleSentenceUpdate}
            />
          </TabsContent>

          <TabsContent value={PolicyTab.TEMPLATES} className="py-4">
            <div className="mb-4 p-4 bg-muted rounded-md border">
              <h3 className="text-sm font-medium mb-2">Policy Templates</h3>
              <p className="text-sm text-muted-foreground">
                Choose from pre-built policy templates for common scenarios
              </p>
            </div>
            <PolicyTemplateSelector 
              availableCredentials={availableCredentials}
              availablePlugins={availablePlugins}
              preselectedCredentialId={initialCredentialId}
              preselectedScope={initialScope}
              onTemplateSelect={handleTemplateSelect}
            />
          </TabsContent>

          <TabsContent value={PolicyTab.VISUALIZATION} className="py-4">
            <div className="mb-4 p-4 bg-muted rounded-md border">
              <h3 className="text-sm font-medium mb-2">Policy Visualization</h3>
              <p className="text-sm text-muted-foreground">
                See a visual representation of how your policy will work
              </p>
            </div>
            <PolicyVisualization 
              policyData={policyData}
              onPolicyUpdate={handleSentenceUpdate}
            />
          </TabsContent>

          <TabsContent value={PolicyTab.ADVANCED} className="py-4">
            <div className="mb-4 p-4 bg-muted rounded-md border">
              <h3 className="text-sm font-medium mb-2">Advanced Policy Editor</h3>
              <p className="text-sm text-muted-foreground">
                For technical users who need more control over policy configuration
              </p>
            </div>
            <div className="text-center py-8">
              <p className="text-muted-foreground">Advanced policy editor coming soon</p>
              <p className="text-sm text-muted-foreground mt-2">Please use the natural language builder for now</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setActiveTab(PolicyTab.NATURAL)}
              >
                Back to Natural Language
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleComplete} 
            disabled={!policyData.name || policyData.rules.length === 0}
          >
            Create Policy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 