"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Key, Wallet, Database, Lock, PowerOff, Power } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/use-auth"

interface Plugin {
  id: string
  name: string
  description: string
  version: string
  type: string
  enabled: boolean
}

export function PluginsGrid() {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [loading, setLoading] = useState(true)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const { token } = useAuth()

  useEffect(() => {
    fetchPlugins()
  }, [token])

  const fetchPlugins = async () => {
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to view plugins",
        variant: "destructive"
      })
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/v1/admin/plugins', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (data.success) {
        setPlugins(data.plugins)
      } else {
        toast({
          title: "Error",
          description: `Failed to load plugins: ${data.error}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not connect to server",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const togglePluginStatus = async (plugin: Plugin) => {
    if (!token) return

    setActionInProgress(plugin.id)
    try {
      const action = plugin.enabled ? "disable" : "enable"
      const response = await fetch(`/api/v1/admin/plugins/${plugin.type}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Success",
          description: data.message
        })
        // Update local state
        setPlugins(plugins.map(p => 
          p.id === plugin.id ? { ...p, enabled: !p.enabled } : p
        ))
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update plugin status",
        variant: "destructive"
      })
    } finally {
      setActionInProgress(null)
    }
  }

  const getPluginIcon = (type: string) => {
    switch(type) {
      case 'API_KEY':
        return <Key className="h-5 w-5" />;
      case 'OAUTH':
        return <Lock className="h-5 w-5" />;
      case 'COOKIE':
        return <Database className="h-5 w-5" />;
      default:
        return <Key className="h-5 w-5" />;
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-10" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-10" />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {plugins.map((plugin) => (
        <Card key={plugin.id} className={`flex flex-col ${!plugin.enabled ? 'opacity-60' : ''}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{plugin.name}</CardTitle>
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                {getPluginIcon(plugin.type)}
              </div>
            </div>
            <CardDescription>{plugin.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Version</span>
                <span>{plugin.version}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <span>{plugin.type}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={plugin.enabled ? "default" : "outline"}>
                  {plugin.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant={plugin.enabled ? "destructive" : "default"} 
              className="w-full"
              onClick={() => togglePluginStatus(plugin)}
              disabled={actionInProgress === plugin.id}
            >
              {actionInProgress === plugin.id ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center">
                  {plugin.enabled ? (
                    <>
                      <PowerOff className="mr-2 h-4 w-4" />
                      Disable
                    </>
                  ) : (
                    <>
                      <Power className="mr-2 h-4 w-4" />
                      Enable
                    </>
                  )}
                </span>
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

const plugins = [
  {
    id: "api-key",
    name: "API Key",
    description: "Manage API key credentials for third-party services",
    version: "1.2.0",
    operations: 8,
    policies: 4,
    tags: ["REST", "HTTP", "Authentication"],
    icon: <Key className="h-5 w-5" />,
  },
  {
    id: "oauth",
    name: "OAuth",
    description: "OAuth 1.0 and 2.0 credential management",
    version: "1.1.5",
    operations: 12,
    policies: 5,
    tags: ["OAuth", "Authentication", "Token"],
    icon: <Lock className="h-5 w-5" />,
  },
  {
    id: "ethereum",
    name: "Ethereum",
    description: "Ethereum private key operations and signing",
    version: "1.0.2",
    operations: 15,
    policies: 6,
    tags: ["Blockchain", "Web3", "Crypto"],
    icon: <Wallet className="h-5 w-5" />,
  },
  {
    id: "database",
    name: "Database",
    description: "Secure database credential management",
    version: "1.3.1",
    operations: 10,
    policies: 4,
    tags: ["SQL", "NoSQL", "Connection"],
    icon: <Database className="h-5 w-5" />,
  },
]

