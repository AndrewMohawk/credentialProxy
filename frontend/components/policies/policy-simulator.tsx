'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Info, CheckCircle, XCircle, PlayCircle } from 'lucide-react';

interface PolicySimulatorProps {
  policy: any;
  credentialId?: string;
}

// Mock applications for simulation
const SIMULATION_APPS = [
  { id: 'app1', name: 'Web Browser' },
  { id: 'app2', name: 'Terminal' },
  { id: 'app3', name: 'Password Manager' },
];

// Mock actions for simulation
const SIMULATION_ACTIONS = [
  { id: 'access_api', name: 'Access API' },
  { id: 'use_credential', name: 'Use credential' },
  { id: 'execute_plugin', name: 'Execute plugin' },
  { id: 'read_system_file', name: 'Read system file' },
  { id: 'make_network_request', name: 'Make network request' },
];

// Mock targets for simulation
const SIMULATION_TARGETS = [
  { id: 'plugin1', name: 'OpenAI API Plugin', type: 'plugin' },
  { id: 'plugin2', name: 'GitHub Connector', type: 'plugin' },
  { id: 'credential1', name: 'AWS Access Key', type: 'credential' },
  { id: 'credential2', name: 'Database Password', type: 'credential' },
];

export function PolicySimulator({ policy, credentialId }: PolicySimulatorProps) {
  const [application, setApplication] = useState('app1');
  const [action, setAction] = useState('access_api');
  const [target, setTarget] = useState('');
  const [simulationResult, setSimulationResult] = useState<'allow' | 'deny' | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Handle running the simulation
  const handleSimulate = () => {
    // Get the selected action details
    const selectedAction = SIMULATION_ACTIONS.find(a => a.id === action);
    if (!selectedAction) return;
    
    // In a real implementation, this would call an API to evaluate the policy
    // For now, we'll do a simple simulation based on the policy configuration
    let result: 'allow' | 'deny' = 'allow'; // Default to allow
    
    if (policy && policy.action) {
      // Check if the policy matches this scenario
      const isEntityMatch = policy.entity === 'any' || policy.entity === application;
      const isActionMatch = policy.action === action;
      const isTargetMatch = !policy.target || policy.target === target;
      
      // If all conditions match, apply the policy decision
      if (isEntityMatch && isActionMatch && isTargetMatch) {
        result = policy.decision || 'deny';
        
        // Apply time restrictions if present
        if (policy.timeRestrictions) {
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          const currentDay = now.getDay();
          
          // Parse time restrictions
          const startTimeParts = policy.timeRestrictions.startTime.split(':').map(Number);
          const endTimeParts = policy.timeRestrictions.endTime.split(':').map(Number);
          const allowedDays = policy.timeRestrictions.daysOfWeek || [];
          
          // Check if current time is within allowed range
          const startTimeMinutes = startTimeParts[0] * 60 + startTimeParts[1];
          const endTimeMinutes = endTimeParts[0] * 60 + endTimeParts[1];
          const currentTimeMinutes = currentHour * 60 + currentMinute;
          
          const isTimeAllowed = currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
          const isDayAllowed = allowedDays.includes(currentDay);
          
          if (!isTimeAllowed || !isDayAllowed) {
            // If outside allowed time/day, reverse the decision
            result = result === 'allow' ? 'deny' : 'allow';
          }
        }
        
        // Apply rate limiting if present (simplified simulation)
        if (policy.rateLimit) {
          // For simulation purposes, randomly decide if rate limit would be hit
          // In a real system, this would check the actual request count
          const rateLimitHit = Math.random() > 0.7; // 30% chance of hitting rate limit
          
          if (rateLimitHit) {
            result = 'deny';
          }
        }
      }
    }
    
    setSimulationResult(result);
    setShowExplanation(true);
  };

  // Get the name of an application by ID
  const getAppName = (id: string) => {
    return SIMULATION_APPS.find(app => app.id === id)?.name || id;
  };
  
  // Get the name of an action by ID
  const getActionName = (id: string) => {
    return SIMULATION_ACTIONS.find(act => act.id === id)?.name || id;
  };
  
  // Get the name of a target by ID
  const getTargetName = (id: string) => {
    return SIMULATION_TARGETS.find(t => t.id === id)?.name || id;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Policy Test Simulator</CardTitle>
        <CardDescription>
          Simulate how your policy will behave in different scenarios
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Application selection */}
          <div>
            <label className="block text-sm font-medium mb-1">Application</label>
            <Select value={application} onValueChange={setApplication}>
              <SelectTrigger>
                <SelectValue placeholder="Select application" />
              </SelectTrigger>
              <SelectContent>
                {SIMULATION_APPS.map(app => (
                  <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Action selection */}
          <div>
            <label className="block text-sm font-medium mb-1">Action</label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger>
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                {SIMULATION_ACTIONS.map(act => (
                  <SelectItem key={act.id} value={act.id}>{act.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Target selection */}
          <div>
            <label className="block text-sm font-medium mb-1">Target (optional)</label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger>
                <SelectValue placeholder="Select target (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {SIMULATION_TARGETS.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Simulation result */}
        {simulationResult && (
          <Alert className={simulationResult === 'allow' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
            {simulationResult === 'allow' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <AlertTitle className={simulationResult === 'allow' ? 'text-green-800' : 'text-red-800'}>
              {simulationResult === 'allow' ? 'Access Allowed' : 'Access Denied'}
            </AlertTitle>
            <AlertDescription className="text-muted-foreground">
              When <span className="font-medium">{getAppName(application)}</span> attempts to{' '}
              <span className="font-medium">{getActionName(action)}</span>
              {target && <span> on <span className="font-medium">{getTargetName(target)}</span></span>},
              the policy will <Badge variant={simulationResult === 'allow' ? 'outline' : 'destructive'}>
                {simulationResult === 'allow' ? 'ALLOW' : 'BLOCK'}</Badge> the access.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Explanation of the simulation result */}
        {showExplanation && (
          <div className="p-4 bg-muted/30 rounded-md border text-sm">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h4 className="font-medium mb-1">Evaluation Process</h4>
                <p className="text-muted-foreground">
                  This policy was evaluated based on the entity, action, and target specified in your simulation.
                  {policy.timeRestrictions && (
                    <span> Time restrictions were also taken into account during evaluation.</span>
                  )}
                  {policy.rateLimit && (
                    <span> Rate limiting was simulated with a 30% chance of limit being reached.</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleSimulate}
          disabled={!policy || !policy.action}
        >
          <PlayCircle className="h-4 w-4 mr-2" />
          Run Simulation
        </Button>
      </CardFooter>
    </Card>
  );
} 