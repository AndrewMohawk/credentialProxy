'use client';

import React, { useState } from 'react';
import { Policy } from '@/lib/types/policy';
import { policyApi } from '@/lib/api-client';
import { Alert } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface PolicySimulatorProps {
  policy: Partial<Policy>;
  credentialId?: string;
}

interface SimulationResult {
  passed: boolean;
  result: 'ALLOWED' | 'DENIED' | 'INVALID_POLICY';
  details: string;
  validationErrors?: Array<{
    path?: string;
    message: string;
  }>;
}

export function PolicySimulator({ policy, credentialId }: PolicySimulatorProps) {
  const [simulationRequest, setSimulationRequest] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  // Default simulation request with credential ID if provided
  React.useEffect(() => {
    const defaultRequest = {
      credentialId: credentialId || 'credential-id',
      operationType: 'READ',
      resource: '/api/resource',
      ipAddress: '192.168.1.100',
      timestamp: new Date().toISOString(),
      parameters: {}
    };

    setSimulationRequest(JSON.stringify(defaultRequest, null, 2));
  }, [credentialId]);

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    
    try {
      // Parse the simulation request
      const operationRequest = JSON.parse(simulationRequest);
      
      // Run the simulation
      const response = await policyApi.simulatePolicy(policy, operationRequest);
      setResult(response.data);
    } catch (err) {
      console.error('Simulation error:', err);
      setResult({
        passed: false,
        result: 'INVALID_POLICY',
        details: 'Failed to run simulation. Please check your policy and request format.',
        validationErrors: [{
          message: err instanceof Error ? err.message : 'Unknown error'
        }]
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const getResultColor = () => {
    if (!result) return '';
    
    switch (result.result) {
      case 'ALLOWED':
        return 'text-green-600';
      case 'DENIED':
        return 'text-amber-600';
      case 'INVALID_POLICY':
        return 'text-red-600';
      default:
        return '';
    }
  };

  const getResultIcon = () => {
    if (!result) return null;
    
    switch (result.result) {
      case 'ALLOWED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'DENIED':
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case 'INVALID_POLICY':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full space-y-4">
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-2">Simulation Request</h3>
        <p className="text-sm text-gray-500 mb-4">
          Edit the request JSON below to simulate a credential operation.
        </p>
        
        <Textarea
          value={simulationRequest}
          onChange={(e) => setSimulationRequest(e.target.value)}
          className="min-h-[200px] font-mono text-sm"
        />
        
        <Button 
          className="mt-4"
          onClick={handleRunSimulation}
          disabled={isSimulating}
        >
          <Play className="h-4 w-4 mr-2" />
          Run Simulation
        </Button>
      </Card>
      
      {result && (
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-2">Simulation Result</h3>
          
          <div className="flex items-center space-x-2 mb-4">
            {getResultIcon()}
            <span className={`font-medium ${getResultColor()}`}>
              {result.result}
            </span>
          </div>
          
          <p className="text-sm mb-2">{result.details}</p>
          
          {result.validationErrors && result.validationErrors.length > 0 && (
            <Alert variant="destructive" className="mt-2">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <div>
                <p className="font-medium">Validation errors:</p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  {result.validationErrors.map((error, index) => (
                    <li key={index}>
                      {error.path ? `${error.path}: ${error.message}` : error.message}
                    </li>
                  ))}
                </ul>
              </div>
            </Alert>
          )}
        </Card>
      )}
    </div>
  );
} 