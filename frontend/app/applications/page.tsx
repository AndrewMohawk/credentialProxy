'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { DashboardNav } from '@/components/dashboard-nav';
import apiClient from '@/lib/api-client';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DashboardShell } from '@/components/dashboard-shell';
import { DashboardHeader } from '@/components/dashboard-header';

// Define the application type
type Application = {
  id: string
  name: string
  description: string
  status: string
  createdAt: string
  updatedAt: string
}

export default function ApplicationsPage() {
  const { isAuthenticated, token, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);

  // Get backend configuration from environment variables or use defaults
  const BACKEND_PORT = process.env.NEXT_PUBLIC_BACKEND_PORT || '4242';
  const BACKEND_HOST = process.env.NEXT_PUBLIC_BACKEND_HOST || 'localhost';
  // API URL from environment variables or default with configurable host and port
  const API_URL = process.env.NEXT_PUBLIC_API_URL || `http://${BACKEND_HOST}:${BACKEND_PORT}/api/v1`;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Fetch applications when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      fetchApplications();
    }
  }, [isAuthenticated]);

  // Function to fetch applications from API
  const fetchApplications = async () => {
    setIsLoadingApplications(true);
    try {
      const response = await apiClient.get('/applications');
      
      if (response.success) {
        setApplications(response.data || []);
      } else {
        throw new Error(response.error || 'Failed to fetch applications');
      }
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      toast({
        variant: 'destructive',
        title: 'Error fetching applications',
        description: error.message || 'An error occurred while fetching applications.'
      });
      // Initialize with empty array in case of error
      setApplications([]);
    } finally {
      setIsLoadingApplications(false);
    }
  };

  // Show loading state if still checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-primary mb-4" />
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      </div>
    );
  }

  // Show nothing if not authenticated (will be redirected)
  if (!isAuthenticated) {
    return null;
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  return (
    <DashboardShell>
      <DashboardHeader 
        heading="Applications" 
        text="Manage third-party applications that can access your credentials."
      >
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Application
        </Button>
      </DashboardHeader>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Your Applications</CardTitle>
            <CardDescription>
              View and manage applications that can access your credentials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingApplications ? (
              <div className="animate-pulse space-y-4">
                <div className="h-12 w-full bg-muted rounded-md" />
                <div className="h-12 w-full bg-muted rounded-md" />
                <div className="h-12 w-full bg-muted rounded-md" />
              </div>
            ) : applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground mb-4">No applications found.</p>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Register your first application
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">{application.name}</TableCell>
                      <TableCell>{application.description}</TableCell>
                      <TableCell>{application.status}</TableCell>
                      <TableCell>{formatDate(application.createdAt)}</TableCell>
                      <TableCell>{formatDate(application.updatedAt)}</TableCell>
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
  );
}

