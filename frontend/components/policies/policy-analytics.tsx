'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Policy, POLICY_TYPES } from '@/lib/types/policy';
import { policyApi } from '@/lib/api-client';

interface PolicyAnalyticsProps {
  credentialId?: string;
}

interface PolicyStats {
  totalPolicies: number;
  activePolicies: number;
  policyTypes: Record<string, number>;
  evaluationResults: {
    allowed: number;
    denied: number;
    total: number;
  };
  topPolicies: Array<{
    id: string;
    name: string;
    evaluations: number;
    denialRate: number;
  }>;
}

// Mock data for demonstration
const MOCK_STATS: PolicyStats = {
  totalPolicies: 14,
  activePolicies: 10,
  policyTypes: {
    ALLOW_LIST: 5,
    DENY_LIST: 3,
    TIME_BASED: 2,
    RATE_LIMITING: 4
  },
  evaluationResults: {
    allowed: 542,
    denied: 87,
    total: 629
  },
  topPolicies: [
    { id: 'pol1', name: 'Production API Access', evaluations: 215, denialRate: 0.05 },
    { id: 'pol2', name: 'OAuth Rate Limiting', evaluations: 183, denialRate: 0.12 },
    { id: 'pol3', name: 'Database Access Hours', evaluations: 112, denialRate: 0.24 },
    { id: 'pol4', name: 'Blocked Operations', evaluations: 82, denialRate: 0.93 },
    { id: 'pol5', name: 'Test Environment Limits', evaluations: 37, denialRate: 0.08 }
  ]
};

export function PolicyAnalytics({ credentialId }: PolicyAnalyticsProps) {
  const [stats, setStats] = useState<PolicyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPolicyStats = async () => {
      setLoading(true);
      setError(null);

      try {
        // In a real application, we would fetch stats from the API
        // For now, we'll simulate a delay and use mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // const response = await policyApi.getPolicyStats(credentialId);
        // setStats(response.data);
        setStats(MOCK_STATS);
      } catch (err) {
        console.error('Failed to fetch policy stats:', err);
        setError('Failed to load policy analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchPolicyStats();
  }, [credentialId]);

  const formatPercentage = (value: number): string => {
    return `${Math.round(value * 100)}%`;
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading analytics...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <p>{error}</p>
      </Alert>
    );
  }

  if (!stats) {
    return (
      <Alert>
        <p>No policy analytics data available.</p>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Policy Summary Card */}
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Policy Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Policies</span>
              <span className="font-medium">{stats.totalPolicies}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Policies</span>
              <span className="font-medium">{stats.activePolicies}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Inactive Policies</span>
              <span className="font-medium">{stats.totalPolicies - stats.activePolicies}</span>
            </div>
          </div>
        </Card>

        {/* Evaluation Results Card */}
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Evaluation Results</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Evaluations</span>
              <span className="font-medium">{stats.evaluationResults.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Allowed</span>
              <span className="text-green-600 font-medium">{stats.evaluationResults.allowed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Denied</span>
              <span className="text-red-600 font-medium">{stats.evaluationResults.denied}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Denial Rate</span>
              <span className="font-medium">
                {formatPercentage(stats.evaluationResults.denied / stats.evaluationResults.total)}
              </span>
            </div>
          </div>

          {/* Visual representation with bars */}
          <div className="mt-4">
            <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500" 
                style={{ 
                  width: `${(stats.evaluationResults.allowed / stats.evaluationResults.total) * 100}%`,
                  float: 'left'
                }}
              />
              <div 
                className="h-full bg-red-500" 
                style={{ 
                  width: `${(stats.evaluationResults.denied / stats.evaluationResults.total) * 100}%` 
                }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span>Allowed ({formatPercentage(stats.evaluationResults.allowed / stats.evaluationResults.total)})</span>
              <span>Denied ({formatPercentage(stats.evaluationResults.denied / stats.evaluationResults.total)})</span>
            </div>
          </div>
        </Card>

        {/* Policy Types Card */}
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Policy Types</h3>
          <div className="space-y-3">
            {Object.entries(stats.policyTypes).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center">
                <div className="flex items-center">
                  <Badge variant={getPolicyTypeBadgeVariant(type)}>
                    {type}
                  </Badge>
                </div>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>

          {/* Visual representation with bars */}
          <div className="mt-4 space-y-2">
            {Object.entries(stats.policyTypes).map(([type, count]) => {
              const percentage = (count / stats.totalPolicies) * 100;
              return (
                <div key={`bar-${type}`} className="w-full">
                  <div className="flex justify-between text-xs mb-1">
                    <span>{type}</span>
                    <span>{count} ({Math.round(percentage)}%)</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full">
                    <div 
                      className={`h-full rounded-full ${getPolicyTypeBgColor(type)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Top Policies Card */}
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Top Policies by Usage</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Policy Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Evaluations
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Denial Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.topPolicies.map((policy) => (
                <tr key={policy.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {policy.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {policy.evaluations}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatPercentage(policy.denialRate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function getPolicyTypeBadgeVariant(policyType: string): "default" | "outline" | "secondary" | "destructive" {
  switch (policyType) {
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
}

function getPolicyTypeBgColor(policyType: string): string {
  switch (policyType) {
    case POLICY_TYPES.ALLOW_LIST:
      return "bg-blue-500";
    case POLICY_TYPES.DENY_LIST:
      return "bg-red-500";
    case POLICY_TYPES.TIME_BASED:
      return "bg-amber-500";
    case POLICY_TYPES.RATE_LIMITING:
      return "bg-indigo-500";
    default:
      return "bg-gray-500";
  }
} 