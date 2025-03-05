'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, Clock, Hash, Check, ChevronRight } from 'lucide-react';
import { Policy, POLICY_TYPES, MOCK_TEMPLATES, PolicyTemplate } from '@/lib/types/policy';
import { policyApi } from '@/lib/api-client';

export interface PolicyTemplateSelectorProps {
  credential: string | undefined;
  onSelectTemplate: (template: { policyConfig: Partial<Policy> }) => void;
}

export const PolicyTemplateSelector: React.FC<PolicyTemplateSelectorProps> = ({
  credential,
  onSelectTemplate
}) => {
  const [templates, setTemplates] = useState<PolicyTemplate[]>(MOCK_TEMPLATES);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTemplates() {
      setIsLoading(true);
      setError(null);

      try {
        if (credential) {
          // In a real implementation, we would fetch the templates from the API
          // For now, we'll use the mock templates
          // const response = await policyApi.getTemplates(credential);
          // setTemplates(response.data);
          setTemplates(MOCK_TEMPLATES); // Using mock templates for now
        }
      } catch (err) {
        console.error("Failed to load templates:", err);
        setError("Failed to load policy templates. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    loadTemplates();
  }, [credential]);

  const getPolicyTypeIcon = (type: string) => {
    switch (type) {
      case POLICY_TYPES.ALLOW_LIST:
        return <Check className="h-5 w-5" />;
      case POLICY_TYPES.DENY_LIST:
        return <AlertTriangle className="h-5 w-5" />;
      case POLICY_TYPES.TIME_BASED:
        return <Clock className="h-5 w-5" />;
      case POLICY_TYPES.RATE_LIMITING:
        return <Hash className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const getPolicyTypeVariant = (type: string): "default" | "outline" | "secondary" | "destructive" => {
    switch (type) {
      case POLICY_TYPES.ALLOW_LIST:
        return "default";
      case POLICY_TYPES.DENY_LIST:
        return "destructive";
      case POLICY_TYPES.TIME_BASED:
        return "secondary";
      case POLICY_TYPES.RATE_LIMITING:
        return "outline";
      default:
        return "default";
    }
  };

  const handleTemplateSelect = (templateId: string, pluginType: string) => {
    // Find the selected template
    const selectedTemplate = templates.find(t => t.id === templateId);

    if (selectedTemplate) {
      // In a real application, we would transform the template to a policy config
      // For this demo, we'll create a basic policy structure
      const policyConfig: Partial<Policy> = {
        name: selectedTemplate.name,
        type: selectedTemplate.type,
        description: selectedTemplate.description,
        scope: selectedTemplate.scope,
        isActive: true,
        // Add other fields from the template as needed
      };

      onSelectTemplate({ policyConfig });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading templates...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <Card key={template.id} className="overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-primary/10 rounded-full">
                  {getPolicyTypeIcon(template.type)}
                </div>
                <h3 className="font-medium">{template.name}</h3>
              </div>
              <Badge variant={getPolicyTypeVariant(template.type)}>
                {template.type}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">{template.description}</p>
            
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                className="text-xs"
                onClick={() => handleTemplateSelect(template.id, template.category)}
              >
                <span>Use Template</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}; 