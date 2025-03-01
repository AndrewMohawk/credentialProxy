import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  getPasskeyAuthOptions: (username: string) => Promise<any>;
  verifyPasskeyAuth: (response: any, userId: string) => Promise<void>;
  getPasskeyRegistrationOptions: () => Promise<any>;
  verifyPasskeyRegistration: (response: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      const userString = localStorage.getItem('user');
      if (userString) {
        setUser(JSON.parse(userString));
      }
    }
    setLoading(false);
  }, []);

  // Configure axios to include the auth token in all requests
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [user]);

  const login = async (usernameOrEmail: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/v1/auth/login', {
        usernameOrEmail,
        password
      });
      
      setUser(response.data);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/v1/auth/register', {
        username,
        email,
        password
      });
      
      setUser(response.data);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  };

  const getPasskeyAuthOptions = async (username: string) => {
    try {
      const response = await axios.post('/api/v1/auth/passkey-auth-options', { username });
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get passkey options');
      throw err;
    }
  };

  const verifyPasskeyAuth = async (response: any, userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const verifyResponse = await axios.post('/api/v1/auth/passkey-auth-verify', {
        response,
        userId
      });
      
      setUser(verifyResponse.data);
      localStorage.setItem('token', verifyResponse.data.token);
      localStorage.setItem('user', JSON.stringify(verifyResponse.data));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Passkey authentication failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getPasskeyRegistrationOptions = async () => {
    try {
      const response = await axios.get('/api/v1/auth/passkey-registration-options');
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get passkey registration options');
      throw err;
    }
  };

  const verifyPasskeyRegistration = async (response: any) => {
    try {
      const verifyResponse = await axios.post('/api/v1/auth/passkey-registration-verify', response);
      return verifyResponse.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Passkey registration failed');
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      register,
      logout,
      getPasskeyAuthOptions,
      verifyPasskeyAuth,
      getPasskeyRegistrationOptions,
      verifyPasskeyRegistration
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 