"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useState } from "react"

// Define form data type for better type safety
interface PolicyFormData {
  name?: string;
  description?: string;
  isEnabled?: boolean;
  maxCount?: number;
  pattern?: string;
  startTime?: string;
  endTime?: string;
  configuration?: any;
  [key: string]: any; // Allow for additional properties
}

interface PolicyEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  policyDetails: any | null
  isLoading: boolean
  onSave: (updatedData: any) => void
}

export function PolicyEditDialog({
  open,
  onOpenChange,
  policyDetails,
  isLoading,
  onSave
}: PolicyEditDialogProps) {
  const [formData, setFormData] = useState<PolicyFormData>({});

  // Initialize form data when policy details change
  useState(() => {
    if (policyDetails) {
      setFormData({
        name: policyDetails.name,
        description: policyDetails.description || '',
        isEnabled: policyDetails.isEnabled,
        maxCount: policyDetails.maxCount,
        pattern: policyDetails.pattern || '',
        startTime: policyDetails.startTime 
          ? new Date(policyDetails.startTime).toISOString().slice(0, 16) 
          : '',
        endTime: policyDetails.endTime 
          ? new Date(policyDetails.endTime).toISOString().slice(0, 16) 
          : '',
        configuration: policyDetails.configuration
      });
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: PolicyFormData) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev: PolicyFormData) => ({ ...prev, isEnabled: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!policyDetails && !isLoading) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Policy: {policyDetails?.name}</DialogTitle>
          <DialogDescription>
            Update policy settings and configuration
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Policy Name</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    value={formData.name || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    value={formData.description || ''}
                    onChange={handleChange}
                    placeholder="Enter a description for this policy"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="isEnabled" 
                      name="isEnabled"
                      checked={formData.isEnabled || false}
                      onCheckedChange={handleSwitchChange}
                    />
                    <Label htmlFor="isEnabled">Policy Active</Label>
                  </div>
                </div>
              </div>
              
              {/* Specific fields based on policy type */}
              {policyDetails?.type === 'PATTERN_MATCH' && (
                <div className="space-y-2">
                  <Label htmlFor="pattern">Pattern</Label>
                  <Textarea 
                    id="pattern" 
                    name="pattern" 
                    value={formData.pattern || ''}
                    onChange={handleChange}
                    placeholder="Enter pattern for matching"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Pattern used to match against requests
                  </p>
                </div>
              )}
              
              {policyDetails?.type === 'COUNT_BASED' && (
                <div className="space-y-2">
                  <Label htmlFor="maxCount">Maximum Count</Label>
                  <Input 
                    id="maxCount" 
                    name="maxCount" 
                    type="number"
                    value={formData.maxCount || ''}
                    onChange={handleChange}
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Current count: {policyDetails?.currentCount || 0}
                  </p>
                </div>
              )}
              
              {policyDetails?.type === 'TIME_BASED' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input 
                      id="startTime" 
                      name="startTime" 
                      type="datetime-local"
                      value={formData.startTime || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input 
                      id="endTime" 
                      name="endTime" 
                      type="datetime-local"
                      value={formData.endTime || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="configuration">Configuration (JSON)</Label>
                <div className="relative">
                  <pre className="mt-1 p-2 bg-muted rounded-md text-xs overflow-x-auto h-[200px] overflow-y-auto">
                    {JSON.stringify(policyDetails?.configuration, null, 2)}
                  </pre>
                  <p className="text-xs text-muted-foreground mt-1">
                    Configuration can only be edited through the API directly
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
} 