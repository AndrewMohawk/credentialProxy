import { NextRequest, NextResponse } from 'next/server';

/**
 * OAuth callback handler
 * This route handles the Twitter OAuth callback and token exchange
 */
export async function GET(request: NextRequest) {
  // Create an HTML page with Javascript that will handle the Twitter OAuth process
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Twitter OAuth Callback</title>
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
            background-color: #f7f8fa;
            color: #333;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
          }
          .card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            padding: 32px;
            max-width: 480px;
            width: 100%;
            text-align: center;
          }
          h1 {
            margin-top: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .loading {
            display: inline-block;
            width: 50px;
            height: 50px;
            border: 3px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            border-top-color: #3498db;
            animation: spin 1s ease-in-out infinite;
            margin: 20px 0;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .message {
            margin: 20px 0;
            line-height: 1.5;
          }
          .success { color: #10b981; }
          .error { color: #ef4444; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Twitter Authentication</h1>
          <div class="loading" id="loading"></div>
          <div class="message" id="message">Processing your authentication...</div>
        </div>

        <script>
          (async function() {
            const loadingEl = document.getElementById('loading');
            const messageEl = document.getElementById('message');
            
            function showError(message) {
              loadingEl.style.display = 'none';
              messageEl.className = 'message error';
              messageEl.textContent = message;
            }
            
            function showSuccess(message) {
              loadingEl.style.display = 'none';
              messageEl.className = 'message success';
              messageEl.textContent = message;
            }
            
            try {
              // Get URL parameters
              const urlParams = new URLSearchParams(window.location.search);
              const code = urlParams.get('code');
              const state = urlParams.get('state');
              const error = urlParams.get('error');
              const errorDescription = urlParams.get('error_description');
              
              if (error) {
                showError(errorDescription || 'Authentication failed');
                return;
              }
              
              if (!code) {
                showError('No authorization code received');
                return;
              }
              
              // Check if this is a Twitter OAuth callback
              const storedState = sessionStorage.getItem('twitter_oauth_state');
              const codeVerifier = sessionStorage.getItem('twitter_code_verifier');
              
              if (!storedState || state !== storedState || !codeVerifier) {
                showError('Invalid state parameter or missing code verifier');
                return;
              }
              
              // Get the credential information from session storage
              const credentialName = sessionStorage.getItem('twitter_credential_name') || 'Twitter API';
              const clientId = sessionStorage.getItem('twitter_client_id');
              const clientSecret = sessionStorage.getItem('twitter_client_secret');
              const redirectUri = sessionStorage.getItem('twitter_redirect_uri') || 
                                window.location.origin + '/api/oauth/callback';
              
              if (!clientId || !clientSecret) {
                showError('Missing credential information');
                return;
              }
              
              // Exchange the code for tokens
              messageEl.textContent = 'Exchanging authorization code for tokens...';
              
              const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                  'client_id': clientId,
                  'client_secret': clientSecret,
                  'code': code,
                  'grant_type': 'authorization_code',
                  'redirect_uri': redirectUri,
                  'code_verifier': codeVerifier
                })
              });
              
              if (!tokenResponse.ok) {
                const errorText = await tokenResponse.text();
                console.error('Token exchange error:', errorText);
                showError('Failed to exchange code for token: ' + errorText);
                return;
              }
              
              const tokenData = await tokenResponse.json();
              
              // Get auth token from session storage
              const authToken = sessionStorage.getItem('auth_token');
              
              if (!authToken) {
                showError('Not authenticated with Credential Proxy. Please log in first.');
                return;
              }
              
              // Create the credential in the system
              messageEl.textContent = 'Creating Twitter credential...';
              
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
              
              const response = await fetch('/api/v1/credentials', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ' + authToken
                },
                body: JSON.stringify(credential)
              });
              
              if (!response.ok) {
                const errorData = await response.text();
                showError('Failed to save credential: ' + errorData);
                return;
              }
              
              // Success!
              showSuccess('Your Twitter account has been connected successfully!');
              
              // Clean up session storage
              sessionStorage.removeItem('twitter_oauth_state');
              sessionStorage.removeItem('twitter_code_verifier');
              sessionStorage.removeItem('twitter_credential_name');
              sessionStorage.removeItem('twitter_client_id');
              sessionStorage.removeItem('twitter_client_secret');
              sessionStorage.removeItem('twitter_redirect_uri');
              
              // Set a flag to indicate the credential was added
              sessionStorage.setItem('credential_added', 'true');
              
              // Close this window after a delay
              setTimeout(() => {
                //window.close();
                // If window doesn't close (some browsers prevent this), redirect to credentials page
                setTimeout(() => {
                  window.location.href = '/credentials';
                }, 500);
              }, 2000);
            } catch (error) {
              console.error('Error processing OAuth callback:', error);
              showError('An unexpected error occurred: ' + (error.message || 'Unknown error'));
            }
          })();
        </script>
      </body>
    </html>
  `;
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
} 