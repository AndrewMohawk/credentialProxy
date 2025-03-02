"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertTriangle, Activity, Clock, Server } from "lucide-react"
import axios from "axios"
import { useAuth } from "@/hooks/use-auth"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

// API URL from environment variables or default
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4242/api/v1"

type SystemMetrics = {
  apiStatus: boolean
  credentialStoreStatus: boolean
  queueStatus: boolean
  responseTime: number
  uptime: number
  cpuUsage: number
  memoryUsage: number
  lastUpdated: string
  historicalData: {
    timestamp: string
    responseTime: number
    cpuUsage: number
    memoryUsage: number
  }[]
}

export function SystemStatus() {
  const { token } = useAuth()
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Function to fetch system metrics
  const fetchSystemMetrics = async () => {
    try {
      setLoading(true)
      // In a real app, this would call a dedicated endpoint
      // For demo purposes, we're using a timeout to simulate API call
      // and generating random data
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Create mock response data with randomized metrics
      const currentTime = new Date()
      const responseTime = Math.floor(Math.random() * 80) + 20 // 20-100ms
      const cpuUsage = Math.floor(Math.random() * 40) + 10 // 10-50%
      const memoryUsage = Math.floor(Math.random() * 60) + 20 // 20-80%
      
      // Generate historical data points (last 24 hours)
      const historicalData = Array.from({ length: 24 }, (_, i) => {
        const timestamp = new Date(currentTime)
        timestamp.setHours(timestamp.getHours() - (24 - i))
        
        return {
          timestamp: timestamp.toISOString(),
          responseTime: Math.floor(Math.random() * 100) + 10,
          cpuUsage: Math.floor(Math.random() * 60) + 10,
          memoryUsage: Math.floor(Math.random() * 80) + 10
        }
      })
      
      // Simulate a real API response with current and historical data
      const mockResponse = {
        apiStatus: true,
        credentialStoreStatus: true,
        queueStatus: true,
        responseTime,
        uptime: 99.98,
        cpuUsage,
        memoryUsage,
        lastUpdated: currentTime.toISOString(),
        historicalData
      }
      
      setMetrics(mockResponse)
      setError(null)
    } catch (err: any) {
      console.error("Error fetching system metrics:", err)
      setError(err.message || "Failed to fetch system metrics")
    } finally {
      setLoading(false)
    }
  }

  // Fetch metrics on component mount
  useEffect(() => {
    fetchSystemMetrics()
    
    // Set up interval for periodic updates (every 10 seconds)
    const intervalId = setInterval(() => {
      fetchSystemMetrics()
    }, 10000)
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }, [])

  // Calculate overall status
  const allSystemsUp = metrics && metrics.apiStatus && 
    metrics.credentialStoreStatus && metrics.queueStatus
  
  // Format timestamp for display
  const formatLastUpdated = (timestamp: string) => {
    if (!timestamp) return "Unknown"
    
    const date = new Date(timestamp)
    return date.toLocaleTimeString()
  }
  
  // Format chart time for display
  const formatChartTime = (timestamp: string) => {
    if (!timestamp) return ""
    
    const date = new Date(timestamp)
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
  }
  
  // Determine status color
  const getStatusColor = (isUp: boolean) => isUp ? "text-green-500" : "text-red-500"
  const getStatusIcon = (isUp: boolean) => isUp ? CheckCircle : AlertTriangle
  
  // Format the chart data
  const chartData = metrics?.historicalData.map(item => ({
    time: formatChartTime(item.timestamp),
    responseTime: item.responseTime,
    cpuUsage: item.cpuUsage,
    memoryUsage: item.memoryUsage
  })) || []

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">System Status</CardTitle>
          {allSystemsUp ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {allSystemsUp ? "Operational" : "Degraded"}
              </div>
              <p className="text-sm text-muted-foreground">
                Last updated: {metrics ? formatLastUpdated(metrics.lastUpdated) : "Loading..."}
              </p>
            </div>
            <Badge variant={allSystemsUp ? "default" : "destructive"} className="text-xs px-2">
              {allSystemsUp ? "All Systems Go" : "Attention Required"}
            </Badge>
          </div>
          
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center space-x-2">
                {metrics?.apiStatus ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium">API System</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {metrics?.apiStatus ? "Operational" : "Degraded"}
              </div>
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center space-x-2">
                {metrics?.credentialStoreStatus ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium">Credential Store</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {metrics?.credentialStoreStatus ? "Operational" : "Degraded"}
              </div>
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center space-x-2">
                {metrics?.queueStatus ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium">Queue System</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {metrics?.queueStatus ? "Operational" : "Degraded"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Current Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.responseTime || '--'}ms</div>
            <Progress className="mt-2" value={metrics?.responseTime || 0} max={200} />
            <p className="mt-2 text-xs text-muted-foreground">
              Target: &lt;100ms
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.cpuUsage || '--'}%</div>
            <Progress className="mt-2" value={metrics?.cpuUsage || 0} max={100} />
            <p className="mt-2 text-xs text-muted-foreground">
              {metrics?.cpuUsage && metrics.cpuUsage > 70 ? "High load detected" : "Normal load"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.memoryUsage || '--'}%</div>
            <Progress className="mt-2" value={metrics?.memoryUsage || 0} max={100} />
            <p className="mt-2 text-xs text-muted-foreground">
              {metrics?.memoryUsage && metrics.memoryUsage > 80 ? "High usage" : "Normal usage"}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Historical Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics (Last 24 Hours)</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="responseTime">
            <TabsList className="mb-4">
              <TabsTrigger value="responseTime">Response Time</TabsTrigger>
              <TabsTrigger value="resourceUsage">Resource Usage</TabsTrigger>
            </TabsList>
            
            <TabsContent value="responseTime" className="h-[300px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="responseTimeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="responseTime" 
                      stroke="#8884d8" 
                      fillOpacity={1} 
                      fill="url(#responseTimeGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">Loading chart data...</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="resourceUsage" className="h-[300px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis label={{ value: 'Usage (%)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="cpuUsage" 
                      stroke="#8884d8" 
                      name="CPU Usage"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="memoryUsage" 
                      stroke="#82ca9d"
                      name="Memory Usage" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">Loading chart data...</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

