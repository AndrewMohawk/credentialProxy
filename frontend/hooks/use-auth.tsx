'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from './use-toast';
import { jwtDecode } from 'jwt-decode';
import apiClient, { extractErrorMessage } from '@/lib/api-client';

// Define types for our authentication context
type User = {
  id: string;
  username: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  isAuthenticated: boolean;
};

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => false,
  logout: () => {},
  register: async () => false,
  isAuthenticated: false,
});

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // Function to handle logout
  const handleLogout = () => {
    // Remove user and token from state
    setUser(null);
    setToken(null);
    
    // Remove from localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    
    // Clear API client token
    apiClient.clearToken();
    
    // Redirect to login page
    router.push('/login');
    
    toast({
      title: 'Session expired',
      description: 'Your session has expired. Please log in again.',
      variant: 'destructive'
    });
  };

  // Initialize auth state from localStorage on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Set token in the API client
        apiClient.setToken(storedToken);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        // Clear invalid storage data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', {
        usernameOrEmail: username,
        password
      });

      if (response.success) {
        // Get token from either response.data.token (our standard format)
        // or from response.data (when backend returns token at root and our client wraps it)
        const authToken = response.data?.token;
        
        if (!authToken) {
          console.error('Token not found in response:', response.data);
          throw new Error('Token not found in response');
        }
        
        setToken(authToken);
        
        // Decode user info from token
        const userData = jwtDecode(authToken) as User;
        setUser(userData);
        
        // Update localStorage and auth state
        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        
        // Set token in API client
        apiClient.setToken(authToken);
        
        toast({
          title: 'Welcome back!',
          description: 'You\'ve successfully logged in.',
        });
        
        setIsLoading(false);
        return true;
      } else {
        // Handle scenario where API returns success: false
        const errorMsg = response.error || 'Login failed';
        console.error('Login error:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      toast({
        variant: 'destructive',
        title: 'Authentication failed',
        description: error.message || 'An error occurred during login',
      });
      
      setIsLoading(false);
      
      // Important: throw the error with the extracted message
      // This allows the calling component to catch and display it
      throw error;
    }
  };

  // Register function
  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/register', {
        username,
        email,
        password
      });

      if (response.success) {
        // Get token from either response.data.token (our standard format)
        // or from response.data (when backend returns token at root and our client wraps it)
        const authToken = response.data?.token;
        
        if (!authToken) {
          throw new Error('Token not found in response');
        }
        
        setToken(authToken);
        
        // Decode user info from token
        const userData = jwtDecode(authToken) as User;
        setUser(userData);
        
        // Update localStorage and auth state
        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        
        // Set token in API client
        apiClient.setToken(authToken);
        
        toast({
          title: 'Registration successful!',
          description: 'Your account has been created.',
        });
        
        setIsLoading(false);
        return true;
      } else {
        // Handle scenario where API returns success: false
        const errorMsg = response.error || 'Registration failed';
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: error.message || 'An error occurred during registration',
      });
      
      setIsLoading(false);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call the logout endpoint
      await apiClient.post('/auth/logout');
      
      // Perform local logout
      handleLogout();
    } catch (error: any) {
      console.error('Logout error:', error);
      
      // Even if the API call fails, we should still logout locally
      handleLogout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        register,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext); 