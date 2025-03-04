"use client"

import { useState, useEffect } from "react"
import { Policy } from "@/lib/types/policy"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/use-auth"
import apiClient from "@/lib/api-client"  // Import the API client

// Mock data for development purposes
const MOCK_POLICIES: Policy[] = [
  {
    id: "1",
    name: "Global Security Policy",
    type: "ALLOW_LIST",
    description: "Default security policy for all credential access",
    scope: "GLOBAL",
    createdAt: "2023-10-15T14:30:00Z",
    updatedAt: "2023-11-05T09:15:00Z",
    isActive: true
  },
  {
    id: "2",
    name: "AWS Credentials Policy",
    type: "TIME_BASED",
    description: "Restricts AWS credentials usage to business hours only",
    scope: "CREDENTIAL",
    credentialId: "1",
    credentialName: "Production DB Credentials",
    createdAt: "2023-09-12T10:00:00Z",
    updatedAt: "2023-11-01T16:45:00Z",
    isActive: true
  },
  {
    id: "3",
    name: "API Key Rate Limiting",
    type: "RATE_LIMITING",
    description: "Limits API key usage rate to prevent abuse",
    scope: "CREDENTIAL",
    credentialId: "2",
    credentialName: "API Key - Analytics",
    createdAt: "2023-10-20T08:20:00Z",
    updatedAt: "2023-10-20T08:20:00Z",
    isActive: false
  },
  {
    id: "4",
    name: "AWS Vault Access Control",
    type: "PATTERN_MATCH",
    description: "Controls access patterns for the AWS Vault plugin",
    scope: "PLUGIN",
    pluginId: "1",
    pluginName: "AWS Vault",
    createdAt: "2023-10-05T11:10:00Z",
    updatedAt: "2023-11-10T13:25:00Z",
    isActive: true
  }
]

// Mock policy details with usage history
const MOCK_POLICY_DETAILS = {
  "1": {
    ...MOCK_POLICIES[0],
    configuration: {
      allowedOperations: ["GET", "LIST"],
      deniedParameters: ["secretKey", "privateKey"]
    },
    usageHistory: [
      {
        id: "usage1",
        policyId: "1",
        timestamp: "2023-11-12T14:30:00Z",
        status: "ALLOWED",
        details: { operation: "GET", resource: "secrets/api-keys", ip: "192.168.1.100" }
      },
      {
        id: "usage2",
        policyId: "1",
        timestamp: "2023-11-10T16:45:00Z",
        status: "DENIED",
        details: { operation: "UPDATE", resource: "secrets/passwords", ip: "192.168.1.105" }
      }
    ],
    auditEvents: [
      {
        id: "audit1",
        policyId: "1",
        timestamp: "2023-11-05T09:15:00Z",
        action: "POLICY_UPDATED",
        user: "admin@example.com",
        details: { field: "isActive", oldValue: "false", newValue: "true" }
      }
    ]
  },
  "2": {
    ...MOCK_POLICIES[1],
    configuration: {
      startTime: "09:00:00",
      endTime: "17:00:00",
      daysOfWeek: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
      timezone: "UTC"
    },
    usageHistory: [
      {
        id: "usage3",
        policyId: "2",
        timestamp: "2023-11-13T10:30:00Z",
        status: "ALLOWED",
        details: { credential: "aws-prod", operation: "access" }
      }
    ],
    auditEvents: []
  },
  "3": {
    ...MOCK_POLICIES[2],
    configuration: {
      maxRequests: 100,
      timeWindow: 60,
      perIp: true
    },
    usageHistory: [],
    auditEvents: []
  },
  "4": {
    ...MOCK_POLICIES[3],
    configuration: {
      pattern: "^/aws/secrets/[a-zA-Z0-9\\-]+$",
      actionPatterns: ["getSecret", "listSecrets"]
    },
    usageHistory: [],
    auditEvents: []
  }
}

interface FetchPoliciesParams {
  credentialId?: string;
  pluginId?: string;
}

export function usePolicies() {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { toast } = useToast()
  const { token } = useAuth()
  
  // Fetch policies from the API
  const fetchPolicies = async (params?: FetchPoliciesParams) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // If no token is available, use mock data
      if (!token) {
        console.log("No authentication token available, using mock policy data")
        // Filter mock data if params provided
        let filteredPolicies = [...MOCK_POLICIES]
        
        if (params?.credentialId) {
          filteredPolicies = filteredPolicies.filter(p => p.credentialId === params.credentialId)
        }
        
        if (params?.pluginId) {
          filteredPolicies = filteredPolicies.filter(p => p.pluginId === params.pluginId)
        }
        
        setPolicies(filteredPolicies)
        setIsLoading(false)
        return
      }
      
      // Build the query string for filtering
      let queryParams = new URLSearchParams()
      if (params?.credentialId) {
        queryParams.append('credentialId', params.credentialId)
      }
      if (params?.pluginId) {
        queryParams.append('pluginId', params.pluginId)
      }
      
      // Make the API call with our API client
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ''
      const response = await apiClient.get<Policy[]>(`/policies${queryString}`);
      
      if (response.success && response.data) {
        setPolicies(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch policies');
      }
    } catch (err: any) {
      console.error("Error fetching policies:", err)
      setError(err.message || "Failed to fetch policies")
      // Fall back to mock data
      console.log("Using mock policy data due to API error")
      setPolicies(MOCK_POLICIES)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Create a new policy
  const createPolicy = async (policyData: any) => {
    setError(null)
    
    try {
      // If no token is available, use mock implementation
      if (!token) {
        console.log("No authentication token available, using mock implementation")
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Create new policy with mock ID
        const newPolicy: Policy = {
          id: `new-${Date.now()}`,
          name: policyData.name,
          type: policyData.type,
          description: policyData.description,
          scope: policyData.scope,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: policyData.isActive || false,
          pluginId: policyData.pluginId,
          pluginName: policyData.pluginId ? "Mock Plugin" : undefined,
          credentialId: policyData.credentialId,
          credentialName: policyData.credentialId ? "Mock Credential" : undefined
        }
        
        // Update local state
        setPolicies(prev => [...prev, newPolicy])
        
        toast({
          title: "Success",
          description: "Policy created successfully"
        })
        
        return newPolicy
      }
      
      // Use API client for the real API call
      const response = await apiClient.post<Policy>('/policies', policyData);
      
      if (response.success && response.data) {
        // Update local state
        setPolicies(prev => [...prev, response.data as Policy])
        
        toast({
          title: "Success",
          description: "Policy created successfully"
        })
        
        return response.data
      } else {
        throw new Error(response.error || "Failed to create policy")
      }
    } catch (err: any) {
      console.error("Error creating policy:", err)
      setError(err.message || "Failed to create policy")
      
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to create policy"
      })
      
      return null
    }
  }
  
  // Update an existing policy
  const updatePolicy = async (policyId: string, policyData: any) => {
    setError(null)
    
    try {
      // If no token is available, use mock implementation
      if (!token) {
        console.log("No authentication token available, using mock implementation")
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Update policy locally
        const updatedPolicy: Policy = {
          ...policyData,
          id: policyId,
          updatedAt: new Date().toISOString()
        }
        
        // Update local state
        setPolicies(prev => prev.map(p => p.id === policyId ? updatedPolicy : p))
        
        toast({
          title: "Success",
          description: "Policy updated successfully"
        })
        
        return updatedPolicy
      }
      
      // Use API client for the real API call
      const response = await apiClient.put<Policy>(`/policies/${policyId}`, policyData);
      
      if (response.success && response.data) {
        // Update local state
        setPolicies(prev => prev.map(p => p.id === policyId ? response.data as Policy : p))
        
        toast({
          title: "Success",
          description: "Policy updated successfully"
        })
        
        return response.data
      } else {
        throw new Error(response.error || "Failed to update policy")
      }
    } catch (err: any) {
      console.error("Error updating policy:", err)
      setError(err.message || "Failed to update policy")
      
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to update policy"
      })
      
      return null
    }
  }
  
  // Toggle policy active status
  const togglePolicyStatus = async (policyId: string, isActive: boolean) => {
    setError(null)
    
    try {
      // If no token is available, use mock implementation
      if (!token) {
        console.log("No authentication token available, using mock implementation")
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Update policy locally
        setPolicies(prev => prev.map(p => p.id === policyId ? {...p, isActive} : p))
        
        toast({
          title: "Success",
          description: `Policy ${isActive ? 'activated' : 'deactivated'} successfully`
        })
        
        return true
      }
      
      // Use API client for the real API call 
      const response = await apiClient.put<Policy>(`/policies/${policyId}/status`, { isActive });
      
      if (response.success) {
        // Update local state
        setPolicies(prev => prev.map(p => p.id === policyId ? {...p, isActive} : p))
        
        toast({
          title: "Success",
          description: `Policy ${isActive ? 'activated' : 'deactivated'} successfully`
        })
        
        return true
      } else {
        throw new Error(response.error || `Failed to ${isActive ? 'activate' : 'deactivate'} policy`)
      }
    } catch (err: any) {
      console.error("Error toggling policy status:", err)
      setError(err.message || `Failed to ${isActive ? 'activate' : 'deactivate'} policy`)
      
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || `Failed to ${isActive ? 'activate' : 'deactivate'} policy`
      })
      
      return false
    }
  }
  
  // Delete a policy
  const deletePolicy = async (policyId: string) => {
    setError(null)
    
    try {
      // If no token is available, use mock implementation
      if (!token) {
        console.log("No authentication token available, using mock implementation")
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Update policy locally
        setPolicies(prev => prev.filter(p => p.id !== policyId))
        
        toast({
          title: "Success",
          description: "Policy deleted successfully"
        })
        
        return true
      }
      
      // Use API client for the real API call
      const response = await apiClient.delete(`/policies/${policyId}`);
      
      if (response.success) {
        // Update local state
        setPolicies(prev => prev.filter(p => p.id !== policyId))
        
        toast({
          title: "Success",
          description: "Policy deleted successfully"
        })
        
        return true
      } else {
        throw new Error(response.error || "Failed to delete policy")
      }
    } catch (err: any) {
      console.error("Error deleting policy:", err)
      setError(err.message || "Failed to delete policy")
      
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to delete policy"
      })
      
      return false
    }
  }
  
  // Get policy details
  const getPolicyDetails = async (policyId: string) => {
    setError(null)
    
    try {
      // If no token is available, use mock implementation
      if (!token) {
        console.log("No authentication token available, using mock implementation")
        await new Promise(resolve => setTimeout(resolve, 500))
        
        return MOCK_POLICY_DETAILS[policyId as keyof typeof MOCK_POLICY_DETAILS] || null
      }
      
      // Use API client for the real API call
      const response = await apiClient.get(`/policies/${policyId}`);
      
      if (response.success && response.data) {
        return response.data
      } else {
        throw new Error(response.error || "Failed to fetch policy details")
      }
    } catch (err: any) {
      console.error("Error fetching policy details:", err)
      setError(err.message || "Failed to fetch policy details")
      
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to fetch policy details"
      })
      
      // Fall back to mock data
      return MOCK_POLICY_DETAILS[policyId as keyof typeof MOCK_POLICY_DETAILS] || null
    }
  }
  
  // Load policies on component mount or when token changes
  useEffect(() => {
    fetchPolicies()
  }, [token])
  
  return {
    policies,
    isLoading,
    error,
    fetchPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
    togglePolicyStatus,
    getPolicyDetails
  }
} 