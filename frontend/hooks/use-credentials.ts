'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import apiClient from '@/lib/api-client';
import { CredentialType, CredentialFormValues } from '@/components/credentials/types';

export function useCredentials() {
  const [credentialTypes, setCredentialTypes] = useState<CredentialType[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  // Fetch available credential types
  const fetchCredentialTypes = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoadingTypes(true);
    setError(null);

    try {
      const response = await apiClient.get('/credentials/types');
      
      if (response.success && response.data?.types) {
        // Format the credential types for easier use
        const formattedTypes = response.data.types.map((type: any) => ({
          id: type.type,
          name: type.description || type.type,
          description: type.description || `${type.type} Credential`
        }));
        
        setCredentialTypes(formattedTypes);
      } else {
        setError('Failed to fetch credential types');
      }
    } catch (err: any) {
      console.error('Error fetching credential types:', err);
      setError(err.message || 'An error occurred while fetching credential types');
    } finally {
      setIsLoadingTypes(false);
    }
  }, [isAuthenticated]);

  // Create a new credential
  const createCredential = async (data: CredentialFormValues): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiClient.post('/credentials', data);
      
      if (response.success) {
        return true;
      } else {
        setError(response.error || 'Failed to create credential');
        return false;
      }
    } catch (err: any) {
      console.error('Error creating credential:', err);
      setError(err.message || 'An error occurred while creating the credential');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get credential fields for a specific type
  const getCredentialFields = async (type: string) => {
    if (!isAuthenticated) return null;

    try {
      const response = await apiClient.get(`/credentials/fields/${type}`);
      
      if (response.success && response.data?.fields) {
        return response.data.fields;
      } else {
        setError('Failed to fetch credential fields');
        return null;
      }
    } catch (err: any) {
      console.error('Error fetching credential fields:', err);
      setError(err.message || 'An error occurred while fetching credential fields');
      return null;
    }
  };

  // Auto-fetch credential types when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCredentialTypes();
    }
  }, [isAuthenticated, fetchCredentialTypes]);

  return {
    credentialTypes,
    isLoadingTypes,
    isSubmitting,
    error,
    fetchCredentialTypes,
    createCredential,
    getCredentialFields
  };
} 