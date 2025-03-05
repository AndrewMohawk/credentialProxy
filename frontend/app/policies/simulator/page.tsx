'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PolicySimulator } from '@/components/policies/policy-simulator';
import { Policy } from '@/lib/types/policy';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { policyApi } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import Link from 'next/link';

export default function PolicySimulatorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const policyId = searchParams.get('policyId');
  
  const [policy, setPolicy] = useState<Partial<Policy> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch policy data if policyId is provided
  React.useEffect(() => {
    async function fetchPolicy() {
      if (!policyId) {
        setLoading(false);
        return;
      }

      try {
        const response = await policyApi.fetchPolicy(policyId);
        if (response.success && response.data) {
          setPolicy(response.data);
        } else {
          setError('Failed to load policy data');
        }
      } catch (err) {
        console.error('Error fetching policy:', err);
        setError('An error occurred while loading the policy');
      } finally {
        setLoading(false);
      }
    }

    fetchPolicy();
  }, [policyId]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold">Policy Simulator</h1>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">Loading policy data...</div>
      ) : error ? (
        <Alert variant="destructive">
          <p>{error}</p>
        </Alert>
      ) : !policy ? (
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">No Policy Selected</h2>
          <p className="text-gray-500 mb-4">
            Please select a policy to simulate or create a test policy below.
          </p>
          <div className="flex space-x-4">
            <Button asChild>
              <Link href="/policies">Select Policy</Link>
            </Button>
            <Button variant="outline" onClick={() => setPolicy({})}>
              Create Test Policy
            </Button>
          </div>
        </Card>
      ) : (
        <PolicySimulator policy={policy} credentialId={policy.credentialId} />
      )}
    </div>
  );
} 