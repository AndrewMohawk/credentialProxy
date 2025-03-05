'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, formatDateTime } from '@/lib/utils';
import { Policy } from '@/lib/types/policy';
import { Edit, PlayCircle } from 'lucide-react';

interface PolicyViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policyDetails: any | null;
  usageHistory: any[];
  isLoading: boolean;
  onEdit: () => void;
  onTest?: (policy: any) => void;
}

export function PolicyViewDialog({
  open,
  onOpenChange,
  policyDetails,
  usageHistory,
  isLoading,
  onEdit,
  onTest
}: PolicyViewDialogProps) {
  if (!policyDetails && !isLoading) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{policyDetails?.name || 'Policy Details'}</DialogTitle>
          <DialogDescription>
            {policyDetails?.description || 'Loading policy details...'}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
          </div>
        ) : (
          <Tabs defaultValue="info" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="mb-4">
              <TabsTrigger value="info">Policy Information</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="usage">Usage History</TabsTrigger>
              <TabsTrigger value="audit">Audit Events</TabsTrigger>
            </TabsList>
            
            <ScrollArea className="flex-1">
              <TabsContent value="info" className="mt-0 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                    <p className="mt-1">{policyDetails?.name || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                    <p className="mt-1">{policyDetails?.description || 'No description'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Type</h3>
                    <p className="mt-1">{policyDetails?.type || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Scope</h3>
                    <p className="mt-1">{policyDetails?.scope || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <div className="mt-1">
                      <Badge variant={policyDetails?.isActive ? 'default' : 'destructive'}>
                        {policyDetails?.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                    <p className="mt-1">{formatDate(policyDetails?.createdAt) || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                    <p className="mt-1">{formatDate(policyDetails?.updatedAt) || 'N/A'}</p>
                  </div>
                  
                  {policyDetails?.pluginId && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Plugin</h3>
                      <p className="mt-1">{policyDetails?.pluginName || policyDetails?.pluginId || 'N/A'}</p>
                    </div>
                  )}
                  
                  {policyDetails?.credentialId && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Credential</h3>
                      <p className="mt-1">{policyDetails?.credentialName || policyDetails?.credentialId || 'N/A'}</p>
                    </div>
                  )}
                </div>
                
                {policyDetails?.type === 'TIME_BASED' && policyDetails?.configuration && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Time Restrictions</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-medium">Start Time</h4>
                        <p>{policyDetails.configuration.startTime || 'N/A'}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium">End Time</h4>
                        <p>{policyDetails.configuration.endTime || 'N/A'}</p>
                      </div>
                      {policyDetails.configuration.daysOfWeek && (
                        <div className="col-span-2">
                          <h4 className="text-xs font-medium">Days</h4>
                          <p>{policyDetails.configuration.daysOfWeek.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {policyDetails?.type === 'COUNT_BASED' && policyDetails?.configuration && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Count Restrictions</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-medium">Max Count</h4>
                        <p>{policyDetails.configuration.maxCount || 'N/A'}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium">Current Count</h4>
                        <p>{policyDetails.currentCount || 0}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {policyDetails?.type === 'PATTERN_MATCH' && policyDetails?.configuration && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Pattern</h3>
                    <code className="block p-2 rounded bg-muted text-xs overflow-x-auto">
                      {policyDetails.configuration.pattern || 'No pattern defined'}
                    </code>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="config" className="mt-0 p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Configuration</h3>
                <pre className="p-4 rounded bg-muted text-xs overflow-x-auto">
                  {JSON.stringify(policyDetails?.configuration || {}, null, 2)}
                </pre>
              </TabsContent>
              
              <TabsContent value="usage" className="mt-0">
                <div className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Usage History</h3>
                  
                  {usageHistory && usageHistory.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usageHistory.map((usage) => (
                          <TableRow key={usage.id}>
                            <TableCell>{formatDateTime(usage.timestamp)}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={usage.status === 'ALLOWED' ? 'default' : 'destructive'}
                              >
                                {usage.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <details className="text-xs">
                                <summary className="cursor-pointer hover:text-primary">
                                  View Details
                                </summary>
                                <pre className="mt-2 p-2 bg-muted rounded-md overflow-x-auto">
                                  {JSON.stringify(usage.details, null, 2)}
                                </pre>
                              </details>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-sm">No usage history available</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="audit" className="mt-0">
                <div className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Audit Events</h3>
                  
                  {policyDetails?.auditEvents && policyDetails.auditEvents.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {policyDetails.auditEvents.map((event: any) => (
                          <TableRow key={event.id}>
                            <TableCell>{formatDateTime(event.timestamp)}</TableCell>
                            <TableCell>{event.action}</TableCell>
                            <TableCell>{event.user}</TableCell>
                            <TableCell>
                              <details className="text-xs">
                                <summary className="cursor-pointer hover:text-primary">
                                  View Details
                                </summary>
                                <pre className="mt-2 p-2 bg-muted rounded-md overflow-x-auto">
                                  {JSON.stringify(event.details, null, 2)}
                                </pre>
                              </details>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-sm">No audit events available</p>
                  )}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}
        
        <div className="mt-4 flex justify-end space-x-2">
          <Button variant="outline" onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>

          {onTest && (
            <Button 
              variant="outline" 
              onClick={() => onTest(policyDetails)}
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Test Policy
            </Button>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 