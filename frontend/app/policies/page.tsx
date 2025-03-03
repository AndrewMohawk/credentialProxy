"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { DashboardNav } from "@/components/dashboard-nav"
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
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"

// Define the policy type
type Policy = {
  id: string
  name: string
  type: string
  description: string
  createdAt: string
  updatedAt: string
  isActive: boolean
}

export default function PoliciesPage() {
  const { isAuthenticated, token, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const credentialId = searchParams.get("credential")
  const { toast } = useToast()
  const [policies, setPolicies] = useState<Policy[]>([])
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(true)
  const [filterInfo, setFilterInfo] = useState<{ credential?: { id: string, name: string } }>({})

  // API URL from environment variables or default
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4242/api/v1"

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  // Fetch policies when component mounts or when credentialId changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchPolicies()
    }
  }, [isAuthenticated, credentialId])

  // Function to fetch policies from API
  const fetchPolicies = async () => {
    setIsLoadingPolicies(true)
    try {
      // Add credential filter if provided
      let url = `${API_URL}/policies`
      if (credentialId) {
        url += `?credentialId=${credentialId}`
        
        // Also fetch credential details for filter info
        try {
          const credResponse = await axios.get(`${API_URL}/credentials/${credentialId}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          
          if (credResponse.data.success && credResponse.data.data) {
            setFilterInfo({
              credential: {
                id: credResponse.data.data.id,
                name: credResponse.data.data.name
              }
            })
          }
        } catch (error) {
          console.error("Error fetching credential details:", error)
        }
      } else {
        setFilterInfo({})
      }
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      if (response.data.success) {
        setPolicies(response.data.data || [])
      } else {
        throw new Error(response.data.error || "Failed to fetch policies")
      }
    } catch (error: any) {
      console.error("Error fetching policies:", error)
      toast({
        variant: "destructive",
        title: "Error fetching policies",
        description: error.message || "An error occurred while fetching policies."
      })
      // Initialize with empty array in case of error
      setPolicies([])
    } finally {
      setIsLoadingPolicies(false)
    }
  }

  // Show loading state if still checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-primary mb-4" />
          <p className="text-muted-foreground">Loading policies...</p>
        </div>
      </div>
    )
  }

  // Show nothing if not authenticated (will be redirected)
  if (!isAuthenticated) {
    return null
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date)
  }

  return (
    <DashboardShell>
      <DashboardHeader 
        heading="Policies" 
        text="Manage security and access policies for your credentials."
      >
        <Button asChild>
          <Link href="/policies/new">
            <Plus className="mr-2 h-4 w-4" /> Add Policy
          </Link>
        </Button>
      </DashboardHeader>

      {/* Show filter info if filtering by credential */}
      {filterInfo.credential && (
        <div className="mb-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">Filtering by credential: {filterInfo.credential.name}</h3>
                  <p className="text-sm text-muted-foreground">Showing policies for credential ID: {filterInfo.credential.id}</p>
                </div>
                <Button variant="outline" onClick={() => router.push('/policies')}>
                  Clear Filter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Your Policies</CardTitle>
            <CardDescription>
              View and manage security and access policies.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPolicies ? (
              <div className="animate-pulse space-y-4">
                <div className="h-12 w-full bg-muted rounded-md" />
                <div className="h-12 w-full bg-muted rounded-md" />
                <div className="h-12 w-full bg-muted rounded-md" />
              </div>
            ) : policies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground mb-4">No policies found.</p>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first policy
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className="font-medium">{policy.name}</TableCell>
                      <TableCell>{policy.type}</TableCell>
                      <TableCell>{policy.description}</TableCell>
                      <TableCell>{policy.isActive ? "Active" : "Inactive"}</TableCell>
                      <TableCell>{formatDate(policy.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}

