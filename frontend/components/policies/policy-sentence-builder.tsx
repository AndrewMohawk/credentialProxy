'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Credential } from '@/lib/types/credential';
import { Plugin } from '@/lib/types/plugin';
import { PolicyData } from './natural-language-policy-dialog';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, Hash, Gauge } from 'lucide-react';
import { useVerbRegistry } from '@/hooks/use-verb-registry';
import { VerbScope } from '@/lib/types/verb';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Define the Application interface
interface Application {
  id: string;
  name: string;
  description?: string;
}

// Define the Entity interface for unified selection
interface Entity {
  id: string;
  name: string;
  type: 'application' | 'credential' | 'plugin' | 'any';
  pluginId?: string;
  description?: string;
}

// Define the CommonVerb interface
interface CommonVerb {
  id: string;
  name: string;
  description?: string;
  disabled?: boolean;
  applicableToEntityTypes?: Array<'application' | 'credential' | 'plugin' | 'any'>;
}

// Define condition types
type ConditionType = 'none' | 'time' | 'count' | 'rate';

interface TimeCondition {
  startTime?: string;
  endTime?: string;
  daysOfWeek?: string[];
}

interface CountCondition {
  maxCount: number;
  timeWindow: number; // in minutes
  timeUnit: 'minutes' | 'hours' | 'days';
}

interface RateCondition {
  maxRequests: number;
  perTimeWindow: number; // in seconds
  timeUnit: 'seconds' | 'minutes' | 'hours';
}

export interface PolicySentenceBuilderProps {
  availableCredentials?: Credential[];
  availablePlugins?: Plugin[];
  preselectedCredentialId?: string;
  preselectedScope?: 'global' | 'credential' | 'plugin';
  onPolicyUpdate: (policy: Partial<PolicyData>) => void;
}

export const PolicySentenceBuilder: React.FC<PolicySentenceBuilderProps> = ({
  availableCredentials = [],
  availablePlugins = [],
  preselectedCredentialId,
  preselectedScope = 'global',
  onPolicyUpdate
}) => {
  const [policyName, setPolicyName] = useState<string>('');
  const [policyDescription, setPolicyDescription] = useState<string>('');
  const [action, setAction] = useState<'allow' | 'deny'>('allow');
  const [verb, setVerb] = useState<string>('');
  const [resource, setResource] = useState<string>('');
  const [showDescription, setShowDescription] = useState<boolean>(false);
  const prevPolicyDataRef = useRef<Partial<PolicyData> | null>(null);
  
  // Get verbs from the registry
  const { 
    verbs, 
    categorizedVerbs, 
    loading: verbsLoading,
    fetchVerbsByScope,
    fetchVerbsForCredential,
    fetchVerbsForPlugin
  } = useVerbRegistry();
  
  // State for entities (unified dropdown)
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string>('any-application');

  // State for conditions
  const [conditionType, setConditionType] = useState<ConditionType>('none');
  const [timeCondition, setTimeCondition] = useState<TimeCondition>({
    startTime: '09:00',
    endTime: '17:00',
    daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  });
  const [countCondition, setCountCondition] = useState<CountCondition>({
    maxCount: 100,
    timeWindow: 60,
    timeUnit: 'minutes'
  });
  const [rateCondition, setRateCondition] = useState<RateCondition>({
    maxRequests: 10,
    perTimeWindow: 1,
    timeUnit: 'minutes'
  });
  
  // Initialize entities list
  useEffect(() => {
    const appEntities: Entity[] = [
      { id: 'any-application', name: 'Any application', type: 'application', description: 'Any application that requests access' },
      { id: 'app-ai-bot-1', name: 'AI bot #1', type: 'application', description: 'First AI bot for testing policies' },
      { id: 'app-ai-bot-2', name: 'AI bot #2', type: 'application', description: 'Second AI bot for testing policies' },
      { id: 'app-ai-bot-3', name: 'AI bot #3', type: 'application', description: 'Third AI bot for testing policies' }
    ];
    
    const credentialEntities: Entity[] = availableCredentials.map(cred => ({
      id: `cred-${cred.id}`,
      name: cred.name, 
      type: 'credential',
      description: `Credential: ${cred.name}`
    }));
    
    const pluginEntities: Entity[] = availablePlugins.map(plugin => ({
      id: `plugin-${plugin.id}`,
      name: plugin.name,
      type: 'plugin',
      description: `Plugin: ${plugin.name}`
    }));
    
    // Add "Any credential" and "Any plugin" options
    const anyCredential: Entity = { id: 'any-credential', name: 'Any credential', type: 'credential', description: 'Any credential in the system' };
    const anyPlugin: Entity = { id: 'any-plugin', name: 'Any plugin', type: 'plugin', description: 'Any plugin in the system' };
    
    const allEntities = [
      ...appEntities,
      anyCredential,
      ...credentialEntities,
      anyPlugin,
      ...pluginEntities
    ];
    
    setEntities(allEntities);
    
    // Set preselected entity if provided
    if (preselectedCredentialId) {
      const entityId = `cred-${preselectedCredentialId}`;
      setSelectedEntityId(entityId);
    }
  }, [availableCredentials, availablePlugins, preselectedCredentialId]);

  // Handle entity selection change
  useEffect(() => {
    // Reset verb when entity changes
    setVerb('');
    
    // Parse the entity ID to determine type and actual ID
    const [type, id] = parseEntityId(selectedEntityId);
    
    // Fetch appropriate verbs for the selected entity
    fetchVerbsForSelection(type, id);
  }, [selectedEntityId]);
  
  // Function to parse entity ID format (type-id)
  const parseEntityId = (entityId: string): [string, string] => {
    const parts = entityId.split('-');
    const type = parts[0];
    const id = parts.slice(1).join('-');
    
    return [type, id];
  };
  
  // Fetch verbs for the selected entity
  const fetchVerbsForSelection = async (type: string, id: string) => {
    if (type === 'any') {
      await fetchVerbsByScope(VerbScope.GLOBAL);
    } else if (type === 'cred') {
      await fetchVerbsForCredential(id);
    } else if (type === 'plugin') {
      await fetchVerbsForPlugin(id);
    } else if (type === 'app') {
      await fetchVerbsByScope(VerbScope.GLOBAL);
    }
  };
  
  // Update policy data on changes
  useEffect(() => {
    const currentPolicyData: Partial<PolicyData> = generatePolicyData();
    
    // Only update if the policy data has changed
    if (JSON.stringify(currentPolicyData) !== JSON.stringify(prevPolicyDataRef.current)) {
      prevPolicyDataRef.current = currentPolicyData;
      onPolicyUpdate(currentPolicyData);
    }
  }, [policyName, policyDescription, selectedEntityId, verb, resource, action, conditionType, timeCondition, countCondition, rateCondition]);
  
  const generatePolicyData = (): Partial<PolicyData> => {
    const [entityType, entityId] = parseEntityId(selectedEntityId);
    
    let scope: 'global' | 'credential' | 'plugin' = 'global';
    let credentialId: string | undefined = undefined;
    let pluginId: string | undefined = undefined;
    
    if (entityType === 'cred') {
      scope = 'credential';
      credentialId = entityId;
    } else if (entityType === 'plugin') {
      scope = 'plugin';
      pluginId = entityId;
    }
    
    // Build rules based on selections
    const rules: any[] = [];
    
    // Add basic allow/deny rule
    const baseRule = {
      action: action,
      verb: verb,
      resource: resource || undefined
    };
    
    // Add conditions based on condition type
    if (conditionType === 'time') {
      rules.push({
        ...baseRule,
        timeRestriction: {
          startTime: timeCondition.startTime,
          endTime: timeCondition.endTime,
          daysOfWeek: timeCondition.daysOfWeek
        }
      });
    } else if (conditionType === 'count') {
      rules.push({
        ...baseRule,
        countLimit: {
          maxCount: countCondition.maxCount,
          timeWindow: countCondition.timeWindow,
          timeUnit: countCondition.timeUnit
        }
      });
    } else if (conditionType === 'rate') {
      rules.push({
        ...baseRule,
        rateLimit: {
          maxRequests: rateCondition.maxRequests,
          perTimeWindow: rateCondition.perTimeWindow,
          timeUnit: rateCondition.timeUnit
        }
      });
    } else {
      // No conditions
      rules.push(baseRule);
    }
    
    return {
      name: policyName || generatePolicyName(),
      description: policyDescription || generatePolicyDescription(),
      scope,
      credentialId,
      pluginId,
      rules
    };
  };

  // Helper function to get entity name from ID
  const getEntityName = (): string => {
    const entity = entities.find(e => e.id === selectedEntityId);
    return entity ? entity.name : 'Unknown';
  };
  
  // Helper function to get entity type from ID
  const getEntityType = (): string => {
    const [type] = parseEntityId(selectedEntityId);
    if (type === 'any' || type === 'app') return 'application';
    if (type === 'cred') return 'credential';
    if (type === 'plugin') return 'plugin';
    return 'entity';
  };

  // Get verbs that are applicable to the current entity type
  const getApplicableVerbs = (): CommonVerb[] => {
    if (verbsLoading || !verbs.length) {
      return [{ id: 'loading', name: 'Loading actions...', disabled: true }];
    }
    
    const [type] = parseEntityId(selectedEntityId);
    const entityType = type === 'any' || type === 'app' ? 'application' : 
                       type === 'cred' ? 'credential' : 
                       type === 'plugin' ? 'plugin' : 'any';
    
    // Use verbs from the registry, filter by entity type if needed
    return verbs.map(v => ({
      id: v.id,
      name: v.name,
      description: v.description,
      disabled: false
    }));
  };

  // Generate a policy name based on selections
  const generatePolicyName = (): string => {
    const entityName = getEntityName();
    const verbName = verb ? verbs.find(v => v.id === verb)?.name || verb : 'perform actions';
    return `${action === 'allow' ? 'Allow' : 'Block'} ${entityName} to ${verbName}`;
  };

  // Generate a policy description based on selections
  const generatePolicyDescription = (): string => {
    const entityName = getEntityName();
    const entityType = getEntityType();
    const verbName = verb ? verbs.find(v => v.id === verb)?.name || verb : 'perform actions';
    
    let description = `This policy ${action === 'allow' ? 'allows' : 'blocks'} ${entityName} to ${verbName}`;
    
    // Add condition information
    if (conditionType === 'time') {
      description += ` between ${timeCondition.startTime} and ${timeCondition.endTime}`;
    } else if (conditionType === 'count') {
      description += ` up to ${countCondition.maxCount} times per ${countCondition.timeWindow} ${countCondition.timeUnit}`;
    } else if (conditionType === 'rate') {
      description += ` at a rate of ${rateCondition.maxRequests} requests per ${rateCondition.perTimeWindow} ${rateCondition.timeUnit}`;
    }
    
    return description;
  };

  return (
    <div className="space-y-4">
      {/* Policy name/description area - kept minimal */}
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="policy-name">Policy Name</Label>
          <Badge 
            variant="outline" 
            className="cursor-pointer"
            onClick={() => setShowDescription(!showDescription)}
          >
            {showDescription ? 'Hide Description' : 'Add Description'}
          </Badge>
        </div>
        <Input
          id="policy-name"
          placeholder="Enter policy name or leave blank for auto-generated name"
          value={policyName}
          onChange={(e) => setPolicyName(e.target.value)}
        />
        
        {showDescription && (
          <div className="mt-2">
            <Label htmlFor="policy-description">Description</Label>
            <Textarea
              id="policy-description"
              placeholder="Enter policy description or leave blank for auto-generated description"
              value={policyDescription}
              onChange={(e) => setPolicyDescription(e.target.value)}
              className="mt-1"
            />
          </div>
        )}
      </div>
      
      {/* Simplified natural language policy builder */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {/* Entity Selection - unified dropdown */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">If</span>
              <Select
                value={selectedEntityId}
                onValueChange={setSelectedEntityId}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select application or credential" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any-application">Any application</SelectItem>
                  {entities
                    .filter(entity => entity.id !== 'any-application')
                    .map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.name} ({entity.type})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              
              <span className="text-sm font-medium">wants to</span>
              
              {/* Dynamic Verb Selection based on entity */}
              <Select
                value={verb}
                onValueChange={setVerb}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  {getApplicableVerbs().map((v) => (
                    <SelectItem 
                      key={v.id} 
                      value={v.id}
                      disabled={v.disabled}
                    >
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <span className="text-sm font-medium">then</span>
              
              {/* Action Selection */}
              <Select
                value={action}
                onValueChange={(value: 'allow' | 'deny') => setAction(value)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allow">allow</SelectItem>
                  <SelectItem value="deny">block</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Structured Conditions */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="conditions">
                <AccordionTrigger className="text-sm font-medium py-2">
                  Additional Conditions
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 p-2">
                    <RadioGroup 
                      value={conditionType} 
                      onValueChange={(value) => setConditionType(value as ConditionType)}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="none" id="condition-none" />
                        <Label htmlFor="condition-none">No conditions</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="time" id="condition-time" />
                        <Label htmlFor="condition-time" className="flex items-center gap-1">
                          <Clock className="h-4 w-4" /> Time-based restriction
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="count" id="condition-count" />
                        <Label htmlFor="condition-count" className="flex items-center gap-1">
                          <Hash className="h-4 w-4" /> Usage count limit
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="rate" id="condition-rate" />
                        <Label htmlFor="condition-rate" className="flex items-center gap-1">
                          <Gauge className="h-4 w-4" /> Rate limit
                        </Label>
                      </div>
                    </RadioGroup>
                    
                    {/* Conditional inputs based on selection */}
                    {conditionType === 'time' && (
                      <div className="space-y-3 border rounded-md p-3 bg-muted/30">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="time-start">Start Time</Label>
                            <Input
                              id="time-start"
                              type="time"
                              value={timeCondition.startTime}
                              onChange={(e) => setTimeCondition({...timeCondition, startTime: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="time-end">End Time</Label>
                            <Input
                              id="time-end"
                              type="time"
                              value={timeCondition.endTime}
                              onChange={(e) => setTimeCondition({...timeCondition, endTime: e.target.value})}
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="block mb-2">Days of Week</Label>
                          <div className="flex flex-wrap gap-2">
                            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                              <Badge 
                                key={day}
                                variant={timeCondition.daysOfWeek?.includes(day) ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => {
                                  const days = timeCondition.daysOfWeek || [];
                                  if (days.includes(day)) {
                                    setTimeCondition({
                                      ...timeCondition, 
                                      daysOfWeek: days.filter(d => d !== day)
                                    });
                                  } else {
                                    setTimeCondition({
                                      ...timeCondition,
                                      daysOfWeek: [...days, day]
                                    });
                                  }
                                }}
                              >
                                {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {conditionType === 'count' && (
                      <div className="space-y-3 border rounded-md p-3 bg-muted/30">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="count-max">Maximum Count</Label>
                            <Input
                              id="count-max"
                              type="number"
                              min="1"
                              value={countCondition.maxCount}
                              onChange={(e) => setCountCondition({...countCondition, maxCount: parseInt(e.target.value)})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="count-window">Time Window</Label>
                            <div className="flex gap-2">
                              <Input
                                id="count-window"
                                type="number"
                                min="1"
                                value={countCondition.timeWindow}
                                onChange={(e) => setCountCondition({...countCondition, timeWindow: parseInt(e.target.value)})}
                                className="flex-1"
                              />
                              <Select
                                value={countCondition.timeUnit}
                                onValueChange={(value: 'minutes' | 'hours' | 'days') => setCountCondition({...countCondition, timeUnit: value})}
                              >
                                <SelectTrigger className="w-[100px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="minutes">Minutes</SelectItem>
                                  <SelectItem value="hours">Hours</SelectItem>
                                  <SelectItem value="days">Days</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {conditionType === 'rate' && (
                      <div className="space-y-3 border rounded-md p-3 bg-muted/30">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="rate-max">Maximum Requests</Label>
                            <Input
                              id="rate-max"
                              type="number"
                              min="1"
                              value={rateCondition.maxRequests}
                              onChange={(e) => setRateCondition({...rateCondition, maxRequests: parseInt(e.target.value)})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="rate-window">Per Time Window</Label>
                            <div className="flex gap-2">
                              <Input
                                id="rate-window"
                                type="number"
                                min="1"
                                value={rateCondition.perTimeWindow}
                                onChange={(e) => setRateCondition({...rateCondition, perTimeWindow: parseInt(e.target.value)})}
                                className="flex-1"
                              />
                              <Select
                                value={rateCondition.timeUnit}
                                onValueChange={(value: 'seconds' | 'minutes' | 'hours') => setRateCondition({...rateCondition, timeUnit: value})}
                              >
                                <SelectTrigger className="w-[100px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="seconds">Seconds</SelectItem>
                                  <SelectItem value="minutes">Minutes</SelectItem>
                                  <SelectItem value="hours">Hours</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </CardContent>
      </Card>
      
      {/* Preview of the policy */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Policy Preview</h3>
            <p className="text-sm">
              <span className="font-semibold">{policyName || generatePolicyName()}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {policyDescription || generatePolicyDescription()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 