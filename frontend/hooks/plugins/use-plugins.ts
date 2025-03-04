"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/use-auth"
import apiClient from "@/lib/api-client"  // Import the API client

// Define the Plugin interface
export interface Plugin {
  id: string
  name: string
  type?: string
  description?: string
  version?: string
  enabled?: boolean
  isActive?: boolean
  [key: string]: any
}

// Define possible response formats
interface PluginsResponse {
  plugins: Plugin[]
  [key: string]: any
}

// Mock data for development or fallback
const MOCK_PLUGINS: Plugin[] = [
  {
    id: "api-key-plugin",
    name: "API Key Plugin",
    type: "API_KEY",
    description: "Manage API key credentials for third-party services",
    version: "1.2.0",
    enabled: true
  },
  {
    id: "oauth-plugin",
    name: "OAuth Plugin",
    type: "OAUTH",
    description: "OAuth 1.0 and 2.0 credential management",
    version: "1.1.5",
    enabled: true
  },
  {
    id: "aws-plugin",
    name: "AWS Plugin",
    type: "AWS",
    description: "AWS credentials and IAM role management",
    version: "1.0.2",
    enabled: true
  }
]

export function usePlugins() {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { toast } = useToast()
  const { token } = useAuth()
  
  // Fetch plugins from the API
  const fetchPlugins = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // If no token is available, use mock data
      if (!token) {
        console.log("No authentication token available, using mock plugin data")
        setPlugins(MOCK_PLUGINS)
        setIsLoading(false)
        return
      }
      
      // Try to fetch plugins from either admin or public endpoint
      let pluginsData: Plugin[] = []
      let fetchError: Error | null = null
      
      // First try the admin endpoint
      try {
        const adminResponse = await apiClient.get<PluginsResponse>('/admin/plugins')
        if (adminResponse.success && adminResponse.data?.plugins) {
          pluginsData = adminResponse.data.plugins
        }
      } catch (adminError: any) {
        console.log("Admin plugins endpoint failed:", adminError.message)
        fetchError = adminError
        // Continue to try the public endpoint
      }
      
      // If admin endpoint failed, try the standard endpoint
      if (pluginsData.length === 0) {
        try {
          const pluginsResponse = await apiClient.get<PluginsResponse>('/plugins')
          if (pluginsResponse.success && pluginsResponse.data?.plugins) {
            pluginsData = pluginsResponse.data.plugins
            fetchError = null // Clear the error if this succeeded
          }
        } catch (pluginsError: any) {
          console.log("Plugins endpoint failed:", pluginsError.message)
          
          // Try the old API endpoint as a last resort
          try {
            const apiResponse = await apiClient.get<PluginsResponse>('/api/plugins')
            if (apiResponse.success && apiResponse.data?.plugins) {
              pluginsData = apiResponse.data.plugins
              fetchError = null // Clear the error if this succeeded
            }
          } catch (apiError: any) {
            console.log("API plugins endpoint failed:", apiError.message)
            // If all failed, prefer the first error
            if (!fetchError) {
              fetchError = apiError
            }
          }
        }
      }
      
      // If we successfully fetched plugins from any endpoint
      if (pluginsData.length > 0) {
        setPlugins(pluginsData)
      } else if (fetchError) {
        // If all endpoints failed, throw the error
        throw fetchError
      } else {
        // If no data but also no error, return empty array
        setPlugins([])
      }
    } catch (err: any) {
      console.error("Error fetching plugins:", err)
      setError(err.message || "Failed to fetch plugins")
      
      // Fall back to mock data
      console.log("Using mock plugin data due to API error")
      setPlugins(MOCK_PLUGINS)
      
      toast({
        title: "Warning",
        description: "Unable to load plugins from server. Using sample data.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Enable or disable a plugin
  const togglePluginStatus = async (pluginId: string, enable: boolean): Promise<boolean> => {
    setError(null)
    
    try {
      // If no token is available, use mock implementation
      if (!token) {
        console.log("No authentication token available, using mock implementation")
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Update plugins locally
        setPlugins(prev => prev.map(p => 
          p.id === pluginId ? {...p, enabled: enable} : p
        ))
        
        toast({
          title: "Success",
          description: `Plugin ${enable ? 'enabled' : 'disabled'} successfully`
        })
        
        return true
      }
      
      const action = enable ? "enable" : "disable";
      
      // Use the new dedicated plugin routes for enable/disable
      const response = await apiClient.post(`/plugins/${pluginId}/${action}`);
      
      if (response.success) {
        // Update local state
        setPlugins(prev => prev.map(p => 
          p.id === pluginId ? {...p, enabled: enable} : p
        ))
        
        toast({
          title: "Success",
          description: `Plugin ${enable ? 'enabled' : 'disabled'} successfully`
        })
        
        return true
      } else {
        throw new Error(response.error || `Failed to ${action} plugin`)
      }
    } catch (err: any) {
      console.error(`Error ${enable ? 'enabling' : 'disabling'} plugin:`, err)
      setError(err.message || `Failed to ${enable ? 'enable' : 'disable'} plugin`)
      
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || `Failed to ${enable ? 'enable' : 'disable'} plugin`
      })
      
      return false
    }
  }
  
  // Load plugins on component mount or when token changes
  useEffect(() => {
    fetchPlugins()
  }, [token])
  
  return {
    plugins,
    isLoading,
    error,
    refreshPlugins: fetchPlugins,
    togglePluginStatus
  }
} 