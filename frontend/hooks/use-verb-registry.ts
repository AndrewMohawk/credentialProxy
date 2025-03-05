import { useState, useEffect, useCallback } from 'react';
import apiClient from '../lib/api-client';
import { Verb, VerbFilter, VerbScope, VerbCategory, CategorizedVerbs } from '../lib/types/verb';

/**
 * Custom hook for interacting with the verb registry
 */
export function useVerbRegistry() {
  const [verbs, setVerbs] = useState<Verb[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [categorizedVerbs, setCategorizedVerbs] = useState<CategorizedVerbs>({
    [VerbCategory.ACCESS]: [],
    [VerbCategory.READ]: [],
    [VerbCategory.WRITE]: [],
    [VerbCategory.DELETE]: [],
    [VerbCategory.ADMIN]: [],
    [VerbCategory.OTHER]: []
  });

  /**
   * Categorize verbs based on their operation
   */
  const categorizeVerbs = useCallback((verbList: Verb[]): CategorizedVerbs => {
    const categorized: CategorizedVerbs = {
      [VerbCategory.ACCESS]: [],
      [VerbCategory.READ]: [],
      [VerbCategory.WRITE]: [],
      [VerbCategory.DELETE]: [],
      [VerbCategory.ADMIN]: [],
      [VerbCategory.OTHER]: []
    };

    verbList.forEach(verb => {
      const operation = verb.operation.toLowerCase();
      
      if (operation.includes('access') || operation.includes('login') || operation.includes('auth')) {
        categorized[VerbCategory.ACCESS].push(verb);
      } else if (operation.includes('read') || operation.includes('get') || operation.includes('list') || operation.includes('fetch')) {
        categorized[VerbCategory.READ].push(verb);
      } else if (operation.includes('write') || operation.includes('create') || operation.includes('update') || operation.includes('put') || operation.includes('post')) {
        categorized[VerbCategory.WRITE].push(verb);
      } else if (operation.includes('delete') || operation.includes('remove')) {
        categorized[VerbCategory.DELETE].push(verb);
      } else if (operation.includes('admin') || operation.includes('manage')) {
        categorized[VerbCategory.ADMIN].push(verb);
      } else {
        categorized[VerbCategory.OTHER].push(verb);
      }
    });

    return categorized;
  }, []);

  /**
   * Fetch verbs with optional filtering
   */
  const fetchVerbs = useCallback(async (filters?: VerbFilter) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getVerbs(filters);
      
      if (response.success && response.data) {
        setVerbs(response.data);
        setCategorizedVerbs(categorizeVerbs(response.data));
      } else {
        setError(response.error || 'Failed to fetch verbs');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching verbs');
    } finally {
      setLoading(false);
    }
  }, [categorizeVerbs]);

  /**
   * Fetch verbs for a specific scope
   */
  const fetchVerbsByScope = useCallback(async (scope: VerbScope) => {
    return fetchVerbs({ scope });
  }, [fetchVerbs]);

  /**
   * Fetch verbs for a specific plugin type
   */
  const fetchVerbsByPluginType = useCallback(async (pluginType: string) => {
    return fetchVerbs({ scope: VerbScope.PLUGIN, pluginType });
  }, [fetchVerbs]);

  /**
   * Fetch verbs for a specific credential type
   */
  const fetchVerbsByCredentialType = useCallback(async (credentialType: string) => {
    return fetchVerbs({ scope: VerbScope.CREDENTIAL, credentialType });
  }, [fetchVerbs]);

  /**
   * Fetch verbs for a specific credential instance by ID
   */
  const fetchVerbsForCredential = useCallback(async (credentialId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getVerbsForCredential(credentialId);
      
      if (response.success && response.data) {
        setVerbs(response.data);
        setCategorizedVerbs(categorizeVerbs(response.data));
        return response.data;
      } else {
        setError(response.error || 'Failed to fetch verbs for credential');
        return [];
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching verbs for credential');
      return [];
    } finally {
      setLoading(false);
    }
  }, [categorizeVerbs]);

  /**
   * Fetch verbs for a specific plugin instance by ID
   */
  const fetchVerbsForPlugin = useCallback(async (pluginId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getVerbsForPlugin(pluginId);
      
      if (response.success && response.data) {
        setVerbs(response.data);
        setCategorizedVerbs(categorizeVerbs(response.data));
        return response.data;
      } else {
        setError(response.error || 'Failed to fetch verbs for plugin');
        return [];
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching verbs for plugin');
      return [];
    } finally {
      setLoading(false);
    }
  }, [categorizeVerbs]);

  /**
   * Register a new verb
   */
  const registerVerb = useCallback(async (verb: Verb) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.registerVerb(verb);
      
      if (response.success && response.data) {
        // Refresh the verb list
        fetchVerbs();
        return response.data;
      } else {
        setError(response.error || 'Failed to register verb');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while registering the verb');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchVerbs]);

  /**
   * Unregister a verb
   */
  const unregisterVerb = useCallback(async (verbId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.unregisterVerb(verbId);
      
      if (response.success) {
        // Refresh the verb list
        fetchVerbs();
        return true;
      } else {
        setError(response.error || 'Failed to unregister verb');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while unregistering the verb');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchVerbs]);

  /**
   * Search for verbs by name or description
   */
  const searchVerbs = useCallback(async (searchTerm: string) => {
    return fetchVerbs({ search: searchTerm });
  }, [fetchVerbs]);

  // Load verbs on initial mount
  useEffect(() => {
    fetchVerbs();
  }, [fetchVerbs]);

  return {
    verbs,
    categorizedVerbs,
    loading,
    error,
    fetchVerbs,
    fetchVerbsByScope,
    fetchVerbsByPluginType,
    fetchVerbsByCredentialType,
    fetchVerbsForCredential,
    fetchVerbsForPlugin,
    registerVerb,
    unregisterVerb,
    searchVerbs
  };
} 