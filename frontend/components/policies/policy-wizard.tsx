'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Policy, POLICY_TYPES } from '@/lib/types/policy';
import { Shield, Code, Eye, CheckCircle, ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { PolicyTemplateSelector } from './policy-template-selector';
import { PolicyJsonEditor } from './policy-json-editor';
import { PolicySimulator } from './policy-simulator';
import { Alert } from '@/components/ui/alert';
import { policyApi } from '@/lib/api-client';

// Enum for wizard modes
enum WizardMode {
  TEMPLATE = 'template',
  VISUAL = 'visual',
  JSON = 'json'
}

// Enum for wizard steps
enum WizardStep {
  SELECT_MODE = 'select_mode',
  CONFIGURE = 'configure',
  TEST = 'test',
  REVIEW = 'review'
}

// Props for the wizard component
interface PolicyWizardProps {
  initialPolicy?: Partial<Policy>;
  credentialId?: string;
  onComplete: (policy: Policy) => void;
  onCancel: () => void;
}

export function PolicyWizard({ initialPolicy, credentialId, onComplete, onCancel }: PolicyWizardProps) {
  // Current wizard step
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.SELECT_MODE);
  // Selected mode for policy creation
  const [selectedMode, setSelectedMode] = useState<WizardMode | null>(null);
  // Policy being created/edited
  const [policy, setPolicy] = useState<Partial<Policy>>(initialPolicy || {});
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  // Error state
  const [error, setError] = useState<string | null>(null);
  // Validation status
  const [isValid, setIsValid] = useState(false);

  // Initialize the policy with defaults if needed
  useEffect(() => {
    if (!initialPolicy) {
      setPolicy({
        name: '',
        description: '',
        type: POLICY_TYPES.ALLOW_LIST,
        scope: 'CREDENTIAL',
        isActive: true,
        credentialId: credentialId,
      });
    }
  }, [initialPolicy, credentialId]);

  // Mode selection handler
  const handleModeSelect = (mode: WizardMode) => {
    setSelectedMode(mode);
    setCurrentStep(WizardStep.CONFIGURE);
  };

  // Policy change handler
  const handlePolicyChange = (updatedPolicy: Partial<Policy>) => {
    setPolicy(updatedPolicy);
  };

  // Next step handler
  const handleNext = () => {
    switch (currentStep) {
      case WizardStep.SELECT_MODE:
        if (selectedMode) {
          setCurrentStep(WizardStep.CONFIGURE);
        }
        break;
      case WizardStep.CONFIGURE:
        setCurrentStep(WizardStep.TEST);
        break;
      case WizardStep.TEST:
        setCurrentStep(WizardStep.REVIEW);
        break;
      default:
        break;
    }
  };

  // Back step handler
  const handleBack = () => {
    switch (currentStep) {
      case WizardStep.CONFIGURE:
        setCurrentStep(WizardStep.SELECT_MODE);
        setSelectedMode(null);
        break;
      case WizardStep.TEST:
        setCurrentStep(WizardStep.CONFIGURE);
        break;
      case WizardStep.REVIEW:
        setCurrentStep(WizardStep.TEST);
        break;
      default:
        break;
    }
  };

  // Save handler
  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let result;
      if (initialPolicy?.id) {
        // Update existing policy
        result = await policyApi.updatePolicy(initialPolicy.id, policy as Policy);
      } else {
        // Create new policy
        result = await policyApi.createPolicy(credentialId!, policy as Omit<Policy, 'id' | 'createdAt' | 'updatedAt' | 'version'>);
      }
      
      if (result.success && result.data) {
        onComplete(result.data);
      } else {
        setError(result.error || 'Failed to save policy');
      }
    } catch (err) {
      console.error('Failed to save policy:', err);
      setError('An error occurred while saving the policy');
    } finally {
      setIsLoading(false);
    }
  };

  // Step indicator rendering
  const renderStepIndicator = () => {
    const steps = [
      { id: WizardStep.SELECT_MODE, label: 'Select Mode' },
      { id: WizardStep.CONFIGURE, label: 'Configure' },
      { id: WizardStep.TEST, label: 'Test' },
      { id: WizardStep.REVIEW, label: 'Review' }
    ];

    return (
      <div className="mb-6">
        <ol className="flex items-center w-full">
          {steps.map((step, index) => {
            // Step status classes
            const isActive = step.id === currentStep;
            const isPast = steps.findIndex(s => s.id === currentStep) > index;
            const textClass = isActive ? 'text-blue-600 dark:text-blue-500' : 
                              isPast ? 'text-blue-600 dark:text-blue-500' : 'text-gray-500 dark:text-gray-400';
            const bgClass = isPast ? 'border-blue-600 dark:border-blue-500' : '';
            
            return (
              <li key={step.id} className={`flex w-full items-center ${index === steps.length - 1 ? '' : 'after:content-[""] after:w-full after:h-1 after:border-b after:border-gray-200 after:border-1 after:mx-4 xl:after:mx-6 dark:after:border-gray-700'}`}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border ${bgClass} ${textClass}`}>
                  {isPast ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className={`ml-2 text-sm ${textClass}`}>{step.label}</span>
              </li>
            );
          })}
        </ol>
      </div>
    );
  };

  // Mode selection rendering
  const renderModeSelection = () => (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Select Policy Creation Mode</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 cursor-pointer hover:border-blue-500 transition-colors" onClick={() => handleModeSelect(WizardMode.TEMPLATE)}>
          <div className="flex flex-col items-center text-center">
            <Shield className="w-12 h-12 text-blue-500 mb-2" />
            <h3 className="font-medium text-lg">Use Template</h3>
            <p className="text-sm text-gray-500 mt-2">
              Choose from a selection of pre-configured policy templates that match your needs.
            </p>
          </div>
        </Card>
        
        <Card className="p-4 cursor-pointer hover:border-blue-500 transition-colors" onClick={() => handleModeSelect(WizardMode.JSON)}>
          <div className="flex flex-col items-center text-center">
            <Code className="w-12 h-12 text-blue-500 mb-2" />
            <h3 className="font-medium text-lg">JSON Editor</h3>
            <p className="text-sm text-gray-500 mt-2">
              Create or edit your policy using a powerful JSON editor with validation.
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex flex-col items-center text-center opacity-50">
            <Eye className="w-12 h-12 text-blue-500 mb-2" />
            <h3 className="font-medium text-lg">Visual Builder</h3>
            <p className="text-sm text-gray-500 mt-2">
              Build your policy visually with an intuitive drag-and-drop interface.
              <span className="block mt-1 text-xs">(Coming soon)</span>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );

  // Configuration step rendering
  const renderConfigurationStep = () => {
    switch (selectedMode) {
      case WizardMode.TEMPLATE:
        return (
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Select a Policy Template</h2>
            <PolicyTemplateSelector 
              credential={credentialId}
              onSelectTemplate={({ policyConfig }) => handlePolicyChange({
                ...policy,
                ...policyConfig
              })}
            />
          </div>
        );
      
      case WizardMode.JSON:
        return (
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Edit Policy JSON</h2>
            <PolicyJsonEditor 
              policy={policy}
              onChange={handlePolicyChange}
            />
          </div>
        );
      
      default:
        return (
          <Alert>
            <p>Please select a mode to configure your policy.</p>
          </Alert>
        );
    }
  };

  // Testing step rendering
  const renderTestingStep = () => (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Test Your Policy</h2>
      <PolicySimulator 
        policy={policy}
        credentialId={credentialId}
      />
    </div>
  );

  // Review step rendering
  const renderReviewStep = () => (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Review and Save</h2>
      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Policy Details</h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="font-medium">Name:</div>
              <div>{policy.name || 'Unnamed Policy'}</div>
              
              <div className="font-medium">Type:</div>
              <div>{policy.type}</div>
              
              <div className="font-medium">Description:</div>
              <div>{policy.description || 'No description provided'}</div>
              
              <div className="font-medium">Status:</div>
              <div>{policy.isActive ? 'Active' : 'Inactive'}</div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium">Policy Configuration</h3>
            <pre className="bg-gray-100 p-2 rounded-md mt-2 text-xs overflow-auto max-h-60">
              {JSON.stringify(policy, null, 2)}
            </pre>
          </div>
        </div>
      </Card>
      
      {error && (
        <Alert variant="destructive" className="mt-4">
          <p>{error}</p>
        </Alert>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      {renderStepIndicator()}
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {currentStep === WizardStep.SELECT_MODE && renderModeSelection()}
        {currentStep === WizardStep.CONFIGURE && renderConfigurationStep()}
        {currentStep === WizardStep.TEST && renderTestingStep()}
        {currentStep === WizardStep.REVIEW && renderReviewStep()}
      </div>
      
      <div className="flex justify-between mt-6">
        {currentStep !== WizardStep.SELECT_MODE ? (
          <Button variant="outline" onClick={handleBack} disabled={isLoading}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        ) : (
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        
        {currentStep !== WizardStep.REVIEW ? (
          <Button onClick={handleNext}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Policy'}
          </Button>
        )}
      </div>
    </div>
  );
} 