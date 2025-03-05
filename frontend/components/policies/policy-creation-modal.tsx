'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Code2 } from 'lucide-react';

export interface PolicyCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectNaturalLanguage: () => void;
  onSelectAdvanced: () => void;
}

export const PolicyCreationModal: React.FC<PolicyCreationModalProps> = ({
  open,
  onOpenChange,
  onSelectNaturalLanguage,
  onSelectAdvanced
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Policy</DialogTitle>
          <DialogDescription>
            Choose how you want to create your policy
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={onSelectNaturalLanguage}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Natural Language
              </CardTitle>
              <CardDescription>
                Create policies using natural language
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Build policies by describing what you want to allow or deny in plain English.
                Perfect for non-technical users.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={onSelectNaturalLanguage}>
                Use Natural Language
              </Button>
            </CardFooter>
          </Card>

          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={onSelectAdvanced}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                Advanced
              </CardTitle>
              <CardDescription>
                Create policies with advanced options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Build policies with fine-grained control over all settings.
                Recommended for technical users.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={onSelectAdvanced}>
                Use Advanced Mode
              </Button>
            </CardFooter>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 