"use client";

import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useToast } from "./use-toast";
import { jwtDecode } from "jwt-decode";

// API URL from environment variables or default to localhost
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4242/api/v1";

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
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    
    // Remove authorization header
    delete axios.defaults.headers.common["Authorization"];
    
    // Redirect to login page
    router.push("/login");
    
    toast({
      title: "Session expired",
      description: "Your session has expired. Please log in again.",
      variant: "destructive"
    });
  };

  // Initialize auth state from localStorage on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Set authorization header for all future axios requests
        axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        // Clear invalid storage data
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      }
    }
    
    setIsLoading(false);
  }, []);

  // Set up axios interceptor for handling 401 errors
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && error.response.status === 401) {
          console.error("401 Unauthorized response:", error.response.data);
          
          // Check if we're not already on the login page
          if (window.location.pathname !== '/login') {
            handleLogout();
          }
        } else if (error.code === 'ERR_NETWORK' || !error.response) {
          // Handle network errors (API not available)
          console.error("Network error, API may be unavailable:", error);
          
          // Only show the toast if we're not on the login page
          if (window.location.pathname !== '/login') {
            toast({
              title: "Connection Error",
              description: "Cannot connect to the server. Please check your network connection.",
              variant: "destructive"
            });
          }
        }
        return Promise.reject(error);
      }
    );

    // Remove interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Add this function to properly handle various error response formats
  const extractErrorMessage = (error: any): string => {
    console.log('Auth error details:', error);
    
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

  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        usernameOrEmail: username,
        password
      });

      if (response.data.success) {
        // Set auth token
        const token = response.data.token;
        setToken(token);
        
        // Decode user info from token
        const user = jwtDecode(token) as User;
        setUser(user);
        
        // Update localStorage and auth state
        localStorage.setItem("auth_token", token);
        localStorage.setItem("auth_user", JSON.stringify(user));
        
        // Set authorization header for all future axios requests
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });
        
        setIsLoading(false);
        return true;
      } else {
        // Handle scenario where API returns success: false
        const errorMsg = response.data.error || 'Login failed';
        console.error('Login error:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMsg = extractErrorMessage(error);
      
      toast({
        variant: "destructive",
        title: "Authentication failed",
        description: errorMsg,
      });
      
      setIsLoading(false);
      
      // Important: throw the error with the extracted message
      // This allows the calling component to catch and display it
      throw new Error(errorMsg);
    }
  };

  // Register function
  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password
      });

      if (response.data.success) {
        // Set auth token
        const token = response.data.token;
        setToken(token);
        
        // Decode user info from token
        const user = jwtDecode(token) as User;
        setUser(user);
        
        // Update localStorage and auth state
        localStorage.setItem("auth_token", token);
        localStorage.setItem("auth_user", JSON.stringify(user));
        
        // Set authorization header for all future axios requests
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        
        toast({
          title: "Registration successful!",
          description: "Your account has been created.",
        });
        
        setIsLoading(false);
        return true;
      } else {
        // Handle scenario where API returns success: false
        const errorMsg = response.data.error || 'Registration failed';
        console.error('Registration error:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMsg = extractErrorMessage(error);
      
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: errorMsg,
      });
      
      setIsLoading(false);
      
      // Important: throw the error with the extracted message
      // This allows the calling component to catch and display it
      throw new Error(errorMsg);
    }
  };

  // Logout function
  const logout = async () => {
    console.log("Logout function called");
    try {
      // Call the backend logout endpoint if we have a token
      if (token) {
        console.log("Token exists, calling logout endpoint");
        
        // Add a delay to ensure we can see the logs before navigation
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const response = await axios.post(`${API_URL}/auth/logout`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log("Logout API response:", response.data);
      } else {
        console.log("No token found, skipping logout endpoint call");
      }
    } catch (error) {
      console.error("Error during logout:", error);
      // Continue with local logout even if backend call fails
    } finally {
      console.log("Performing local logout actions");
      // Remove user and token from state
      setUser(null);
      setToken(null);
      
      // Remove from localStorage
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      
      // Remove authorization header
      delete axios.defaults.headers.common["Authorization"];
      
      // Redirect to login page
      router.push("/login");
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    }
  };

  // Determine if user is authenticated
  const isAuthenticated = !!token && !!user;

  // The context value that will be provided
  const contextValue: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    logout,
    register,
    isAuthenticated,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext); 