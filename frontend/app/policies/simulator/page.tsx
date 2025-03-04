"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { AlertCircle, CheckCircle2, ChevronLeft, PlayCircle, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import apiClient from "@/lib/api-client"

// Temporary component replacements
const LoadingSpinner = ({ className }: { className?: string }) => (
  <div className={`animate-spin ${className || ''}`}>
    <PlayCircle />
  </div>
);

const PageTitle = ({ title }: { title: string }) => (
  <h1 className="text-3xl font-bold tracking-tight mb-4">{title}</h1>
);

const Alert = ({ 
  variant, 
  className, 
  children 
}: { 
  variant?: "default" | "destructive" | "outline" | "secondary"; 
  className?: string; 
  children: React.ReactNode 
}) => (
  <div className={`rounded-lg p-4 ${variant === 'destructive' ? 'bg-destructive/15 text-destructive' : 'bg-primary/15 text-primary'} ${className || ''}`}>
    {children}
  </div>
);

const AlertTitle = ({ children }: { children: React.ReactNode }) => (
  <h5 className="font-medium mb-1">{children}</h5>
);

const AlertDescription = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

export default function PolicySimulatorPage() {
  const { user, isLoading: loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<string>('');
  const [selectedCredential, setSelectedCredential] = useState<string>('');
  const [operation, setOperation] = useState<string>('');
  const [parametersJson, setParametersJson] = useState<string>('{\n  "key": "value"\n}');
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  // Fetch applications and credentials
  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        try {
          const [appsResponse, credsResponse] = await Promise.all([
            apiClient.get('/applications'),
            apiClient.get('/credentials')
          ]);
          
          if (appsResponse.success && credsResponse.success) {
            setApplications(appsResponse.data);
            setCredentials(credsResponse.data);
          } else {
            throw new Error("Failed to fetch applications or credentials");
          }
        } catch (err: any) {
          console.error('Error fetching data:', err);
          setError(err.message || 'Failed to load applications and credentials');
        }
      };

      fetchData();
    }
  }, [isAuthenticated]);

  // Function to run the policy simulation
  const runSimulation = async () => {
    if (!selectedApplication || !selectedCredential || !operation) {
      setError('Please select an application, credential, and operation');
      return;
    }

    let parameters;
    try {
      parameters = JSON.parse(parametersJson);
    } catch (err) {
      setError('Invalid JSON in parameters field');
      return;
    }

    setIsSimulating(true);
    setError(null);
    setSimulationResult(null);

    try {
      const response = await apiClient.post('/policies/simulate', {
        applicationId: selectedApplication,
        credentialId: selectedCredential,
        operation,
        parameters
      });
      
      if (response.success) {
        setSimulationResult(response.data);
      } else {
        throw new Error(response.error || "Simulation failed");
      }
    } catch (err: any) {
      console.error('Simulation error:', err);
      setError(err.message || 'Failed to run policy simulation');
    } finally {
      setIsSimulating(false);
    }
  };

  // Function to save the current test as a new policy
  const saveAsPolicy = () => {
    if (!selectedCredential) {
      setError('Please select a credential to create a policy');
      return;
    }

    // Navigate to the policy creation page with pre-filled values
    const queryParams = new URLSearchParams({
      createPolicy: 'true',
      credentialId: selectedCredential,
      applicationId: selectedApplication || '',
      operation: operation || '',
      parameters: parametersJson
    }).toString();

    router.push(`/policies?${queryParams}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-2"
          onClick={() => router.push('/policies')}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Policies
        </Button>
      </div>

      <PageTitle title="Policy Simulator" />
      <p className="text-muted-foreground mb-8">
        Test how your policies will evaluate specific operations without actually executing them.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Request Configuration */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Request Configuration</CardTitle>
            <CardDescription>
              Configure the request parameters to simulate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="application">Application</Label>
                <Select
                  value={selectedApplication}
                  onValueChange={setSelectedApplication}
                >
                  <SelectTrigger id="application">
                    <SelectValue placeholder="Select an application" />
                  </SelectTrigger>
                  <SelectContent>
                    {applications.map(app => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="credential">Credential</Label>
                <Select
                  value={selectedCredential}
                  onValueChange={setSelectedCredential}
                >
                  <SelectTrigger id="credential">
                    <SelectValue placeholder="Select a credential" />
                  </SelectTrigger>
                  <SelectContent>
                    {credentials.map(cred => (
                      <SelectItem key={cred.id} value={cred.id}>
                        {cred.name} ({cred.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="operation">Operation</Label>
                <Input
                  id="operation"
                  value={operation}
                  onChange={e => setOperation(e.target.value)}
                  placeholder="e.g., getToken, executeQuery"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parameters">Parameters (JSON)</Label>
                <Textarea
                  id="parameters"
                  value={parametersJson}
                  onChange={e => setParametersJson(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setParametersJson('{\n  "key": "value"\n}');
                setOperation('');
              }}
            >
              Reset
            </Button>
            <Button 
              onClick={runSimulation}
              disabled={isSimulating}
            >
              {isSimulating ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Simulating...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Run Simulation
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Results Panel */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Simulation Results</CardTitle>
            <CardDescription>
              See how your policies would evaluate this request
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[400px]">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!simulationResult && !error && !isSimulating && (
              <div className="h-full flex items-center justify-center text-muted-foreground flex-col">
                <PlayCircle className="h-16 w-16 mb-4 opacity-20" />
                <p>Run a simulation to see results</p>
              </div>
            )}

            {simulationResult && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Status</h3>
                  {simulationResult.result.status === 'APPROVED' ? (
                    <Badge variant="secondary" className="text-md px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Approved
                    </Badge>
                  ) : simulationResult.result.status === 'PENDING' ? (
                    <Badge variant="secondary" className="text-md px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      Pending Approval
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-md px-3 py-1">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Denied
                    </Badge>
                  )}
                </div>

                {simulationResult.result.policyId && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Matched Policy</h3>
                    <p className="font-mono bg-muted p-2 rounded-md">
                      {simulationResult.result.policyId}
                    </p>
                  </div>
                )}

                {simulationResult.result.reason && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Reason</h3>
                    <p className="bg-muted p-2 rounded-md">
                      {simulationResult.result.reason}
                    </p>
                  </div>
                )}

                <Separator />

                <div>
                  <h3 className="text-md font-medium mb-3">Evaluated Policies</h3>
                  {simulationResult.metadata.policiesEvaluated === 0 ? (
                    <p className="text-muted-foreground">No policies found for this credential/application combination.</p>
                  ) : (
                    <ScrollArea className="max-h-[200px]">
                      <Accordion type="single" collapsible className="w-full">
                        {simulationResult.metadata.policies.map((policy: any) => (
                          <AccordionItem key={policy.id} value={policy.id}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center space-x-2">
                                <span>{policy.name}</span>
                                <Badge variant="outline">{policy.type}</Badge>
                                {policy.id === simulationResult.result.policyId && (
                                  <Badge variant="secondary">Matched</Badge>
                                )}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 text-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="text-muted-foreground">ID:</div>
                                  <div className="font-mono">{policy.id}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="text-muted-foreground">Type:</div>
                                  <div>{policy.type}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="text-muted-foreground">Priority:</div>
                                  <div>{policy.priority}</div>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </ScrollArea>
                  )}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              className="ml-auto"
              variant="outline"
              onClick={saveAsPolicy}
              disabled={isSimulating || !selectedCredential}
            >
              <Save className="mr-2 h-4 w-4" />
              Save as Policy
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 