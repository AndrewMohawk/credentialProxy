/**
 * API Client Test Utility
 * 
 * This file contains test functions to verify the API client can correctly
 * handle different response formats from the backend.
 * 
 * Note: This is for development testing only and should not be included in production.
 */

import apiClient from '@/lib/api-client';

/**
 * Test the API client with different mock response formats
 */
export const testApiClientResponseHandling = () => {
  // Only run tests in development
  if (process.env.NODE_ENV === 'production') {
    console.warn('API client tests should not be run in production');
    return;
  }

  console.group('API Client Response Format Tests');

  // Mock response handling
  const mockAxiosResponse = (data: any) => ({ data });

  // Test 1: Standard response with data property
  try {
    const standardResponse = mockAxiosResponse({
      success: true,
      data: { id: 123, name: 'Test User' }
    });

    const result1 = apiClient['get']('test', {}).then((res) => {
      console.log('✅ Standard response:', res);
      console.assert(res.success === true, 'Success property should be true');
      console.assert(res.data?.id === 123, 'Data.id should be 123');
      console.assert(res.data?.name === 'Test User', 'Data.name should be "Test User"');
    }).catch(err => console.error('❌ Standard response test failed:', err));
  } catch (error) {
    console.error('❌ Standard response test error:', error);
  }

  // Test 2: Response with success true and token at root level
  try {
    const tokenResponse = mockAxiosResponse({
      success: true,
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    });

    const result2 = apiClient['post']('test-token', {}).then((res) => {
      console.log('✅ Token response:', res);
      console.assert(res.success === true, 'Success property should be true');
      console.assert(res.data?.token === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', 'Data.token should contain the token');
    }).catch(err => console.error('❌ Token response test failed:', err));
  } catch (error) {
    console.error('❌ Token response test error:', error);
  }

  // Test 3: Plain object response without success property
  try {
    const plainObjectResponse = mockAxiosResponse({
      id: 456,
      role: 'admin',
      permissions: ['read', 'write']
    });

    const result3 = apiClient['get']('test-plain-object', {}).then((res) => {
      console.log('✅ Plain object response:', res);
      console.assert(res.success === true, 'Success property should be true');
      console.assert(res.data?.id === 456, 'Data.id should be 456');
      console.assert(Array.isArray(res.data?.permissions), 'Data.permissions should be an array');
    }).catch(err => console.error('❌ Plain object test failed:', err));
  } catch (error) {
    console.error('❌ Plain object test error:', error);
  }

  // Test 4: Primitive response (string)
  try {
    const primitiveResponse = mockAxiosResponse('Simple string response');

    const result4 = apiClient['get']('test-primitive', {}).then((res) => {
      console.log('✅ Primitive response:', res);
      console.assert(res.success === true, 'Success property should be true');
      console.assert(res.data === 'Simple string response', 'Data should be the string');
    }).catch(err => console.error('❌ Primitive test failed:', err));
  } catch (error) {
    console.error('❌ Primitive test error:', error);
  }

  console.groupEnd();
};

// Export a function to test the auth flow specifically
export const testAuthResponseHandling = async (
  username: string, 
  password: string
) => {
  try {
    console.group('Testing Auth Response Handling');
    
    console.log('Sending login request...');
    const response = await apiClient.post('/auth/login', {
      usernameOrEmail: username,
      password
    });
    
    console.log('Login response:', response);
    
    if (response.success) {
      console.log('Login successful');
      console.log('Token available:', !!response.data?.token);
      
      if (!response.data?.token) {
        console.error('❌ Token not found in response data!');
      } else {
        console.log('✅ Token successfully retrieved from response');
      }
    } else {
      console.error('❌ Login failed:', response.error);
    }
    
    console.groupEnd();
    return response;
  } catch (error) {
    console.error('❌ Auth test error:', error);
    console.groupEnd();
    throw error;
  }
}; 