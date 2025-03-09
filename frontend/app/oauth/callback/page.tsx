'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';

export default function OAuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing your authentication...');
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const router = useRouter();
  const callbackProcessed = useRef(false);

  useEffect(() => {
    async function processCallback() {
      // Guard against double processing
      if (callbackProcessed.current) {
        console.log('Callback already processed, skipping');
        return;
      }
      
      try {
        callbackProcessed.current = true;
        
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        console.log('OAuth callback triggered with code:', code ? 'present' : 'missing');
        console.log('State parameter:', state);
        
        if (error) {
          throw new Error(errorDescription || 'Authentication failed');
        }
        
        if (!code) {
          throw new Error('No authorization code received');
        }
        
        // Check if this code is already being processed - prevent double processing
        const processingCode = localStorage.getItem('twitter_processing_code');
        if (processingCode === code) {
          console.log('This authorization code is already being processed. Preventing duplicate exchange.');
          throw new Error('This authorization code is already being processed. Please wait for the process to complete.');
        }
        
        // Mark this code as being processed
        localStorage.setItem('twitter_processing_code', code);
        
        // Get authentication data from localStorage (shared across windows/tabs)
        const storedState = localStorage.getItem('twitter_oauth_state');
        const codeVerifier = localStorage.getItem('twitter_code_verifier');
        const timestamp = localStorage.getItem('twitter_oauth_timestamp');
        
        console.log('Stored state:', storedState ? 'present' : 'missing');
        console.log('Code verifier:', codeVerifier ? 'present' : 'missing');
        console.log('State match:', state === storedState ? 'yes' : 'no');
        
        // Check if the flow was initiated more than 5 minutes ago (codes expire)
        if (timestamp) {
          const initiatedTime = new Date(timestamp).getTime();
          const currentTime = new Date().getTime();
          const elapsedMinutes = (currentTime - initiatedTime) / (1000 * 60);
          console.log('OAuth flow elapsed time:', elapsedMinutes.toFixed(2), 'minutes');
          
          if (elapsedMinutes > 5) {
            throw new Error('The authorization code may have expired. Please try again.');
          }
        }
        
        if (!storedState || state !== storedState || !codeVerifier) {
          throw new Error('Invalid state parameter or missing code verifier. Please try again.');
        }
        
        // Get the stored credential information
        const credentialName = localStorage.getItem('twitter_credential_name') || 'Twitter Account';
        const clientId = localStorage.getItem('twitter_client_id');
        const clientSecret = localStorage.getItem('twitter_client_secret');
        const redirectUri = localStorage.getItem('twitter_redirect_uri') || 
                         window.location.origin + '/oauth/callback';
        
        if (!clientId || !clientSecret) {
          throw new Error('Missing credential information. Please try again and ensure pop-ups are allowed.');
        }
        
        // This is a Twitter OAuth callback
        setMessage('Completing Twitter authentication...');
        
        // Create a credential with the authorization code - the backend will handle the token exchange
        setMessage('Creating Twitter credential...');
        
        // Log what we're sending to the backend for debugging
        console.log('Creating credential with:');
        console.log('- Name:', credentialName);
        console.log('- Type: TWITTER_OAUTH');
        console.log('- Client ID:', clientId ? `${clientId.substring(0, 5)}...` : 'missing');
        console.log('- Redirect URI:', redirectUri);
        console.log('- Code Verifier Length:', codeVerifier ? codeVerifier.length : 0);
        console.log('- Authorization Code Length:', code ? code.length : 0);
        
        const credential = {
          name: credentialName,
          type: 'TWITTER_OAUTH',
          data: {
            clientId,
            clientSecret,
            authorizationCode: code,
            codeVerifier,
            redirectUri,
            state
          }
        };
        
        // Use try/catch specifically for the API request to better handle failure cases
        try {
          // Save the credential using apiClient with a timeout
          const response = await Promise.race([
            apiClient.post('/credentials', credential),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout')), 20000)
            )
          ]) as any;
          
          if (!response.success) {
            // Store detailed error information for debugging
            const errorDetails = JSON.stringify(response.error || response, null, 2);
            console.error('Credential creation error:', errorDetails);
            setDebugInfo(errorDetails);
            
            // Check if it's a token exchange error
            if (errorDetails.includes('Token exchange') || errorDetails.includes('invalid_request')) {
              throw new Error('Failed to exchange authorization code for tokens. The code may have expired or been used already. Please try again.');
            }
            
            throw new Error(`Failed to save credential: ${response.error || 'Unknown error'}`);
          }
          
          // Success!
          setStatus('success');
          setMessage('Your Twitter account has been connected successfully!');
          
          // Clean up localStorage
          localStorage.removeItem('twitter_oauth_state');
          localStorage.removeItem('twitter_code_verifier');
          localStorage.removeItem('twitter_credential_name');
          localStorage.removeItem('twitter_client_id');
          localStorage.removeItem('twitter_client_secret');
          localStorage.removeItem('twitter_redirect_uri');
          localStorage.removeItem('twitter_oauth_timestamp');
          localStorage.removeItem('twitter_processing_code');
          
          // Set a flag to indicate the credential was added
          localStorage.setItem('credential_added', 'true');
          
          // Close this window after a delay
          setTimeout(() => {
            window.close();
            // If window doesn't close (some browsers prevent this), redirect to credentials page
            setTimeout(() => {
              router.push('/credentials');
            }, 500);
          }, 2000);
        } catch (apiError: any) {
          // Handle API-specific errors
          console.error('API error during credential creation:', apiError);
          throw apiError; // Rethrow to be caught by the outer try/catch
        }
      } catch (error: any) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage(error.message || 'An unknown error occurred');
        
        // Also clean up the processing flag on error
        localStorage.removeItem('twitter_processing_code');
        callbackProcessed.current = false;
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
              <div className="h-12 w-12 rounded-full border-4 border-t-blue-500 border-b-transparent border-l-transparent border-r-transparent animate-spin"></div>
              <p className="text-gray-600 dark:text-gray-400">{message}</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400">{message}</p>
              <p className="text-sm text-gray-500">You can close this window now.</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </div>
              <p className="text-red-600 dark:text-red-400">{message}</p>
              
              {debugInfo && (
                <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md text-left overflow-auto max-h-64 w-full">
                  <p className="text-sm font-semibold mb-1">Debug Information:</p>
                  <pre className="text-xs whitespace-pre-wrap break-words">{debugInfo}</pre>
                </div>
              )}
              
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 max-w-sm">
                <p className="mb-2">Troubleshooting tips:</p>
                <ul className="list-disc pl-5 space-y-1 text-left">
                  <li>Make sure you're using the same browser session</li>
                  <li>Try disabling any popup blockers</li>
                  <li>Ensure your Twitter Developer Portal settings use the correct callback URL</li>
                  <li>Check that your Twitter app has OAuth 2.0 enabled</li>
                </ul>
              </div>
              
              <button
                onClick={() => window.location.href = '/credentials'}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Return to Credentials
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 