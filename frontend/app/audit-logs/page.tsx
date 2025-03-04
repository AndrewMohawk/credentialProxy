"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import axios from "axios"
import { useToast } from "@/components/ui/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import apiClient from "@/lib/api-client"

// Define the audit log type
type AuditLog = {
  id: string
  createdAt: string
  type: string
  details: any // Any type to accommodate different structures
  requestStatus?: string
  user?: {
    id: string
    username: string
  }
  credential?: {
    id: string
    name: string
    type: string
  }
  application?: {
    id: string
    name: string
    status: string
  }
  policy?: {
    id: string
    name: string
    type: string
  }
}

// Helper function to format details
const formatDetails = (details: any): string => {
  if (!details) return 'No details';
  
  // If details is already a string, return it
  if (typeof details === 'string') return details;
  
  // If it's an object, convert to a readable string
  try {
    // Handle specific types of audit logs differently based on the known structure
    if (typeof details === 'object') {
      // For user login/logout events
      if (details.username && details.method) {
        return `${details.method} authentication for ${details.username}`;
      }
      
      // Default case: stringify the object
      return JSON.stringify(details);
    }
    
    // Fallback
    return String(details);
  } catch (error) {
    console.error('Error formatting details:', error);
    return 'Invalid details format';
  }
};

export default function AuditLogsPage() {
  const { isAuthenticated, token, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(true)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // API URL from environment variables or default
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4242/api/v1"

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  // Fetch audit logs when component mounts and authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchAuditLogs()
    }
  }, [isAuthenticated, token, date, typeFilter, statusFilter])

  // Function to fetch audit logs
  const fetchAuditLogs = async () => {
    setIsLoadingLogs(true)
    try {
      const params = {
        date: date ? format(date, 'yyyy-MM-dd') : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      };
      
      const response = await apiClient.get('/audit-logs', { params });
      
      if (response.success) {
        setAuditLogs(response.data || [])
      } else {
        throw new Error(response.error || "Failed to fetch audit logs")
      }
    } catch (error: any) {
      console.error("Error fetching audit logs:", error)
      toast({
        variant: "destructive",
        title: "Error fetching audit logs",
        description: error.message || "An error occurred while fetching audit logs."
      })
      // Initialize with empty array in case of error
      setAuditLogs([])
    } finally {
      setIsLoadingLogs(false)
    }
  }

  // Show loading state if still checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse">Loading audit logs...</div>
      </div>
    )
  }

  // Show nothing if not authenticated (will be redirected)
  if (!isAuthenticated) {
    return null
  }

  // Format date for display
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date)
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Audit Logs" text="View all credential access and usage logs." />
      
      <div className="flex items-center justify-end mb-6 space-x-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {date ? format(date, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="user_login">Login</SelectItem>
            <SelectItem value="user_logout">Logout</SelectItem>
            <SelectItem value="user_register">Registration</SelectItem>
            <SelectItem value="credential_access">Credential Access</SelectItem>
            <SelectItem value="credential_create">Credential Create</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="DENIED">Denied</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="ERROR">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>
            Comprehensive logs of all credential access and usage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingLogs ? (
            <div className="py-20 text-center animate-pulse">
              Loading audit logs...
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-muted-foreground">No audit logs found for the selected filters.</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setDate(undefined)
                  setTypeFilter("all")
                  setStatusFilter("all")
                }}
                className="mt-4"
              >
                <Filter className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Application</TableHead>
                  <TableHead>Credential</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                    <TableCell>{log.type}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        log.requestStatus === 'APPROVED' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                          : log.requestStatus === 'DENIED'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : log.requestStatus === 'PENDING'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {log.requestStatus || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>{log.application?.name || 'N/A'}</TableCell>
                    <TableCell>{log.credential?.name || 'N/A'}</TableCell>
                    <TableCell className="max-w-xs truncate">{formatDetails(log.details)}</TableCell>
                    <TableCell>{log.user?.username || 'System'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  )
}

