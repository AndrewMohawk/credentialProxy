'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Key, Database, Cloud, Globe } from 'lucide-react';
import { Credential } from '@/lib/types/credential';
import { Plugin } from '@/lib/types/plugin';

// Define the PolicyTemplate interface
interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  tags: string[];
  policyConfig: {
    name: string;
    description: string;
    scope: 'global' | 'credential' | 'plugin';
    credentialId?: string;
    pluginId?: string;
    rules: any[];
  };
}

// Mock templates for development
const MOCK_TEMPLATES: PolicyTemplate[] = [
  {
    id: '1',
    name: 'Read-Only AWS Access',
    description: 'Allow read-only access to AWS resources',
    type: 'aws',
    tags: ['aws', 'readonly', 'security'],
    policyConfig: {
      name: 'AWS Read-Only Access',
      description: 'This policy allows read-only access to AWS resources',
      scope: 'credential',
      rules: [
        {
          action: 'allow',
          verb: 'read',
          resource: '*',
        },
        {
          action: 'deny',
          verb: 'write',
          resource: '*',
        },
      ],
    },
  },
  {
    id: '2',
    name: 'Database Backup Only',
    description: 'Allow only database backup operations',
    type: 'database',
    tags: ['database', 'backup', 'security'],
    policyConfig: {
      name: 'Database Backup Only',
      description: 'This policy allows only database backup operations',
      scope: 'credential',
      rules: [
        {
          action: 'allow',
          verb: 'backup',
          resource: 'database',
        },
        {
          action: 'deny',
          verb: '*',
          resource: '*',
        },
      ],
    },
  },
  {
    id: '3',
    name: 'Global API Rate Limiting',
    description: 'Apply rate limiting to all API calls',
    type: 'global',
    tags: ['api', 'rate-limiting', 'global'],
    policyConfig: {
      name: 'Global API Rate Limiting',
      description: 'This policy applies rate limiting to all API calls',
      scope: 'global',
      rules: [
        {
          action: 'limit',
          verb: 'call',
          resource: 'api',
          limit: 100,
          period: '1h',
        },
      ],
    },
  },
  {
    id: '4',
    name: 'Twitter Read-Only Access',
    description: 'Allow only reading tweets and profile information',
    type: 'oauth',
    tags: ['twitter', 'readonly', 'social'],
    policyConfig: {
      name: 'Twitter Read-Only Access',
      description: 'This policy allows reading tweets and profile information, but not posting',
      scope: 'credential',
      rules: [
        {
          action: 'allow',
          verb: 'read',
          resource: 'tweets',
        },
        {
          action: 'allow',
          verb: 'view',
          resource: 'profile',
        },
        {
          action: 'deny',
          verb: 'post',
          resource: 'tweets',
        },
      ],
    },
  },
  {
    id: '5',
    name: 'Twitter Full Access',
    description: 'Allow reading and posting tweets',
    type: 'oauth',
    tags: ['twitter', 'fullaccess', 'social'],
    policyConfig: {
      name: 'Twitter Full Access',
      description: 'This policy allows reading and posting tweets, and viewing profile information',
      scope: 'credential',
      rules: [
        {
          action: 'allow',
          verb: 'read',
          resource: 'tweets',
        },
        {
          action: 'allow',
          verb: 'post',
          resource: 'tweets',
        },
        {
          action: 'allow',
          verb: 'view',
          resource: 'profile',
        },
      ],
    },
  },
  {
    id: '6',
    name: 'Twitter Post-Only Access',
    description: 'Allow only posting tweets',
    type: 'oauth',
    tags: ['twitter', 'posting', 'social'],
    policyConfig: {
      name: 'Twitter Post-Only Access',
      description: 'This policy allows posting tweets but not reading or viewing profiles',
      scope: 'credential',
      rules: [
        {
          action: 'allow',
          verb: 'post',
          resource: 'tweets',
        },
        {
          action: 'deny',
          verb: 'read',
          resource: 'tweets',
        },
        {
          action: 'deny',
          verb: 'view',
          resource: 'profile',
        },
      ],
    },
  },
];

export interface PolicyTemplateSelectorProps {
  availableCredentials?: Credential[];
  availablePlugins?: Plugin[];
  preselectedCredentialId?: string;
  preselectedScope?: 'global' | 'credential' | 'plugin';
  onTemplateSelect: (template: PolicyTemplate['policyConfig']) => void;
}

export const PolicyTemplateSelector: React.FC<PolicyTemplateSelectorProps> = ({
  availableCredentials,
  availablePlugins,
  preselectedCredentialId,
  preselectedScope,
  onTemplateSelect
}) => {
  const [templates, setTemplates] = useState<PolicyTemplate[]>(MOCK_TEMPLATES);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        // In a real implementation, we would fetch the templates from the API
        // For now, we'll use the mock templates
        // const response = await policyApi.getTemplates();
        // setTemplates(response.data);
        setTemplates(MOCK_TEMPLATES); // Using mock templates for now
      } catch (err) {
        console.error("Failed to load templates:", err);
      }
    };

    loadTemplates();
  }, []);

  const getPolicyTypeIcon = (type: string) => {
    switch (type) {
      case 'aws':
        return <Cloud className="h-5 w-5" />;
      case 'database':
        return <Database className="h-5 w-5" />;
      case 'api':
      case 'oauth':
        return <Key className="h-5 w-5" />;
      case 'global':
        return <Globe className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const handleSelectTemplate = (template: PolicyTemplate) => {
    if (template) {
      const policyConfig = { ...template.policyConfig };
      
      // If we have a preselected scope, override the template's scope
      if (preselectedScope) {
        policyConfig.scope = preselectedScope;
      }
      
      // If we have a preselected credential ID and the scope is credential, use it
      if (preselectedCredentialId && (policyConfig.scope === 'credential' || preselectedScope === 'credential')) {
        policyConfig.credentialId = preselectedCredentialId;
      }
      
      // If no credential is selected but we need one, use the first available
      if (policyConfig.scope === 'credential' && !policyConfig.credentialId && availableCredentials?.length) {
        policyConfig.credentialId = availableCredentials[0].id;
      }
      
      onTemplateSelect(policyConfig);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <Card key={template.id} className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              {getPolicyTypeIcon(template.type)}
              <CardTitle className="text-lg">{template.name}</CardTitle>
            </div>
            <CardDescription>{template.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="flex flex-wrap gap-2 mt-2">
              {template.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => handleSelectTemplate(template)}
            >
              Use Template
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}; 