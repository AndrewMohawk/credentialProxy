import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

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