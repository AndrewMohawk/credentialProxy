import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Verb, VerbFilter, VerbScope } from './types/verb';

// Get backend configuration from environment variables or use defaults
const BACKEND_PORT = process.env.NEXT_PUBLIC_BACKEND_PORT || '4242';
const BACKEND_HOST = process.env.NEXT_PUBLIC_BACKEND_HOST || 'localhost';
// API URL from environment variables or default with configurable host and port
const API_URL = process.env.NEXT_PUBLIC_API_URL || `http://${BACKEND_HOST}:${BACKEND_PORT}/api/v1`;

// Define response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Error handling function to extract meaningful messages from various error formats
export const extractErrorMessage = (error: any): string => {
  // Handle validation errors array format
  if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    return error.response.data.errors
      .map((err: any) => err.msg || err.message || 'Validation error')
      .join('. ');
  }
  
  // Handle single error message format
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  // Handle message format
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  // Handle network errors
  if (error.message) {
    return error.message;
  }
  
  // Default error message
  return 'An unknown error occurred';
};

class ApiClient {
  private instance: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Setup request interceptor to add auth token
    this.instance.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Setup response interceptor for error handling
    this.instance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Check if error is due to an expired token (401 Unauthorized)
        if (error.response?.status === 401) {
          // Clear the token
          this.clearToken();
          
          // Remove token from localStorage
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            
            // Redirect to login page if we're in a browser environment
            // and not already on the login page
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          }
        }
        
        return Promise.reject(error);
      }
    );

    // Try to initialize token from localStorage if available
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        this.setToken(storedToken);
      }
    }
  }

  /**
   * Set the authentication token for API requests
   */
  public setToken(token: string | null): void {
    this.token = token;
    if (token) {
      this.instance.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete this.instance.defaults.headers.common.Authorization;
    }
  }

  /**
   * Clear the authentication token
   */
  public clearToken(): void {
    this.token = null;
    delete this.instance.defaults.headers.common.Authorization;
    
    // Also remove from localStorage if in browser environment
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * Perform a GET request
   */
  public async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await this.instance.get(url, config);
      
      // Add debug logging in development
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`API GET ${url} response:`, response.data);
      }
      
      // Handle different response formats
      if (response.data && typeof response.data === 'object') {
        // If the response already has our expected structure
        if ('success' in response.data) {
          // If the response has success property but data is missing,
          // collect all non-metadata properties into a data object
          if (response.data.success === true && !response.data.data) {
            const { success, message, error, ...rest } = response.data;
            const hasData = Object.keys(rest).length > 0;
            
            return {
              success: true,
              message,
              data: hasData ? rest as unknown as T : undefined,
              error
            };
          }
          
          // Otherwise return the response as is
          return response.data as ApiResponse<T>;
        }
        
        // Otherwise, wrap it in our standard format
        return {
          success: true,
          data: response.data as T
        };
      }
      
      // For primitive responses (like strings)
      return {
        success: true,
        data: response.data as T
      };
    } catch (error: any) {
      // Log the error details in development
      if (process.env.NODE_ENV !== 'production') {
        console.error(`API GET ${url} error:`, error.response?.data || error.message);
      }
      
      throw new Error(extractErrorMessage(error));
    }
  }

  /**
   * Perform a POST request
   */
  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await this.instance.post(url, data, config);
      
      // Add debug logging in development
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`API POST ${url} response:`, response.data);
      }
      
      // Handle different response formats
      if (response.data && typeof response.data === 'object') {
        // If the response already has our expected structure
        if ('success' in response.data) {
          // If the response has success property but data is missing,
          // collect all non-metadata properties into a data object
          if (response.data.success === true && !response.data.data) {
            const { success, message, error, ...rest } = response.data;
            const hasData = Object.keys(rest).length > 0;
            
            return {
              success: true,
              message,
              data: hasData ? rest as unknown as T : undefined,
              error
            };
          }
          
          // Otherwise return the response as is
          return response.data as ApiResponse<T>;
        }
        
        // Otherwise, wrap it in our standard format
        return {
          success: true,
          data: response.data as T
        };
      }
      
      // For primitive responses (like strings)
      return {
        success: true,
        data: response.data as T
      };
    } catch (error: any) {
      // Log the error details in development
      if (process.env.NODE_ENV !== 'production') {
        console.error(`API POST ${url} error:`, error.response?.data || error.message);
      }
      
      throw new Error(extractErrorMessage(error));
    }
  }

  /**
   * Perform a PUT request
   */
  public async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await this.instance.put(url, data, config);
      
      // Add debug logging in development
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`API PUT ${url} response:`, response.data);
      }
      
      // Handle different response formats
      if (response.data && typeof response.data === 'object') {
        // If the response already has our expected structure
        if ('success' in response.data) {
          // If the response has success property but data is missing,
          // collect all non-metadata properties into a data object
          if (response.data.success === true && !response.data.data) {
            const { success, message, error, ...rest } = response.data;
            const hasData = Object.keys(rest).length > 0;
            
            return {
              success: true,
              message,
              data: hasData ? rest as unknown as T : undefined,
              error
            };
          }
          
          // Otherwise return the response as is
          return response.data as ApiResponse<T>;
        }
        
        // Otherwise, wrap it in our standard format
        return {
          success: true,
          data: response.data as T
        };
      }
      
      // For primitive responses (like strings)
      return {
        success: true,
        data: response.data as T
      };
    } catch (error: any) {
      // Log the error details in development
      if (process.env.NODE_ENV !== 'production') {
        console.error(`API PUT ${url} error:`, error.response?.data || error.message);
      }
      
      throw new Error(extractErrorMessage(error));
    }
  }

  /**
   * Perform a DELETE request
   */
  public async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await this.instance.delete(url, config);
      
      // Add debug logging in development
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`API DELETE ${url} response:`, response.data);
      }
      
      // Handle different response formats
      if (response.data && typeof response.data === 'object') {
        // If the response already has our expected structure
        if ('success' in response.data) {
          // If the response has success property but data is missing,
          // collect all non-metadata properties into a data object
          if (response.data.success === true && !response.data.data) {
            const { success, message, error, ...rest } = response.data;
            const hasData = Object.keys(rest).length > 0;
            
            return {
              success: true,
              message,
              data: hasData ? rest as unknown as T : undefined,
              error
            };
          }
          
          // Otherwise return the response as is
          return response.data as ApiResponse<T>;
        }
        
        // Otherwise, wrap it in our standard format
        return {
          success: true,
          data: response.data as T
        };
      }
      
      // For primitive responses (like strings)
      return {
        success: true,
        data: response.data as T
      };
    } catch (error: any) {
      // Log the error details in development
      if (process.env.NODE_ENV !== 'production') {
        console.error(`API DELETE ${url} error:`, error.response?.data || error.message);
      }
      
      throw new Error(extractErrorMessage(error));
    }
  }

  /**
   * Get the Axios instance for custom usage if needed
   */
  public getAxiosInstance(): AxiosInstance {
    return this.instance;
  }

  /**
   * Get all verbs with optional filtering
   * @param filters Optional filters for the verbs
   * @returns Array of verbs matching the filters
   */
  async getVerbs(filters?: VerbFilter) {
    let url = '/verb-registry';
    
    // Add query parameters if filters are provided
    if (filters) {
      const params = new URLSearchParams();
      
      if (filters.scope) {
        params.append('scope', filters.scope);
      }
      
      if (filters.pluginType) {
        params.append('pluginType', filters.pluginType);
      }
      
      if (filters.credentialType) {
        params.append('credentialType', filters.credentialType);
      }
      
      if (filters.search) {
        params.append('search', filters.search);
      }
      
      if (filters.tags && filters.tags.length > 0) {
        params.append('tags', filters.tags.join(','));
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }
    
    return this.get<Verb[]>(url);
  }

  /**
   * Get a verb by ID
   * @param verbId The ID of the verb to get
   * @returns The verb, or null if not found
   */
  async getVerbById(verbId: string) {
    return this.get<Verb>(`/verb-registry/${verbId}`);
  }

  /**
   * Register a new verb
   * @param verb The verb to register
   * @returns The registered verb
   */
  async registerVerb(verb: Verb) {
    return this.post<Verb>('/verb-registry', verb);
  }

  /**
   * Unregister a verb
   * @param verbId The ID of the verb to unregister
   * @returns Success status
   */
  async unregisterVerb(verbId: string) {
    return this.delete(`/verb-registry/${verbId}`);
  }

  /**
   * Register verbs for a plugin
   * @param pluginType The type of plugin
   * @param verbs The verbs to register
   * @returns The registered verbs
   */
  async registerPluginVerbs(pluginType: string, verbs: Omit<Verb, 'scope' | 'pluginType'>[]) {
    return this.post<Verb[]>(`/verb-registry/plugin/${pluginType}`, verbs);
  }

  /**
   * Register verbs for a credential type
   * @param credentialType The type of credential
   * @param verbs The verbs to register
   * @returns The registered verbs
   */
  async registerCredentialVerbs(credentialType: string, verbs: Omit<Verb, 'scope' | 'credentialType'>[]) {
    return this.post<Verb[]>(`/verb-registry/credential/${credentialType}`, verbs);
  }

  /**
   * Get verbs for a specific scope
   * @param scope The scope to get verbs for
   * @returns Array of verbs for the specified scope
   */
  async getVerbsByScope(scope: VerbScope) {
    return this.getVerbs({ scope });
  }

  /**
   * Get verbs for a specific plugin type
   * @param pluginType The plugin type to get verbs for
   * @returns Array of verbs for the specified plugin type
   */
  async getVerbsByPluginType(pluginType: string) {
    return this.getVerbs({ scope: VerbScope.PLUGIN, pluginType });
  }

  /**
   * Get verbs for a specific credential type
   * @param credentialType The credential type to get verbs for
   * @returns Array of verbs for the specified credential type
   */
  async getVerbsByCredentialType(credentialType: string) {
    return this.getVerbs({ scope: VerbScope.CREDENTIAL, credentialType });
  }

  /**
   * Get verbs for a specific credential instance
   * @param credentialId The ID of the credential to get verbs for
   * @returns Array of verbs for the specified credential
   */
  async getVerbsForCredential(credentialId: string) {
    return this.get<Verb[]>(`/verb-registry/credential/${credentialId}`);
  }

  /**
   * Get verbs for a specific plugin instance
   * @param pluginId The ID of the plugin to get verbs for
   * @returns Array of verbs for the specified plugin
   */
  async getVerbsForPlugin(pluginId: string) {
    return this.get<Verb[]>(`/verb-registry/plugin/${pluginId}`);
  }

  /**
   * Search for verbs by name or description
   * @param searchTerm The search term
   * @returns Array of verbs matching the search term
   */
  async searchVerbs(searchTerm: string) {
    return this.getVerbs({ search: searchTerm });
  }
}

// Create a singleton instance
const apiClient = new ApiClient();

export default apiClient;

// Policy-specific API services
export const policyApi = {
  // Fetch all policies for a credential
  async fetchPolicies(credentialId: string) {
    const client = new ApiClient();
    return client.get<Policy[]>(`/credentials/${credentialId}/policies`);
  },
  
  // Fetch a single policy by ID
  async fetchPolicy(policyId: string) {
    const client = new ApiClient();
    return client.get<Policy>(`/policies/${policyId}`);
  },
  
  // Create a new policy
  async createPolicy(credentialId: string, policy: Omit<Policy, 'id' | 'createdAt' | 'updatedAt' | 'version'>) {
    const client = new ApiClient();
    return client.post<Policy>(`/credentials/${credentialId}/policies`, policy);
  },
  
  // Update an existing policy
  async updatePolicy(policyId: string, policy: Omit<Policy, 'id' | 'createdAt' | 'updatedAt'>) {
    const client = new ApiClient();
    return client.put<Policy>(`/policies/${policyId}`, policy);
  },
  
  // Delete a policy
  async deletePolicy(policyId: string) {
    const client = new ApiClient();
    return client.delete(`/policies/${policyId}`);
  },
  
  // Toggle a policy's enabled state
  async togglePolicy(policyId: string, enabled: boolean) {
    const client = new ApiClient();
    return client.put<Policy>(`/policies/${policyId}/toggle`, { enabled });
  },
  
  // Validate a policy against its schema
  async validatePolicy(policy: Partial<Policy>) {
    const client = new ApiClient();
    return client.post('/policy-validation/validate', policy);
  },
  
  // Get a policy template for a specific type
  async getPolicyTemplate(type: string) {
    const client = new ApiClient();
    return client.get<Partial<Policy>>(`/policy-validation/template/${type}`);
  },
  
  // Simulate applying a policy to an operation
  async simulatePolicy(policy: any, operationRequest: any) {
    const client = new ApiClient();
    return client.post('/policy-validation/simulate', { policy, operationRequest });
  },
  
  // Get field suggestions for a policy type
  async getPolicySuggestions(type: string, path?: string) {
    const client = new ApiClient();
    const url = path ? `/policy-validation/suggestions/${type}?path=${path}` : `/policy-validation/suggestions/${type}`;
    return client.get<Array<{ label: string; description: string; value?: any }>>(url);
  },
  
  // Get field paths for a policy type
  async getPolicyFieldPaths(type: string) {
    const client = new ApiClient();
    return client.get<string[]>(`/policy-validation/field-paths/${type}`);
  },
  
  // Get policy blueprints for a plugin type
  async getPolicyBlueprints(pluginType?: string) {
    const client = new ApiClient();
    const url = pluginType ? `/policy-blueprints/${pluginType}` : '/policy-blueprints';
    return client.get<Array<any>>(url);
  }
};

// Type import is needed
import { Policy } from './types/policy'; 