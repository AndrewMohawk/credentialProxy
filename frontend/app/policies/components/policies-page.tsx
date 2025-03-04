"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle, AlertCircle, PlayCircle, Info } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Policy } from "@/lib/types/policy"
import { usePolicies } from "@/hooks/policies/use-policies"
import { usePlugins } from "@/hooks/plugins/use-plugins"
import { useCredentials } from "@/hooks/credentials/use-credentials"
import { PoliciesTable } from "@/components/policies/policies-table"
import { PolicyViewDialog } from "@/components/policies/policy-view-dialog"
import { PolicyEditDialog } from "@/components/policies/policy-edit-dialog"
import { PolicyDeleteAlert } from "@/components/policies/policy-delete-alert"
import { PolicyCreateDialog } from "@/components/policies/policy-create-dialog"
import { MOCK_TEMPLATES } from "@/lib/types/policy"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PolicyFlowVisualization } from "@/components/policies/policy-flow-visualization"
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"

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
  // State management
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [policyDetails, setPolicyDetails] = useState<PolicyWithDetails | null>(null)
  const [usageHistory, setUsageHistory] = useState<UsageHistoryEntry[]>([])
  const [selectedPolicyName, setSelectedPolicyName] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  
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
  } = usePolicies()
  
  const {
    plugins,
    isLoading: isPluginsLoading,
    error: pluginsError
  } = usePlugins()
  
  const {
    credentials,
    isLoading: isCredentialsLoading,
    error: credentialsError
  } = useCredentials()
  
  const isLoading = isPoliciesLoading || isPluginsLoading || isCredentialsLoading
  const error = policiesError || pluginsError || credentialsError
  
  const { toast } = useToast()
  
  // Filter policies by type - only if policies exists
  const globalPolicies = !policies ? [] : policies.filter((policy: Policy) => 
    policy.scope === "GLOBAL" || 
    (!policy.pluginId && !policy.credentialId)
  )
  
  const pluginPolicies = !policies ? [] : policies.filter((policy: Policy) => 
    policy.pluginId && policy.scope === "PLUGIN"
  )
  
  const credentialPolicies = !policies ? [] : policies.filter((policy: Policy) => 
    policy.credentialId && policy.scope === "CREDENTIAL"
  )
  
  // View policy details
  const handleViewPolicy = async (policy: Policy) => {
    setSelectedPolicy(policy)
    
    try {
      const details = await getPolicyDetails(policy.id)
      if (details) {
        setPolicyDetails(details)
        setUsageHistory(details.usageHistory || [])
        setViewDialogOpen(true)
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to fetch policy details",
        variant: "destructive"
      })
    }
  }
  
  // Edit policy
  const handleEditPolicy = (policy: Policy) => {
    setSelectedPolicy(policy)
    setPolicyDetails({
      ...policy,
      isEnabled: policy.isActive
    })
    setEditDialogOpen(true)
  }
  
  // Start deletion process
  const handleDeleteInitiate = (policy: Policy) => {
    setSelectedPolicy(policy)
    setSelectedPolicyName(policy.name)
    setDeleteDialogOpen(true)
  }
  
  // Confirm and execute deletion
  const handleDeleteConfirm = async () => {
    if (!selectedPolicy) return
    
    setIsDeleting(true)
    try {
      await deletePolicy(selectedPolicy.id)
      toast({
        title: "Success",
        description: `Policy "${selectedPolicyName}" has been deleted`,
      })
      setDeleteDialogOpen(false)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete the policy",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }
  
  // Toggle policy status
  const handleToggleStatus = async (policyId: string, isActive: boolean) => {
    try {
      await togglePolicyStatus(policyId, isActive)
      toast({
        title: "Success",
        description: `Policy status updated to ${isActive ? 'active' : 'inactive'}`,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update policy status",
        variant: "destructive"
      })
    }
  }
  
  // Create new policy
  const handleCreatePolicy = async (policyData: any) => {
    try {
      // Determine the scope based on provided IDs
      let scope = "GLOBAL"
      if (policyData.credentialId) {
        scope = "CREDENTIAL"
      } else if (policyData.pluginId) {
        scope = "PLUGIN"
      }
      
      // Format the data for the API
      const formattedData = {
        ...policyData,
        scope,
        isActive: policyData.isEnabled,
        priority: 100, // Default priority
        config: { 
          ...policyData.configuration 
        }
      }
      
      // Add type-specific data
      if (policyData.type === 'PATTERN_MATCH' && policyData.pattern) {
        formattedData.config.pattern = policyData.pattern
      }
      
      if (policyData.type === 'COUNT_BASED' && policyData.maxCount) {
        formattedData.config.maxCount = parseInt(policyData.maxCount)
      }
      
      if (policyData.type === 'TIME_BASED') {
        if (policyData.startTime) formattedData.config.startTime = policyData.startTime
        if (policyData.endTime) formattedData.config.endTime = policyData.endTime
      }
      
      await createPolicy(formattedData)
      setCreateDialogOpen(false)
      toast({
        title: "Success",
        description: `Policy "${policyData.name}" has been created`,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create policy",
        variant: "destructive"
      })
    }
  }
  
  // Save edited policy
  const handleSavePolicy = async (updatedData: any) => {
    if (!selectedPolicy) return
    
    try {
      // Format the data for the API
      const formattedData = {
        ...updatedData,
        id: selectedPolicy.id,
        isActive: updatedData.isEnabled
      }
      
      await updatePolicy(selectedPolicy.id, formattedData)
      setEditDialogOpen(false)
      toast({
        title: "Success",
        description: `Policy "${updatedData.name}" has been updated`,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update policy",
        variant: "destructive"
      })
    }
  }
  
  // Test policy function
  const handleTestPolicy = () => {
    toast({
      title: "Test Policy",
      description: "Policy testing feature will be available soon",
    })
  }
  
  // Show error notification if policies loading failed
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load policies",
        variant: "destructive"
      })
    }
  }, [error, toast])
  
  // Display appropriate loading and error states
  if (error) {
    return (
      <DashboardShell>
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
      </DashboardShell>
    )
  }
  
  // Render loading state if policies are loading
  if (isLoading) {
    return (
      <DashboardShell>
        <DashboardHeader
          heading="Policy Management"
          text="Define and control access to your credentials"
        />
        <div className="flex justify-center items-center h-[40vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
        </div>
      </DashboardShell>
    );
  }
  
  return (
    <DashboardShell>
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
                  Test Policy
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Test a policy against sample requests</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button onClick={() => setCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
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
              <CardTitle className="text-base">Global Policies</CardTitle>
              <CardDescription className="text-xs">
                Policies that apply to all credential access requests
              </CardDescription>
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
              <CardTitle className="text-base">Plugin Policies</CardTitle>
              <CardDescription className="text-xs">
                Policies that apply to specific plugins
              </CardDescription>
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
              <CardTitle className="text-base">Credential Policies</CardTitle>
              <CardDescription className="text-xs">
                Policies that apply to specific credentials
              </CardDescription>
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
        isCreating={false}
        plugins={plugins}
        credentials={credentials}
        templates={MOCK_TEMPLATES}
      />
      
      <PolicyViewDialog 
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        policyDetails={policyDetails}
        usageHistory={usageHistory}
        isLoading={false}
        onEdit={() => {
          setViewDialogOpen(false)
          if (selectedPolicy) {
            handleEditPolicy(selectedPolicy)
          }
        }}
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
    </DashboardShell>
  )
} 