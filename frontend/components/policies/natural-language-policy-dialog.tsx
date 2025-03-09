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
    credentialId: initialCredentialId,
    rules: []
  });
  
  // Reset form when dialog is opened
  useEffect(() => {
    if (open) {
      setPolicyData({
        name: '',
        description: '',
        scope: initialScope,
        credentialId: initialCredentialId,
        rules: []
      });
      setActiveTab(PolicyTab.NATURAL);
    }
  }, [open, initialScope, initialCredentialId]);
  
  const handleSentenceUpdate = (updatedPolicy: Partial<PolicyData>) => {
    setPolicyData(prev => ({
      ...prev,
      ...updatedPolicy
    }));
  };
  
  const handleTemplateSelect = (template: PolicyData) => {
    setPolicyData({
      ...template,
      // Keep the initial scope and credential if they were provided
      scope: initialScope || template.scope,
      credentialId: initialCredentialId || template.credentialId
    });
    
    // Switch to visualization tab to show the policy structure
    setActiveTab(PolicyTab.VISUALIZATION);
  };
  
  const handleComplete = () => {
    // Ensure we have required fields
    if (!policyData.name) {
      alert('Please provide a policy name');
      return;
    }
    
    onComplete(policyData);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create Policy</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Define what applications can do with a simple natural language policy
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue={PolicyTab.NATURAL} value={activeTab} onValueChange={(value) => setActiveTab(value as PolicyTab)} className="mt-2">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger 
              value={PolicyTab.NATURAL} 
              className="flex items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Natural</span>
            </TabsTrigger>
            <TabsTrigger 
              value={PolicyTab.TEMPLATES} 
              className="flex items-center gap-1 text-muted-foreground data-[state=active]:text-foreground"
            >
              <FileText className="h-4 w-4" />
              <span>Templates</span>
            </TabsTrigger>
            <TabsTrigger 
              value={PolicyTab.VISUALIZATION} 
              className="flex items-center gap-1 text-muted-foreground data-[state=active]:text-foreground"
            >
              <Eye className="h-4 w-4" />
              <span>Visual</span>
            </TabsTrigger>
            <TabsTrigger 
              value={PolicyTab.ADVANCED} 
              className="flex items-center gap-1 text-muted-foreground data-[state=active]:text-foreground"
            >
              <Code2 className="h-4 w-4" />
              <span>Advanced</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={PolicyTab.NATURAL} className="space-y-4 mt-0">
            <div className="rounded-md border p-4 bg-card">
              <h3 className="text-sm font-medium mb-2">Natural Language Policy Builder</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create policies using simple sentences in the format: "If [application] wants to do [action] then [allow/block]"
              </p>
              <PolicySentenceBuilder
                availableCredentials={availableCredentials}
                availablePlugins={availablePlugins}
                preselectedCredentialId={initialCredentialId}
                preselectedScope={initialScope}
                onPolicyUpdate={handleSentenceUpdate}
              />
            </div>
          </TabsContent>
          
          <TabsContent value={PolicyTab.TEMPLATES} className="space-y-4 mt-0">
            <PolicyTemplateSelector onTemplateSelect={handleTemplateSelect} />
          </TabsContent>
          
          <TabsContent value={PolicyTab.VISUALIZATION} className="space-y-4 mt-0">
            <PolicyVisualization policyData={policyData} />
          </TabsContent>
          
          <TabsContent value={PolicyTab.ADVANCED} className="space-y-4 mt-0">
            <div className="rounded-md border p-4">
              <h3 className="text-sm font-medium mb-2">Advanced Policy Editor</h3>
              <p className="text-sm text-muted-foreground mb-4">
                For advanced users to create complex policy structures
              </p>
              <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                {JSON.stringify(policyData, null, 2)}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleComplete} disabled={!policyData.name}>
            Create Policy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 