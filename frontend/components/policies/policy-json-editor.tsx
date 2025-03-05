'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';

interface PolicyJsonEditorProps {
  policy: any;
  onChange: (policy: any) => void;
  isBasicSetup?: boolean;
}

export function PolicyJsonEditor({ 
  policy, 
  onChange, 
  isBasicSetup = true
}: PolicyJsonEditorProps) {
  const [jsonValue, setJsonValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Convert policy object to formatted JSON string
  useEffect(() => {
    try {
      const json = JSON.stringify(policy, null, 2);
      setJsonValue(json);
    } catch (err) {
      console.error('Error stringifying policy:', err);
      setJsonValue('');
    }
  }, [policy]);

  // Handle manual JSON edits
  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonValue(e.target.value);
    setError(null);
    setIsSaved(false);
  };

  // Apply JSON changes to the policy
  const handleApplyChanges = () => {
    try {
      const parsedPolicy = JSON.parse(jsonValue);
      onChange(parsedPolicy);
      setError(null);
      setIsSaved(true);
      
      // Reset saved indicator after a delay
      setTimeout(() => {
        setIsSaved(false);
      }, 2000);
    } catch (err) {
      setError('Invalid JSON format. Please check your syntax.');
    }
  };

  return (
    <div className="space-y-4">
      {isBasicSetup && (
        <div className="text-sm text-muted-foreground mb-2">
          Edit the policy JSON directly. This is for advanced users who understand the policy format.
        </div>
      )}
      
      <Card className="relative">
        <textarea
          className="w-full h-80 p-4 font-mono text-sm rounded-md bg-muted/30 border"
          value={jsonValue}
          onChange={handleJsonChange}
          spellCheck={false}
        />
        
        {/* Status indicators */}
        {isSaved && (
          <div className="absolute bottom-3 right-3 bg-green-100 text-green-800 py-1 px-2 rounded-md flex items-center gap-1 text-xs">
            <Check className="h-3 w-3" />
            <span>Changes applied</span>
          </div>
        )}
      </Card>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-end">
        <Button onClick={handleApplyChanges} disabled={!jsonValue}>
          Apply Changes
        </Button>
      </div>
    </div>
  );
} 