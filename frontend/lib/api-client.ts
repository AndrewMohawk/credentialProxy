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