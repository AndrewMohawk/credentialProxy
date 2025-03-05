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
import { AlertCircle } from 'lucide-react';
import { useVerbRegistry } from '@/hooks/use-verb-registry';
import { VerbScope } from '@/lib/types/verb';

// Define the Application interface
interface Application {
  id: string;
  name: string;
  description?: string;
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
  const [scope, setScope] = useState<'global' | 'credential' | 'plugin'>(preselectedScope);
  const [credentialId, setCredentialId] = useState<string | undefined>(preselectedCredentialId);
  const [pluginId, setPluginId] = useState<string | undefined>(undefined);
  const [action, setAction] = useState<'allow' | 'deny'>('allow');
  const [verb, setVerb] = useState<string>('');
  const [resource, setResource] = useState<string>('');
  const [conditions, setConditions] = useState<string>('');
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
  
  // Add state for applications
  const [applications, setApplications] = useState<Application[]>([
    { id: 'any', name: 'Any application', description: 'Any application that requests access' },
    { id: 'ai-bot-1', name: 'AI bot #1', description: 'First AI bot for testing policies' },
    { id: 'ai-bot-2', name: 'AI bot #2', description: 'Second AI bot for testing policies' },
    { id: 'ai-bot-3', name: 'AI bot #3', description: 'Third AI bot for testing policies' }
  ]);
  
  // Add state for selected application
  const [selectedApplication, setSelectedApplication] = useState<string>('any');

  // Initialize with preselected values
  useEffect(() => {
    if (preselectedScope) {
      setScope(preselectedScope);
    }
    
    if (preselectedCredentialId) {
      setCredentialId(preselectedCredentialId);
    } else if (availableCredentials.length > 0 && !credentialId) {
      setCredentialId(availableCredentials[0].id);
    }
  }, [preselectedScope, preselectedCredentialId, availableCredentials, credentialId]);

  // Fetch verbs for the selected credential or plugin
  useEffect(() => {
    const fetchVerbsForSelection = async () => {
      if (scope === 'credential' && credentialId) {
        try {
          await fetchVerbsForCredential(credentialId);
        } catch (error) {
          console.error('Error fetching verbs for credential:', error);
        }
      } else if (scope === 'plugin' && pluginId) {
        try {
          await fetchVerbsForPlugin(pluginId);
        } catch (error) {
          console.error('Error fetching verbs for plugin:', error);
        }
      } else {
        // For global scope, fetch global verbs
        try {
          await fetchVerbsByScope(VerbScope.GLOBAL);
        } catch (error) {
          console.error('Error fetching global verbs:', error);
        }
      }
    };

    fetchVerbsForSelection();
  }, [scope, credentialId, pluginId, fetchVerbsByScope, fetchVerbsForCredential, fetchVerbsForPlugin]);

  // Update the policy when any field changes
  useEffect(() => {
    const rules = [];
    
    if (verb && resource) {
      rules.push({
        action,
        verb,
        resource,
        conditions: conditions || undefined,
        applicationId: selectedApplication !== 'any' ? selectedApplication : undefined
      });
    }
    
    const policyData: Partial<PolicyData> = {
      name: policyName,
      description: policyDescription,
      scope,
      rules,
      applicationId: selectedApplication !== 'any' ? selectedApplication : undefined
    };
    
    if (scope === 'credential' && credentialId) {
      policyData.credentialId = credentialId;
    } else if (scope === 'plugin' && pluginId) {
      policyData.pluginId = pluginId;
    }
    
    // Use a ref to track previous values and prevent unnecessary updates
    const policyDataString = JSON.stringify(policyData);
    if (policyDataString !== JSON.stringify(prevPolicyDataRef.current)) {
      prevPolicyDataRef.current = JSON.parse(policyDataString);
      onPolicyUpdate(policyData);
    }
  }, [policyName, policyDescription, scope, credentialId, pluginId, action, verb, resource, conditions, selectedApplication, onPolicyUpdate]);

  // Reset verb and resource when application changes
  useEffect(() => {
    // Reset verb and resource when application changes
    setVerb('');
    setResource('');
  }, [selectedApplication]);

  // Common verbs based on scope and selected application
  const getCommonVerbs = () => {
    // Check if we have a Twitter credential selected
    const isTwitterCredential = scope === 'credential' && 
      credentialId && 
      availableCredentials.find(c => c.id === credentialId)?.name?.toLowerCase().includes('twitter');

    // Check if we have a specific AI bot selected
    const isAiBot = selectedApplication !== 'any' && selectedApplication.startsWith('ai-bot');

    // If we have verbs from the registry, use them
    if (verbs && verbs.length > 0) {
      // Filter verbs based on scope
      let filteredVerbs = verbs;
      
      if (scope === 'credential' && credentialId) {
        // Filter verbs for the selected credential
        filteredVerbs = verbs.filter(v => 
          v.scope === 'CREDENTIAL' && 
          (!v.credentialType || v.credentialType === availableCredentials.find(c => c.id === credentialId)?.type)
        );
      } else if (scope === 'plugin' && pluginId) {
        // Filter verbs for the selected plugin
        filteredVerbs = verbs.filter(v => 
          v.scope === 'PLUGIN' && 
          (!v.pluginType || v.pluginType === availablePlugins.find(p => p.id === pluginId)?.type)
        );
      } else {
        // Global scope
        filteredVerbs = verbs.filter(v => v.scope === 'GLOBAL');
      }
      
      // Return unique verb operations
      return Array.from(new Set(filteredVerbs.map(v => v.operation)));
    }

    // Fallback to hardcoded verbs if registry is empty
    if (isTwitterCredential || isAiBot) {
      return ['read', 'post', 'view', 'like', 'retweet', 'follow', 'message', 'search', 'analyze'];
    }

    switch (scope) {
      case 'global':
        return ['access', 'read', 'write', 'execute', 'connect', 'query', 'analyze'];
      case 'credential':
        return ['use', 'read', 'write', 'delete', 'list', 'access', 'query'];
      case 'plugin':
        return ['run', 'execute', 'configure', 'access', 'modify', 'analyze'];
      default:
        return [];
    }
  };

  // Common resources based on scope, selected application, and verb
  const getCommonResources = () => {
    // Check if we have a Twitter credential selected
    const isTwitterCredential = scope === 'credential' && 
      credentialId && 
      availableCredentials.find(c => c.id === credentialId)?.name?.toLowerCase().includes('twitter');

    // Check if we have a specific AI bot selected
    const isAiBot = selectedApplication !== 'any' && selectedApplication.startsWith('ai-bot');

    // If we have verbs from the registry, use their resources
    if (verbs && verbs.length > 0) {
      // Filter verbs based on scope
      let filteredVerbs = verbs;
      
      if (scope === 'credential' && credentialId) {
        // Filter verbs for the selected credential
        filteredVerbs = verbs.filter(v => 
          v.scope === 'CREDENTIAL' && 
          (!v.credentialType || v.credentialType === availableCredentials.find(c => c.id === credentialId)?.type)
        );
      } else if (scope === 'plugin' && pluginId) {
        // Filter verbs for the selected plugin
        filteredVerbs = verbs.filter(v => 
          v.scope === 'PLUGIN' && 
          (!v.pluginType || v.pluginType === availablePlugins.find(p => p.id === pluginId)?.type)
        );
      } else {
        // Global scope
        filteredVerbs = verbs.filter(v => v.scope === 'GLOBAL');
      }
      
      // Return unique resources
      return Array.from(new Set(filteredVerbs.map(v => v.name).filter(Boolean)));
    }

    // Fallback to hardcoded resources if registry is empty
    if (isTwitterCredential || isAiBot) {
      // Context-aware resources based on the selected verb
      if (verb === 'read' || verb === 'view') {
        return ['tweets', 'profile', 'timeline', 'followers', 'following', 'trends', 'hashtags'];
      } else if (verb === 'post') {
        return ['tweets', 'replies', 'direct messages'];
      } else if (verb === 'like' || verb === 'retweet') {
        return ['tweets', 'replies'];
      } else if (verb === 'follow') {
        return ['users', 'topics', 'hashtags'];
      } else if (verb === 'message') {
        return ['users', 'groups'];
      } else if (verb === 'search' || verb === 'analyze') {
        return ['tweets', 'users', 'trends', 'hashtags', 'mentions'];
      }
      
      return ['tweets', 'profile', 'timeline', 'followers', 'following', 'direct messages', 'trends', 'hashtags', 'mentions'];
    }

    // Context-aware resources based on the selected verb
    if (verb === 'read' || verb === 'access') {
      switch (scope) {
        case 'global':
          return ['files', 'database', 'api', 'user data', 'system information'];
        case 'credential':
          return ['token', 'secret', 'key', 'account', 'profile'];
        case 'plugin':
          return ['data', 'configuration', 'logs', 'api'];
        default:
          return [];
      }
    } else if (verb === 'write' || verb === 'modify') {
      switch (scope) {
        case 'global':
          return ['files', 'database', 'configuration', 'user data'];
        case 'credential':
          return ['token', 'secret', 'key', 'settings'];
        case 'plugin':
          return ['data', 'configuration', 'settings'];
        default:
          return [];
      }
    } else if (verb === 'execute' || verb === 'run') {
      switch (scope) {
        case 'global':
          return ['commands', 'scripts', 'functions', 'services'];
        case 'credential':
          return ['operations', 'functions', 'methods'];
        case 'plugin':
          return ['functions', 'methods', 'operations', 'services'];
        default:
          return [];
      }
    }

    switch (scope) {
      case 'global':
        return ['system', 'network', 'file', 'database', 'api', 'user data', 'analytics'];
      case 'credential':
        return ['secret', 'key', 'token', 'password', 'certificate', 'account', 'profile'];
      case 'plugin':
        return ['function', 'data', 'api', 'service', 'resource', 'configuration', 'logs'];
      default:
        return [];
    }
  };

  // Get the application name based on scope
  const getApplicationName = () => {
    // If a specific application is selected, return its name
    if (selectedApplication !== 'any') {
      const app = applications.find(a => a.id === selectedApplication);
      if (app) return app.name;
    }
    
    // Otherwise, use the credential or plugin name
    if (scope === 'credential' && credentialId) {
      const credential = availableCredentials.find(c => c.id === credentialId);
      
      // Special handling for Twitter credentials
      if (credential?.name?.toLowerCase().includes('twitter')) {
        return 'AI bot #1';  // Display AI bot #1 for Twitter credentials
      }
      
      return credential?.name || 'Selected Credential';
    } else if (scope === 'plugin' && pluginId) {
      const plugin = availablePlugins.find(p => p.id === pluginId);
      return plugin?.name || 'Selected Plugin';
    }
    return 'Any application';
  };

  // Generate a policy name if not set
  useEffect(() => {
    if (!policyName && verb && resource) {
      const appName = getApplicationName();
      const actionWord = action === 'allow' ? 'Allow' : 'Block';
      setPolicyName(`${actionWord} ${appName} to ${verb} ${resource}`);
    }
  }, [action, verb, resource, scope, credentialId, pluginId]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <Label htmlFor="policy-name" className="flex items-center">
                  Policy Name <span className="text-red-500 ml-1">*</span>
                </Label>
                {!policyName && (
                  <span className="text-xs text-muted-foreground flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" /> Required
                  </span>
                )}
              </div>
              <Input
                id="policy-name"
                placeholder="Enter a name for this policy"
                value={policyName}
                onChange={(e) => setPolicyName(e.target.value)}
                className={!policyName ? "border-red-200 focus-visible:ring-red-200" : ""}
              />
            </div>
            
            {showDescription ? (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <Label htmlFor="policy-description">Description (Optional)</Label>
                  <button 
                    className="text-xs text-muted-foreground hover:text-primary"
                    onClick={() => {
                      setPolicyDescription('');
                      setShowDescription(false);
                    }}
                  >
                    Hide
                  </button>
                </div>
                <Textarea
                  id="policy-description"
                  placeholder="Describe what this policy does"
                  value={policyDescription}
                  onChange={(e) => setPolicyDescription(e.target.value)}
                  className="h-20"
                />
              </div>
            ) : (
              <button 
                className="text-sm text-muted-foreground hover:text-primary flex items-center"
                onClick={() => setShowDescription(true)}
              >
                + Add Description (Optional)
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="space-y-6">
            <div className="bg-muted p-6 rounded-md border text-center">
              <p className="text-xl font-medium">
                If <span className="text-primary font-bold text-xl">{getApplicationName()}</span> wants to do{' '}
                <span className="text-primary font-bold text-xl">{verb || '[action]'}</span>{' '}
                <span className="text-primary font-bold text-xl">{resource || '[resource]'}</span> then{' '}
                <span className={`font-bold text-xl ${action === 'allow' ? 'text-green-500' : 'text-red-500'}`}>
                  {action === 'allow' ? 'ALLOW' : 'BLOCK'}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="application-select">Application</Label>
                <Select 
                  value={selectedApplication} 
                  onValueChange={setSelectedApplication}
                >
                  <SelectTrigger id="application-select">
                    <SelectValue placeholder="Select application" />
                  </SelectTrigger>
                  <SelectContent>
                    {applications.map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="action-select">Decision</Label>
                <Select value={action} onValueChange={(value: 'allow' | 'deny') => setAction(value)}>
                  <SelectTrigger 
                    id="action-select" 
                    className={action === 'allow' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}
                  >
                    <SelectValue placeholder="Select decision" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="allow">ALLOW</SelectItem>
                    <SelectItem value="deny">BLOCK</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="policy-scope">Scope</Label>
              <Select 
                value={scope} 
                onValueChange={(value: 'global' | 'credential' | 'plugin') => setScope(value)}
                disabled={!!preselectedScope}
              >
                <SelectTrigger id="policy-scope">
                  <SelectValue placeholder="Select policy scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="credential">Credential-specific</SelectItem>
                  <SelectItem value="plugin">Plugin-specific</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scope === 'credential' && (
              <div>
                <Label htmlFor="credential-select">Specific Credential</Label>
                <Select 
                  value={credentialId} 
                  onValueChange={setCredentialId}
                  disabled={!!preselectedCredentialId}
                >
                  <SelectTrigger id="credential-select">
                    <SelectValue placeholder="Select credential" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCredentials.map((cred) => (
                      <SelectItem key={cred.id} value={cred.id}>
                        {cred.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {scope === 'plugin' && (
              <div>
                <Label htmlFor="plugin-select">Specific Plugin</Label>
                <Select 
                  value={pluginId} 
                  onValueChange={setPluginId}
                >
                  <SelectTrigger id="plugin-select">
                    <SelectValue placeholder="Select plugin" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlugins.map((plugin) => (
                      <SelectItem key={plugin.id} value={plugin.id}>
                        {plugin.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="verb-input">Action</Label>
              <div className="flex gap-2">
                <Select onValueChange={setVerb} value={verb}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select an action (e.g., read, write)" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCommonVerbs().map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="verb-input"
                  placeholder="Or type custom action"
                  value={verb}
                  onChange={(e) => setVerb(e.target.value)}
                  className="w-[180px]"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="resource-input">Resource</Label>
              <div className="flex gap-2">
                <Select onValueChange={setResource} value={resource}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a resource (e.g., tweets, files)" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCommonResources().map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="resource-input"
                  placeholder="Or type custom resource"
                  value={resource}
                  onChange={(e) => setResource(e.target.value)}
                  className="w-[180px]"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <Label htmlFor="conditions-input">Conditions (Optional)</Label>
              </div>
              <Input
                id="conditions-input"
                placeholder="e.g., from internal network, during business hours"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 