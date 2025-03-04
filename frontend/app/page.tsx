"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Activity, AlarmClock, HeartPulse, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import apiClient from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header" 
import { formatDistanceToNow } from 'date-fns';

// Define metric types
type SystemStatus = {
  apiStatus: boolean
  credentialStoreStatus: boolean
  queueStatus: boolean
}

type DashboardMetrics = {
  credentialCount: number
  applicationCount: number
  policyCount: number
  recentActivity: {
    id: string
    action: string
    target: string
    details: string
    timestamp: string
  }[]
  systemStatus: SystemStatus
}

interface RecentActivity {
  id: string;
  action: string;
  target: string;
  details: any; // Could be string or object
  timestamp: string;
}

// Helper function to format time ago
function formatTimeAgo(dateString: string) {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return dateString;
  }
}

// Helper function to format details that could be an object or string
function formatDetails(details: any): string {
  if (!details) return "";
  
  if (typeof details === "string") {
    try {
      // Try to parse if it's a stringified JSON
      const parsed = JSON.parse(details);
      return formatDetailsObject(parsed);
    } catch {
      // If not parseable, return as is
      return details;
    }
  } else if (typeof details === "object") {
    return formatDetailsObject(details);
  }
  
  return String(details);
}

function formatDetailsObject(obj: any): string {
  if (!obj) return "";
  
  // Special case for login/logout events
  if (obj.method && obj.username) {
    // For authentication events, return a more descriptive message
    const eventType = obj.action || "Authentication";
    return `${eventType} event (${obj.method}) for user ${obj.username}`;
  }
  
  // General case - convert object to readable string
  return Object.entries(obj)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
}

export default function Home() {
  const { isAuthenticated, user, isLoading, logout, token } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true)

  // Get backend configuration from environment variables or use defaults
  const BACKEND_PORT = process.env.NEXT_PUBLIC_BACKEND_PORT || '4242';
  const BACKEND_HOST = process.env.NEXT_PUBLIC_BACKEND_HOST || 'localhost';
  // API URL from environment variables or default with configurable host and port
  const API_URL = process.env.NEXT_PUBLIC_API_URL || `http://${BACKEND_HOST}:${BACKEND_PORT}/api/v1`

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  // Fetch dashboard metrics when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchDashboardMetrics()
    }
  }, [isAuthenticated, isLoading])

  // Function to fetch dashboard metrics
  const fetchDashboardMetrics = async () => {
    setIsLoadingMetrics(true)
    try {
      const response = await apiClient.get('/dashboard/metrics');
      
      if (response.success) {
        setMetrics(response.data)
      } else {
        throw new Error(response.error || "Failed to fetch dashboard metrics")
      }
    } catch (error: any) {
      console.error("Error fetching dashboard metrics:", error)
      toast({
        variant: "destructive",
        title: "Error fetching dashboard metrics",
        description: error.message || "An error occurred while fetching dashboard metrics."
      })
      // Initialize with empty metrics in case of error
      setMetrics({
        credentialCount: 0,
        applicationCount: 0,
        policyCount: 0,
        recentActivity: [],
        systemStatus: {
          apiStatus: false,
          credentialStoreStatus: false,
          queueStatus: false
        }
      })
    } finally {
      setIsLoadingMetrics(false)
    }
  }

  // Show loading state if still checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <Shield className="h-12 w-12 text-primary mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Show nothing if not authenticated (will be redirected)
  if (!isAuthenticated) {
    return null
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        text={`Welcome to the Credential Proxy dashboard, ${user?.username}`}
      />
      
      {isLoadingMetrics ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="py-10">
              <div className="animate-pulse flex flex-col items-center justify-center space-y-2">
                <div className="h-5 w-24 bg-muted rounded"></div>
                <div className="h-8 w-16 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-10">
              <div className="animate-pulse flex flex-col items-center justify-center space-y-2">
                <div className="h-5 w-24 bg-muted rounded"></div>
                <div className="h-8 w-16 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-10">
              <div className="animate-pulse flex flex-col items-center justify-center space-y-2">
                <div className="h-5 w-24 bg-muted rounded"></div>
                <div className="h-8 w-16 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Credentials</CardTitle>
              <CardDescription>
                Manage your secure credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.credentialCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active credentials in your account
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => router.push("/credentials")}>
                View credentials
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Applications</CardTitle>
              <CardDescription>
                Third-party applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.applicationCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                Authorized applications
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => router.push("/applications")}>
                Manage applications
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Policies</CardTitle>
              <CardDescription>
                Security and access policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.policyCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active policies in your account
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => router.push("/policies")}>
                View policies
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest credential usage and events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-muted"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-[250px] bg-muted rounded"></div>
                      <div className="h-4 w-[200px] bg-muted rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {metrics.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.action && activity.action !== "-" 
                          ? `${activity.action}${activity.target && activity.target !== "-" ? ` - ${activity.target}` : ""}`
                          : (activity.details && typeof activity.details === "object" && (activity.details as any).method 
                              ? "Authentication Event" 
                              : "System Event")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDetails(activity.details)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <p>No recent activity to display</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current status of system components
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 w-[150px] bg-muted rounded"></div>
                    <div className="h-6 w-6 rounded-full bg-muted"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`h-3 w-3 rounded-full ${metrics?.systemStatus?.apiStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>API System</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {metrics?.systemStatus?.apiStatus ? 'Operational' : 'Degraded'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`h-3 w-3 rounded-full ${metrics?.systemStatus?.credentialStoreStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>Credential Store</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {metrics?.systemStatus?.credentialStoreStatus ? 'Operational' : 'Degraded'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`h-3 w-3 rounded-full ${metrics?.systemStatus?.queueStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>Queue System</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {metrics?.systemStatus?.queueStatus ? 'Operational' : 'Degraded'}
                  </span>
                </div>
                
                <div className="pt-4">
                  <Button variant="outline" className="w-full" onClick={() => router.push("/system-status")}>
                    View detailed status
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}

