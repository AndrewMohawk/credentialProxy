'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, AlertCircle, Clock, ShieldAlert, ShieldCheck, Users, Database, Plug, Server } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PolicyData } from './natural-language-policy-dialog';

export interface PolicyVisualizationProps {
  policyData: PolicyData;
  onPolicyUpdate?: (updatedPolicy: Partial<PolicyData>) => void;
}

type NodeStatus = 'neutral' | 'active' | 'success' | 'error' | 'warning';

interface FlowNode {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: NodeStatus;
  tooltip?: string;
}

interface FlowConnection {
  from: string;
  to: string;
  label?: string;
  status: NodeStatus;
}

export const PolicyVisualization: React.FC<PolicyVisualizationProps> = ({
  policyData,
  onPolicyUpdate
}) => {
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [connections, setConnections] = useState<FlowConnection[]>([]);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const prevNodesRef = useRef<string | null>(null);
  const prevConnectionsRef = useRef<string | null>(null);
  
  // Create flow nodes and connections based on policy
  useEffect(() => {
    if (!policyData) return;
    
    // Initial nodes for all policies
    const flowNodes: FlowNode[] = [
      {
        id: 'request',
        label: 'Request',
        icon: <Users className="h-5 w-5" />,
        status: 'neutral',
        tooltip: 'Incoming request from an application'
      },
      {
        id: 'policy',
        label: policyData.name || 'Policy',
        icon: <ShieldAlert className="h-5 w-5" />,
        status: 'neutral',
        tooltip: 'The policy being evaluated'
      },
      {
        id: 'decision',
        label: policyData.decision === 'allow' ? 'Allow' : 'Block',
        icon: policyData.decision === 'allow' ? <ShieldCheck className="h-5 w-5" /> : <X className="h-5 w-5" />,
        status: policyData.decision === 'allow' ? 'success' : 'error',
        tooltip: policyData.decision === 'allow' 
          ? 'Request is allowed if policy conditions match' 
          : 'Request is denied if policy conditions match'
      }
    ];
    
    // Initial connections
    const flowConnections: FlowConnection[] = [
      {
        from: 'request',
        to: 'policy',
        status: 'neutral'
      },
      {
        from: 'policy',
        to: 'decision',
        status: 'neutral'
      }
    ];
    
    // Add entity node if specified
    if (policyData.entity && policyData.entity !== 'any') {
      flowNodes.push({
        id: 'entity',
        label: policyData.entity,
        icon: <Server className="h-5 w-5" />,
        status: 'neutral',
        tooltip: 'The application making the request'
      });
      
      // Add condition check for entity
      flowConnections.push({
        from: 'policy',
        to: 'entity',
        label: 'Entity check',
        status: 'warning'
      });
    }
    
    // Add target node if specified
    if (policyData.target) {
      const targetType = policyData.scope === 'plugin' ? 'plugin' : 'credential';
      flowNodes.push({
        id: 'target',
        label: policyData.target,
        icon: targetType === 'plugin' ? <Plug className="h-5 w-5" /> : <Database className="h-5 w-5" />,
        status: 'neutral',
        tooltip: `The ${targetType} being accessed`
      });
      
      // Add condition check for target
      flowConnections.push({
        from: 'policy',
        to: 'target',
        label: 'Target check',
        status: 'warning'
      });
    }
    
    // Add time restriction node if present
    if (policyData.timeRestrictions) {
      flowNodes.push({
        id: 'time',
        label: 'Time Restriction',
        icon: <Clock className="h-5 w-5" />,
        status: 'neutral',
        tooltip: `Active from ${policyData.timeRestrictions.startTime} to ${policyData.timeRestrictions.endTime}`
      });
      
      // Add condition check for time
      flowConnections.push({
        from: 'policy',
        to: 'time',
        label: 'Time check',
        status: 'warning'
      });
    }
    
    // Add rate limit node if present
    if (policyData.rateLimit) {
      flowNodes.push({
        id: 'rateLimit',
        label: 'Rate Limit',
        icon: <AlertCircle className="h-5 w-5" />,
        status: 'neutral',
        tooltip: `Limited to ${policyData.rateLimit.maxCount} requests per ${policyData.rateLimit.timeWindow / 60} minute(s)`
      });
      
      // Add condition check for rate limit
      flowConnections.push({
        from: 'policy',
        to: 'rateLimit',
        label: 'Rate check',
        status: 'warning'
      });
    }
    
    // Use JSON.stringify to compare the new nodes and connections with the previous ones
    const newNodesString = JSON.stringify(flowNodes.map(node => ({
      ...node,
      icon: null // Exclude React elements from comparison
    })));
    
    const newConnectionsString = JSON.stringify(flowConnections);
    
    if (newNodesString !== prevNodesRef.current || newConnectionsString !== prevConnectionsRef.current) {
      prevNodesRef.current = newNodesString;
      prevConnectionsRef.current = newConnectionsString;
      setNodes(flowNodes);
      setConnections(flowConnections);
    }
  }, [policyData]);
  
  // Handle node hover (for interactive mode)
  const handleNodeHover = (nodeId: string) => {
    if (!onPolicyUpdate) return;
    
    setActiveNodeId(nodeId);
    
    // Highlight related connections
    const updatedConnections = connections.map(conn => {
      if (conn.from === nodeId || conn.to === nodeId) {
        return { ...conn, status: 'active' as NodeStatus };
      }
      return { ...conn, status: conn.status === 'active' ? 'neutral' as NodeStatus : conn.status };
    });
    
    // Highlight related nodes
    const updatedNodes = nodes.map(node => {
      const isRelated = 
        node.id === nodeId || 
        connections.some(c => 
          (c.from === nodeId && c.to === node.id) || 
          (c.to === nodeId && c.from === node.id)
        );
      
      if (isRelated) {
        return { ...node, status: node.id === nodeId ? 'active' as NodeStatus : 'warning' as NodeStatus };
      }
      
      return { ...node, status: node.id === 'decision' ? node.status : 'neutral' as NodeStatus };
    });
    
    setNodes(updatedNodes);
    setConnections(updatedConnections);
  };
  
  // Handle node leave (for interactive mode)
  const handleNodeLeave = () => {
    if (!onPolicyUpdate || !activeNodeId) return;
    
    setActiveNodeId(null);
    
    // Reset node statuses
    const resetNodes = nodes.map(node => ({
      ...node,
      status: node.id === 'decision' 
        ? (policyData?.decision === 'allow' ? 'success' as NodeStatus : 'error' as NodeStatus) 
        : 'neutral' as NodeStatus
    }));
    
    // Reset connection statuses
    const resetConnections = connections.map(conn => ({
      ...conn,
      status: 'neutral' as NodeStatus
    }));
    
    setNodes(resetNodes);
    setConnections(resetConnections);
  };
  
  // Get CSS class for node status
  const getNodeStatusClass = (status: NodeStatus) => {
    switch (status) {
      case 'active': return 'bg-primary text-primary-foreground border-primary';
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-muted/50 border-muted';
    }
  };
  
  // Get CSS class for connection status
  const getConnectionStatusClass = (status: NodeStatus) => {
    switch (status) {
      case 'active': return 'border-primary';
      case 'success': return 'border-green-500';
      case 'error': return 'border-red-500';
      case 'warning': return 'border-yellow-500';
      default: return 'border-muted-foreground/30';
    }
  };
  
  // Create a simplified layout for the flow diagram
  const createLayout = () => {
    const nodePositions: { [key: string]: { x: number, y: number } } = {
      request: { x: 0, y: 1 },
      policy: { x: 1, y: 1 }
    };
    
    // Position decision at the far right
    nodePositions.decision = { x: 4, y: 1 };
    
    // Position conditions in between
    const conditionNodes = nodes.filter(n => 
      !['request', 'policy', 'decision'].includes(n.id)
    );
    
    // Arrange condition nodes in a vertical column
    conditionNodes.forEach((node, index) => {
      nodePositions[node.id] = { x: 2, y: index };
    });
    
    return nodePositions;
  };
  
  const nodePositions = createLayout();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Policy Visualization</CardTitle>
          <CardDescription>
            Visual representation of your policy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-md bg-muted/20">
            <h3 className="font-medium mb-2">Policy Summary</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">Name:</span> {policyData.name || 'Unnamed Policy'}</p>
              <p><span className="font-semibold">Description:</span> {policyData.description || 'No description provided'}</p>
              <p><span className="font-semibold">Scope:</span> {policyData.scope}</p>
              {policyData.credentialId && (
                <p><span className="font-semibold">Credential ID:</span> {policyData.credentialId}</p>
              )}
              {policyData.pluginId && (
                <p><span className="font-semibold">Plugin ID:</span> {policyData.pluginId}</p>
              )}
              <p><span className="font-semibold">Rules:</span> {policyData.rules?.length || 0} defined</p>
            </div>
          </div>
          
          {policyData.rules && policyData.rules.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Rules</h3>
              <div className="space-y-2">
                {policyData.rules.map((rule, index) => (
                  <div key={index} className="p-3 border rounded-md">
                    <p><span className="font-semibold">Action:</span> {rule.action}</p>
                    <p><span className="font-semibold">Verb:</span> {rule.verb}</p>
                    <p><span className="font-semibold">Resource:</span> {rule.resource}</p>
                    {rule.limit && (
                      <p><span className="font-semibold">Limit:</span> {rule.limit} per {rule.period}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-4 p-4 bg-muted/20 rounded-md text-sm text-muted-foreground">
            <p className="mb-2">
              This visualization shows how your policy will be evaluated. The flow shows the conditions that will be checked and the decision that will be made when those conditions are met.
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Rules are evaluated in order from top to bottom</li>
              <li>The first matching rule determines the outcome</li>
              <li>If no rules match, the default action is to deny</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="relative h-[300px] w-full">
            {/* Render connections */}
            {connections.map((conn, index) => {
              const fromPos = nodePositions[conn.from];
              const toPos = nodePositions[conn.to];
              
              if (!fromPos || !toPos) return null;
              
              // Calculate connection coordinates
              const x1 = fromPos.x * 150 + 75;
              const y1 = fromPos.y * 80 + 40;
              const x2 = toPos.x * 150 + 75;
              const y2 = toPos.y * 80 + 40;
              
              // Calculate control points for curved lines
              const cx = (x1 + x2) / 2;
              const cy = (y1 + y2) / 2 + (Math.abs(y2 - y1) > 50 ? 50 : 0);
              
              return (
                <React.Fragment key={`${conn.from}-${conn.to}`}>
                  {/* Draw the path */}
                  <svg 
                    className="absolute top-0 left-0 h-full w-full"
                    style={{ pointerEvents: 'none' }}
                  >
                    <path
                      d={`M${x1},${y1} Q${cx},${cy} ${x2},${y2}`}
                      fill="none"
                      className={`border-2 ${getConnectionStatusClass(conn.status)}`}
                      strokeWidth={2}
                      strokeDasharray={conn.status === 'warning' ? '5,5' : 'none'}
                    />
                    
                    {/* Add arrow at the end */}
                    <polygon
                      points={`${x2-8},${y2-4} ${x2},${y2} ${x2-8},${y2+4}`}
                      className={getConnectionStatusClass(conn.status)}
                      transform={`rotate(${Math.atan2(y2 - cy, x2 - cx) * 180 / Math.PI}, ${x2}, ${y2})`}
                      fill="currentColor"
                    />
                  </svg>
                  
                  {/* Connection label */}
                  {conn.label && (
                    <div 
                      className="absolute bg-background text-xs px-1 rounded border"
                      style={{ 
                        left: `${cx - 40}px`, 
                        top: `${cy - 10}px`,
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none'
                      }}
                    >
                      {conn.label}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
            
            {/* Render nodes */}
            {nodes.map((node) => {
              const pos = nodePositions[node.id];
              if (!pos) return null;
              
              return (
                <TooltipProvider key={node.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`absolute flex flex-col items-center justify-center p-3 rounded-lg border transition-colors ${getNodeStatusClass(node.status)}`}
                        style={{ 
                          left: `${pos.x * 150}px`, 
                          top: `${pos.y * 80}px`,
                          width: '150px',
                          height: '80px',
                          cursor: onPolicyUpdate ? 'pointer' : 'default'
                        }}
                        onMouseEnter={() => handleNodeHover(node.id)}
                        onMouseLeave={handleNodeLeave}
                      >
                        <div className="flex items-center mb-1">
                          {node.icon}
                          <span className="ml-2 font-medium text-sm">{node.label}</span>
                        </div>
                        
                        {node.id === 'policy' && policyData?.type && (
                          <Badge variant="outline" className="text-xs">
                            {policyData.type.replace(/_/g, ' ')}
                          </Badge>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>{node.tooltip || node.label}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 