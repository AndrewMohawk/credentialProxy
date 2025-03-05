'use client';

import React, { useState, useEffect } from 'react';
import { Policy } from '@/lib/types/policy';
import { policyApi } from '@/lib/api-client';
import { Alert } from '@/components/ui/alert';
import { AlertTriangle, Check } from 'lucide-react';

// Using next/dynamic for Monaco Editor to prevent SSR issues
import dynamic from 'next/dynamic';
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then(mod => mod.default),
  { ssr: false }
);

interface PolicyJsonEditorProps {
  policy: Partial<Policy>;
  onChange: (updatedPolicy: Partial<Policy>) => void;
  isBasicSetup?: boolean;
}

interface ValidationResult {
  valid: boolean;
  errors: Array<{
    path?: string;
    message: string;
  }>;
}

export function PolicyJsonEditor({ policy, onChange, isBasicSetup = false }: PolicyJsonEditorProps) {
  const [jsonValue, setJsonValue] = useState<string>('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidJson, setIsValidJson] = useState(true);

  // Initialize the editor with the current policy
  useEffect(() => {
    try {
      setJsonValue(JSON.stringify(policy, null, 2));
      setIsValidJson(true);
    } catch (err) {
      console.error('Failed to stringify policy:', err);
      setIsValidJson(false);
    }
  }, [policy]);

  const handleEditorDidMount = () => {
    // Additional setup or configuration when editor mounts
  };

  const handleJsonChange = (value: string | undefined) => {
    if (!value) return;
    
    setJsonValue(value);
    
    try {
      const parsedPolicy = JSON.parse(value);
      setIsValidJson(true);
      onChange(parsedPolicy);
    } catch (err) {
      console.error('Invalid JSON:', err);
      setIsValidJson(false);
    }
  };

  const handleValidate = async () => {
    if (!isValidJson) {
      setValidationResult({
        valid: false,
        errors: [{ message: 'Invalid JSON syntax' }]
      });
      return;
    }

    try {
      const parsedPolicy = JSON.parse(jsonValue);
      const result = await policyApi.validatePolicy(parsedPolicy);
      setValidationResult(result.data);
    } catch (err) {
      console.error('Validation error:', err);
      setValidationResult({
        valid: false,
        errors: [{ message: 'Failed to validate policy' }]
      });
    }
  };

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex-1 min-h-[400px] border rounded-md overflow-hidden">
        <MonacoEditor
          height="100%"
          language="json"
          theme="vs-dark"
          value={jsonValue}
          onChange={handleJsonChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true
          }}
        />
      </div>
      
      <div className="mt-4">
        <button
          onClick={handleValidate}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Validate Policy
        </button>
        
        {validationResult && (
          <div className="mt-2">
            {validationResult.valid ? (
              <Alert>
                <Check className="h-4 w-4 mr-2" />
                <span className="text-green-600 font-medium">Policy is valid</span>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <div>
                  <p className="font-medium">Policy validation failed:</p>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    {validationResult.errors.map((error, index) => (
                      <li key={index}>
                        {error.path ? `${error.path}: ${error.message}` : error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              </Alert>
            )}
          </div>
        )}
        
        {!isValidJson && (
          <Alert variant="destructive" className="mt-2">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span>Invalid JSON syntax</span>
          </Alert>
        )}
      </div>
    </div>
  );
} 