'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseOAuthParams } from '@/lib/oauth-utils';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TwitterCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing your authentication...');
  const router = useRouter();

  useEffect(() => {
    async function processCallback() {
      try {
        // Get the OAuth parameters from the URL
        const params = parseOAuthParams();
        
        if (!params) {
          throw new Error('No OAuth parameters found in URL');
        }
        
        if (params.error) {
          throw new Error(params.error_description || 'Authentication failed');
        }
        
        if (!params.code) {
          throw new Error('No authorization code received');
        }
        
        // Check if this is a Twitter OAuth callback
        const storedState = sessionStorage.getItem('twitter_oauth_state');
        const codeVerifier = sessionStorage.getItem('twitter_code_verifier');
        
        if (!storedState || params.state !== storedState || !codeVerifier) {
          throw new Error('Invalid state parameter or missing code verifier');
        }
        
        // This is a Twitter OAuth callback
        setMessage('Completing Twitter authentication...');
        
        // Get the stored credential information
        const credentialName = sessionStorage.getItem('twitter_credential_name') || 'Twitter Account';
        const clientId = sessionStorage.getItem('twitter_client_id');
        const clientSecret = sessionStorage.getItem('twitter_client_secret');
        
        if (!clientId || !clientSecret) {
          throw new Error('Missing credential information');
        }
        
        // Get the exact same redirect URI that was used in the authorization request
        const redirectUri = sessionStorage.getItem('twitter_redirect_uri') || 
                           `${window.location.origin}/auth/twitter/callback`;
        
        // Exchange the code for tokens
        const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            'client_id': clientId,
            'client_secret': clientSecret,
            'code': params.code,
            'grant_type': 'authorization_code',
            'redirect_uri': redirectUri,
            'code_verifier': codeVerifier
          })
        });
        
        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.text();
          throw new Error(`Token exchange failed: ${errorData}`);
        }
        
        const tokenData = await tokenResponse.json();
        
        // Get auth token from sessionStorage
        const authToken = sessionStorage.getItem('auth_token');
        
        if (!authToken) {
          throw new Error('Not authenticated. Please log in first.');
        }
        
        // Create the credential in the system
        const credential = {
          name: credentialName,
          type: 'TWITTER_OAUTH',
          data: {
            clientId,
            clientSecret,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token || null,
            scope: tokenData.scope || 'tweet.read users.read',
            expiresAt: tokenData.expires_in ? 
              new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : 
              null
          }
        };
        
        // Save the credential
        const response = await fetch('/api/v1/credentials', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(credential)
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Failed to save credential: ${errorData}`);
        }
        
        // Success!
        setStatus('success');
        setMessage('Your Twitter account has been connected successfully!');
        
        // Clean up session storage
        sessionStorage.removeItem('twitter_oauth_state');
        sessionStorage.removeItem('twitter_code_verifier');
        sessionStorage.removeItem('twitter_credential_name');
        sessionStorage.removeItem('twitter_client_id');
        sessionStorage.removeItem('twitter_client_secret');
        sessionStorage.removeItem('twitter_redirect_uri');
        
        // Set a flag to indicate the credential was added
        sessionStorage.setItem('credential_added', 'true');
        
        // Redirect after a delay
        setTimeout(() => {
          router.push('/credentials');
        }, 2000);
      } catch (error: any) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage(error.message || 'An unknown error occurred');
      }
    }
    
    processCallback();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 space-y-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Twitter Authentication</h1>
          
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <p className="text-gray-600 dark:text-gray-400">{message}</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-gray-600 dark:text-gray-400">{message}</p>
              <p className="text-sm text-gray-500">Redirecting you back to credentials page...</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <p className="text-red-600 dark:text-red-400">{message}</p>
              <Button
                onClick={() => router.push('/credentials')}
                className="mt-4"
              >
                Return to Credentials
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 