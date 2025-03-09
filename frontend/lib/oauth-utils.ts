/**
 * OAuth utility functions for the Credential Proxy
 * Provides PKCE code challenge generation and other OAuth-related utilities
 */

/**
 * Generates a cryptographically secure random string
 * For use as a PKCE code verifier or state parameter
 * 
 * @param length The length of the random string
 * @returns A random string of the specified length
 */
export function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  
  // Use a secure random number generator if available
  const values = new Uint8Array(length);
  
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(values);
    
    // Create the random string from the random values
    for (let i = 0; i < length; i++) {
      result += charset[values[i] % charset.length];
    }
  } else {
    // Fallback to Math.random if crypto is not available (not recommended)
    for (let i = 0; i < length; i++) {
      result += charset[Math.floor(Math.random() * charset.length)];
    }
  }
  
  return result;
}

/**
 * Generates a PKCE code challenge from a code verifier using SHA-256
 * 
 * @param codeVerifier The code verifier string
 * @returns A Promise that resolves to the code challenge
 */
export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('generateCodeChallenge can only be used in browser environments');
  }
  
  // Convert the code verifier to a Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  
  // Hash the code verifier using SHA-256
  const hash = await window.crypto.subtle.digest('SHA-256', data);
  
  // Convert the hash to a base64url encoded string
  return base64UrlEncode(hash);
}

/**
 * Encodes an ArrayBuffer as a base64url string
 * 
 * @param buffer The ArrayBuffer to encode
 * @returns A base64url encoded string
 */
function base64UrlEncode(buffer: ArrayBuffer): string {
  // Convert the ArrayBuffer to a Uint8Array
  const bytes = new Uint8Array(buffer);
  
  // Convert to a binary string
  let binaryString = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }
  
  // Create Base64 string
  const base64 = btoa(binaryString);
  
  // Convert to base64url by replacing '+' with '-', '/' with '_', and removing '='
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Parse OAuth parameters from the URL
 * 
 * @returns An object containing the parsed OAuth parameters or null if none found
 */
export function parseOAuthParams(): { code?: string; state?: string; error?: string; error_description?: string } | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const searchParams = new URLSearchParams(window.location.search);
  
  // Check if this is an OAuth callback
  if (!searchParams.has('code') && !searchParams.has('error')) {
    return null;
  }
  
  return {
    code: searchParams.get('code') || undefined,
    state: searchParams.get('state') || undefined,
    error: searchParams.get('error') || undefined,
    error_description: searchParams.get('error_description') || undefined
  };
} 