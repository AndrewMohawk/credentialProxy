'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, AlertCircle, PlayCircle, Info, Plus, Wand2, FilePlus, MessageSquare, Code2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Policy } from '@/lib/types/policy';
import { usePolicies } from '@/hooks/policies/use-policies';
import { usePlugins } from '@/hooks/plugins/use-plugins';
import { useCredentials } from '@/hooks/credentials/use-credentials';
import { Credential } from '@/hooks/credentials/use-credentials';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DashboardHeader } from '@/components/dashboard-header';
import { MOCK_TEMPLATES } from '@/lib/types/policy';
import { PoliciesTable } from '@/components/policies/policies-table';
import { PolicyCreateDialog } from '@/components/policies/policy-create-dialog';
import { PolicyEditDialog } from '@/components/policies/policy-edit-dialog';
import { PolicyViewDialog } from '@/components/policies/policy-view-dialog';
import { PolicyWizardDialog } from '@/components/policies/policy-wizard-dialog';
import { PolicyFlowVisualization } from '@/components/policies/policy-flow-visualization';
import { NaturalLanguagePolicyDialog } from '@/components/policies/natural-language-policy-dialog';
import { PolicyDeleteAlert } from '@/components/policies/policy-delete-alert';
import { PolicyCreationModal } from '@/components/policies/policy-creation-modal';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator, 
  DropdownMenuShortcut 
} from '@/components/ui/dropdown-menu';
import { CircleIcon } from '@/components/icons/circle-icon';

// Policy with strong typing
interface PolicyWithDetails extends Policy {
  isEnabled?: boolean;
  [key: string]: any;
}

// Create usage history type
interface UsageHistoryEntry {
  id: string;
  policyId: string;
  timestamp: string;
  status: string;
  details: Record<string, any>;
}

export function PoliciesPage() {
  // State management for dialogs
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [wizardDialogOpen, setWizardDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [naturalLanguageDialogOpen, setNaturalLanguageDialogOpen] = useState(false);
  const [policyCreationModalOpen, setPolicyCreationModalOpen] = useState(false);
  const [open, setOpen] = useState(false);
  
  // State for policy data
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [policyDetails, setPolicyDetails] = useState<PolicyWithDetails | null>(null);
  const [usageHistory, setUsageHistory] = useState<UsageHistoryEntry[]>([]);
  const [selectedPolicyName, setSelectedPolicyName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [preselectedScope, setPreselectedScope] = useState<'GLOBAL' | 'PLUGIN' | 'CREDENTIAL' | null>(null);
  const [targetId, setTargetId] = useState<string | undefined>(undefined);
  
  // Use our custom hooks
  const { 
    policies,
    isLoading: isPoliciesLoading,
    error: policiesError,
    createPolicy,
    updatePolicy,
    deletePolicy,
    togglePolicyStatus,
    getPolicyDetails
  } = usePolicies();
  
  const {
    plugins,
    isLoading: isPluginsLoading,
    error: pluginsError
  } = usePlugins();
  
  const {
    credentials: apiCredentials,
    isLoading: isCredentialsLoading,
    error: credentialsError
  } = useCredentials();
  
  // Use credentials from the API
  const [credentials, setCredentials] = useState<Credential[]>([]);
  
  useEffect(() => {
    // Just use the API credentials directly
    setCredentials(Array.isArray(apiCredentials) ? apiCredentials : []);
  }, [apiCredentials]);
  
  const isLoading = isPoliciesLoading || isPluginsLoading || isCredentialsLoading;
  const error = policiesError || pluginsError || credentialsError;
  
  const { toast } = useToast();
  
  // Filter policies by type - only if policies exists
  const globalPolicies = !policies ? [] : policies.filter((policy: Policy) => 
    policy.scope === 'GLOBAL' || 
    (!policy.pluginId && !policy.credentialId)
  );
  
  const pluginPolicies = !policies ? [] : policies.filter((policy: Policy) => 
    policy.pluginId && policy.scope === 'PLUGIN'
  );
  
  const credentialPolicies = !policies ? [] : policies.filter((policy: Policy) => 
    policy.credentialId && policy.scope === 'CREDENTIAL'
  );
  
  // View policy details
  const handleViewPolicy = async (policy: Policy) => {
    setSelectedPolicy(policy);
    
    try {
      const details = await getPolicyDetails(policy.id);
      if (details) {
        setPolicyDetails(details);
        setUsageHistory(details.usageHistory || []);
        setViewDialogOpen(true);
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to fetch policy details',
        variant: 'destructive'
      });
    }
  };
  
  // Edit policy
  const handleEditPolicy = (policy: Policy) => {
    setSelectedPolicy(policy);
    setPolicyDetails({
      ...policy,
      isEnabled: policy.isActive
    });
    setEditDialogOpen(true);
  };
  
  // Start deletion process
  const handleDeleteInitiate = (policy: Policy) => {
    setSelectedPolicy(policy);
    setSelectedPolicyName(policy.name);
    setDeleteDialogOpen(true);
  };
  
  // Confirm and execute deletion
  const handleDeleteConfirm = async () => {
    if (!selectedPolicy) return;
    
    setIsDeleting(true);
    try {
      await deletePolicy(selectedPolicy.id);
      toast({
        title: 'Success',
        description: `Policy "${selectedPolicyName}" has been deleted`,
      });
      setDeleteDialogOpen(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete the policy',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Toggle policy status
  const handleToggleStatus = async (policyId: string, isActive: boolean) => {
    try {
      await togglePolicyStatus(policyId, isActive);
      toast({
        title: 'Success',
        description: `Policy status updated to ${isActive ? 'active' : 'inactive'}`,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update policy status',
        variant: 'destructive'
      });
    }
  };
  
  // Handle opening the create dialog with specific scope
  const handleOpenCreateDialog = (scope: 'GLOBAL' | 'PLUGIN' | 'CREDENTIAL' | null = null, targetId?: string) => {
    setPreselectedScope(scope);
    if (targetId) {
      setTargetId(targetId);
    }
    // Open natural language dialog directly instead of the policy creation modal
    setNaturalLanguageDialogOpen(true);
  };
  
  // Handle selecting natural language policy creation
  const handleSelectNaturalLanguage = () => {
    setPolicyCreationModalOpen(false);
    setNaturalLanguageDialogOpen(true);
  };
  
  // Handle selecting advanced policy creation
  const handleSelectAdvanced = () => {
    setPolicyCreationModalOpen(false);
    setCreateDialogOpen(true);
  };
  
  // Handle opening the natural language dialog
  const handleOpenNaturalLanguageDialog = (scope?: 'GLOBAL' | 'PLUGIN' | 'CREDENTIAL', targetId?: string) => {
    setPreselectedScope(scope || null);
    setTargetId(targetId);
    setNaturalLanguageDialogOpen(true);
  };
  
  // Save new policy
  const handleCreatePolicy = async (policyData: any) => {
    try {
      // Set isActive based on isEnabled or default to true
      const isActive = policyData.isEnabled !== undefined ? policyData.isEnabled : true;
      
      // Prepare the data for API
      const apiData: any = {
        name: policyData.name,
        description: policyData.description || '',
        isActive,
        priority: policyData.priority || 100,
        config: policyData.config || {}
      };
      
      // Handle the new policy data structure from NaturalLanguagePolicyDialog
      if (policyData.scope && policyData.rules) {
        // Determine the type based on the action in the first rule
        const firstRule = policyData.rules[0];
        if (firstRule) {
          apiData.type = firstRule.action === 'allow' ? 'ALLOW_LIST' : 'DENY_LIST';
        }
        
        // Set the config with scope and rules
        apiData.config = {
          ...apiData.config,
          scope: policyData.scope.toUpperCase(),
          rules: policyData.rules
        };
        
        // Set credential or plugin ID based on scope
        if (policyData.scope === 'credential' && policyData.credentialId) {
          apiData.credentialId = policyData.credentialId;
        } else if (policyData.scope === 'plugin' && policyData.pluginId) {
          apiData.pluginId = policyData.pluginId;
        }
      } 
      // Handle the old policy dialog structure
      else {
        // Ensure config exists
        if (!apiData.config) {
          apiData.config = policyData.configuration || {};
        }
        
        // Handle pattern match policies
        if (policyData.type === 'PATTERN_MATCH' && policyData.pattern) {
          apiData.config.pattern = policyData.pattern;
        }
        
        // Set type from policyData
        apiData.type = policyData.type;
        
        // Set credential or plugin ID
        if (policyData.credentialId) {
          apiData.credentialId = policyData.credentialId;
        } else if (policyData.pluginId) {
          apiData.pluginId = policyData.pluginId;
        }
      }
      
      // Create the policy
      await createPolicy(apiData);
      
      // Close dialogs and refresh
      setCreateDialogOpen(false);
      setWizardOpen(false);
      setNaturalLanguageDialogOpen(false);
      setPolicyCreationModalOpen(false);
      
      // Show success message
      toast({
        title: "Policy Created",
        description: "Your policy has been created successfully.",
      });
    } catch (error) {
      console.error('Error creating policy:', error);
      toast({
        title: "Error Creating Policy",
        description: "There was an error creating your policy. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Save edited policy
  const handleSavePolicy = async (updatedData: any) => {
    if (!selectedPolicy) return;
    
    try {
      // Format the data for the API
      const formattedData = {
        ...updatedData,
        id: selectedPolicy.id,
        isActive: updatedData.isEnabled
      };
      
      await updatePolicy(selectedPolicy.id, formattedData);
      setEditDialogOpen(false);
      toast({
        title: 'Success',
        description: `Policy "${updatedData.name}" has been updated`,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update policy',
        variant: 'destructive'
      });
    }
  };
  
  // Test policy function from header
  const handleTestPolicy = () => {
    // Check if there's at least one policy to test
    if (policies && policies.length > 0) {
      // For now, just select the first policy to test
      handleViewPolicy(policies[0]);
      // In the view dialog, we could add a "Test" button
    } else {
      toast({
        title: 'No Policies Available',
        description: 'Create a policy first before testing',
      });
    }
  };
  
  // Test specific policy
  const handleTestSpecificPolicy = (policy: any) => {
    // Navigate to policy simulator or open a simulator dialog
    // For now we'll just show a toast
    toast({
      title: 'Policy Simulator',
      description: `Testing policy: ${policy.name}`,
    });
    
    // Close the view dialog
    setViewDialogOpen(false);
    
    // Here you could navigate to a dedicated simulator page
    // or open a simulator dialog
  };
  
  // Show error notification if policies loading failed
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load policies',
        variant: 'destructive'
      });
    }
  }, [error, toast]);
  
  // Display appropriate loading and error states
  if (error) {
    return (
      <>
        <DashboardHeader
          heading="Policy Management"
          text="Define and control access to your credentials"
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </>
    );
  }
  
  // Render loading state if policies are loading
  if (isLoading) {
    return (
      <>
        <DashboardHeader
          heading="Policy Management"
          text="Define and control access to your credentials"
        />
        <div className="flex justify-center items-center h-[40vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
        </div>
      </>
    );
  }
  
  return (
    <>
      <DashboardHeader
        heading="Policy Management"
        text="Define and control access to your credentials"
      >
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={handleTestPolicy}>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Policy Simulator
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Test existing policies against sample requests</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button onClick={() => handleOpenCreateDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Create Policy
          </Button>
        </div>
      </DashboardHeader>
      
      <div className="grid grid-cols-12 gap-4">
        {/* Main content - left side */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {/* Global Policies */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base">Global Policies</CardTitle>
                  <CardDescription className="text-xs">
                    Policies that apply to all credential access requests
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleOpenCreateDialog('GLOBAL')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Global Policy
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <PoliciesTable 
                policies={globalPolicies}
                isLoading={isLoading}
                noResultsMessage="No global policies found"
                onToggleStatus={handleToggleStatus}
                onDelete={handleDeleteInitiate}
                onView={handleViewPolicy}
                onEdit={handleEditPolicy}
              />
            </CardContent>
          </Card>
          
          {/* Plugin Policies */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base">Plugin Policies</CardTitle>
                  <CardDescription className="text-xs">
                    Policies that apply to specific plugins
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Policy
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {plugins && Array.isArray(plugins) && plugins.length > 0 ? (
                      plugins.map((plugin) => (
                        <DropdownMenuItem 
                          key={plugin.id}
                          onClick={() => handleOpenCreateDialog('PLUGIN', plugin.id)}
                          className="flex flex-col items-center justify-center p-4 border rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer"
                        >
                          <CircleIcon className="mr-2 h-2 w-2" />
                          {plugin.name || plugin.type}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled>
                        No plugins available
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <PoliciesTable 
                policies={pluginPolicies}
                plugins={plugins}
                showPlugin={true}
                isLoading={isLoading}
                noResultsMessage="No plugin policies found"
                onToggleStatus={handleToggleStatus}
                onDelete={handleDeleteInitiate}
                onView={handleViewPolicy}
                onEdit={handleEditPolicy}
              />
            </CardContent>
          </Card>
          
          {/* Credential Policies */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base">Credential Policies</CardTitle>
                  <CardDescription className="text-xs">
                    Policies that apply to specific credentials
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Policy
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {credentials && Array.isArray(credentials) && credentials.length > 0 ? (
                      credentials.map((credential) => (
                        <DropdownMenuItem 
                          key={credential.id}
                          onClick={() => handleOpenCreateDialog('CREDENTIAL', credential.id)}
                          className="flex flex-col items-center justify-center p-4 border rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer"
                        >
                          <CircleIcon className="mr-2 h-2 w-2" />
                          {credential.name}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled>No credentials available</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <PoliciesTable 
                policies={credentialPolicies}
                credentials={credentials}
                showCredential={true}
                isLoading={isLoading}
                noResultsMessage="No credential policies found"
                onToggleStatus={handleToggleStatus}
                onDelete={handleDeleteInitiate}
                onView={handleViewPolicy}
                onEdit={handleEditPolicy}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar - right side */}
        <div className="col-span-12 lg:col-span-4">
          <Card className="shadow-sm sticky top-20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-base">
                <Info className="mr-2 h-4 w-4" />
                Policy Flow
              </CardTitle>
              <CardDescription className="text-xs">
                How policies are evaluated for credential access
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="rounded border p-2 bg-muted/50">
                <PolicyFlowVisualization />
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                <p>Policies are evaluated in this order:</p>
                <ol className="list-decimal ml-4 mt-1 space-y-0.5">
                  <li>Global policies apply to all requests</li>
                  <li>Plugin policies apply to specific plugins</li>
                  <li>Credential policies are most specific</li>
                </ol>
                <p className="mt-1">If any policy denies access, the request is rejected.</p>
                <p className="mt-1">Policies can be time-based, count-based, or pattern-based.</p>
              </div>
              
              <div className="mt-3 space-y-1">
                <h3 className="text-xs font-semibold">Quick Tips</h3>
                <ul className="text-xs space-y-0.5">
                  <li className="flex items-start">
                    <span className="text-primary mr-1">•</span>
                    <span>Create global policies for general access rules</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-1">•</span>
                    <span>Use plugin policies for specific plugin restrictions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-1">•</span>
                    <span>Credential policies provide the most granular control</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Dialogs */}
      <PolicyCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSave={handleCreatePolicy}
        plugins={plugins}
        credentials={credentials}
        templates={MOCK_TEMPLATES}
        preselectedScope={preselectedScope}
        isCreating={false}
      />
      
      <PolicyWizardDialog
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onComplete={handleCreatePolicy}
        preselectedScope={preselectedScope}
        credentialId={preselectedScope === 'CREDENTIAL' ? targetId : undefined}
      />
      
      <NaturalLanguagePolicyDialog
        open={naturalLanguageDialogOpen}
        onOpenChange={setNaturalLanguageDialogOpen}
        onComplete={handleCreatePolicy}
        availableCredentials={credentials || []}
        availablePlugins={plugins || []}
        initialCredentialId={preselectedScope === 'CREDENTIAL' ? targetId : undefined}
        initialScope={preselectedScope === 'CREDENTIAL' ? 'credential' : preselectedScope === 'PLUGIN' ? 'plugin' : 'global'}
      />
      
      <PolicyCreationModal
        open={policyCreationModalOpen}
        onOpenChange={setPolicyCreationModalOpen}
        onSelectNaturalLanguage={handleSelectNaturalLanguage}
        onSelectAdvanced={handleSelectAdvanced}
      />
      
      <PolicyViewDialog 
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        policyDetails={policyDetails}
        usageHistory={usageHistory}
        isLoading={false}
        onEdit={() => {
          setViewDialogOpen(false);
          handleEditPolicy(selectedPolicy!);
        }}
        onTest={handleTestSpecificPolicy}
      />
      
      <PolicyEditDialog 
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        policyDetails={policyDetails}
        isLoading={false}
        onSave={handleSavePolicy}
      />
      
      <PolicyDeleteAlert 
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        policyName={selectedPolicyName}
        isDeleting={isDeleting}
      />
    </>
  );
} 