import { Policy } from '../core/policies/policyEngine';
import { validatePolicy } from '../core/policies/policyValidation';

/**
 * Create a new policy
 * @param policy Policy object to create
 * @param credentialId Optional credential ID to associate the policy with
 * @returns The created policy
 */
export const createPolicy = async (policy: Policy, credentialId?: string): Promise<Policy> => {
  // Validate the policy first
  const validationResult = await validatePolicy(policy);
  if (!validationResult.valid) {
    throw new Error(`Policy validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
  }
  
  const url = credentialId 
    ? `/api/credentials/${credentialId}/policies` 
    : '/api/policies';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(policy),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create policy');
  }
  
  return response.json();
};

/**
 * Update an existing policy
 * @param policyId ID of the policy to update
 * @param policy Updated policy object
 * @returns The updated policy
 */
export const updatePolicy = async (policyId: string, policy: Policy): Promise<Policy> => {
  // Validate the policy first
  const validationResult = await validatePolicy(policy);
  if (!validationResult.valid) {
    throw new Error(`Policy validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
  }
  
  const response = await fetch(`/api/policies/${policyId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(policy),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update policy');
  }
  
  return response.json();
};

/**
 * Fetch a policy by ID
 * @param policyId ID of the policy to fetch
 * @returns The policy object
 */
export const fetchPolicy = async (policyId: string): Promise<Policy> => {
  const response = await fetch(`/api/policies/${policyId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch policy');
  }
  
  return response.json();
};

/**
 * Fetch all policies
 * @param credentialId Optional credential ID to filter policies
 * @returns Array of policy objects
 */
export const fetchPolicies = async (credentialId?: string): Promise<Policy[]> => {
  const url = credentialId 
    ? `/api/credentials/${credentialId}/policies` 
    : '/api/policies';
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch policies');
  }
  
  return response.json();
};

/**
 * Delete a policy
 * @param policyId ID of the policy to delete
 */
export const deletePolicy = async (policyId: string): Promise<void> => {
  const response = await fetch(`/api/policies/${policyId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete policy');
  }
};

/**
 * Simulate a policy against a request
 * @param policy Policy to simulate
 * @param requestData Request data to test against
 * @returns Simulation result
 */
export const simulatePolicy = async (policy: Policy, requestData: any): Promise<{
  allowed: boolean;
  reason: string;
}> => {
  const response = await fetch('/api/policies/simulate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      policy,
      request: requestData
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to simulate policy');
  }
  
  return response.json();
}; 