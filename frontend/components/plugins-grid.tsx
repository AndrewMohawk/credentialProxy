"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Key, Wallet, Database, Lock, PowerOff, Power, Github } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { usePlugins, Plugin } from "@/hooks/plugins/use-plugins"

export function PluginsGrid() {
  const { toast } = useToast()
  const { plugins, isLoading, error, refreshPlugins, togglePluginStatus } = usePlugins()
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  const handleToggleStatus = async (plugin: Plugin) => {
    if (!plugin.id) return

    setActionInProgress(plugin.id)
    try {
      const result = await togglePluginStatus(plugin.id, !plugin.enabled)
      
      if (!result) {
        // The hook already shows an error toast, but we might want to add additional handling here
        console.error("Failed to toggle plugin status")
      }
    } finally {
      setActionInProgress(null)
    }
  }

  const getPluginIcon = (type: string | undefined) => {
    if (!type) return <Key className="h-5 w-5" />
    
    switch(type.toUpperCase()) {
      case 'API_KEY':
        return <Key className="h-5 w-5" />
      case 'OAUTH':
        return <Lock className="h-5 w-5" />
      case 'AWS':
        return <Database className="h-5 w-5" />
      case 'GITHUB':
        return <Github className="h-5 w-5" />
      default:
        return <Key className="h-5 w-5" />
    }
  }

  if (isLoading) {
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

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-md bg-red-50 text-red-800 mb-4">
        <h3 className="font-semibold">Error loading plugins</h3>
        <p>{error}</p>
        <Button 
          variant="outline" 
          className="mt-2" 
          onClick={() => refreshPlugins()}
        >
          Try Again
        </Button>
      </div>
    )
  }

  if (plugins.length === 0) {
    return (
      <div className="p-4 border border-gray-200 rounded-md bg-gray-50 text-gray-800 mb-4">
        <h3 className="font-semibold">No Plugins Found</h3>
        <p>No credential plugins are currently available.</p>
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
            <CardDescription>{plugin.description || 'No description available'}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Version</span>
                <span>{plugin.version || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <span>{plugin.type || 'Unknown'}</span>
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
              onClick={() => handleToggleStatus(plugin)}
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

