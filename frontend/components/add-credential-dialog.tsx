'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Plus, Twitter, ChevronLeft, Settings2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { generateRandomString, generateCodeChallenge } from '@/lib/oauth-utils';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/use-auth';
import apiClient from '@/lib/api-client';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Dynamic schema will be created based on available types
const baseCredentialFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  data: z.record(z.any()).optional(),
});

// Define the dynamic fields for each credential type
const credentialTypeFields: Record<string, Array<{ name: string; label: string; type: string; description?: string; options?: string[] }>> = {
  API_KEY: [
    {
      name: 'method',
      label: 'Authentication Method',
      type: 'select',
      options: ['bearer', 'header', 'query', 'body'],
      description: 'How the API key should be sent'
    },
    {
      name: 'key',
      label: 'API Key',
      type: 'password',
      description: 'The API key value'
    },
    {
      name: 'headerName',
      label: 'Header Name',
      type: 'text',
      description: 'Custom header name (if using header method)'
    },
    {
      name: 'paramName',
      label: 'Parameter Name',
      type: 'text',
      description: 'Query or body parameter name (if using query/body method)'
    }
  ],
  OAUTH: [
    {
      name: 'provider',
      label: 'OAuth Provider',
      type: 'select',
      options: ['github', 'google', 'facebook', 'twitter', 'custom'],
      description: 'Select the OAuth provider'
    },
    {
      name: 'clientId',
      label: 'Client ID',
      type: 'text',
      description: 'OAuth client ID'
    },
    {
      name: 'clientSecret',
      label: 'Client Secret',
      type: 'password',
      description: 'OAuth client secret'
    },
    {
      name: 'scope',
      label: 'Scope (Optional)',
      type: 'text',
      description: 'OAuth scopes (space-separated)'
    },
    {
      name: 'authorizationUrl',
      label: 'Authorization URL (custom provider)',
      type: 'text',
      description: 'OAuth authorization endpoint URL'
    },
    {
      name: 'tokenUrl',
      label: 'Token URL (custom provider)',
      type: 'text',
      description: 'OAuth token endpoint URL'
    },
    {
      name: 'redirectUri',
      label: 'Redirect URI',
      type: 'text',
      description: 'OAuth redirect URI'
    }
  ],
  ETHEREUM_KEY: [
    {
      name: 'privateKey',
      label: 'Private Key',
      type: 'password',
      description: 'Ethereum private key (encrypted)'
    },
    {
      name: 'address',
      label: 'Address',
      type: 'text',
      description: 'Ethereum address'
    }
  ],
  COOKIE: [
    {
      name: 'cookies',
      label: 'Cookies',
      type: 'textarea',
      description: 'JSON formatted cookies object or cookie string'
    }
  ],
  TWITTER_OAUTH: [
    {
      name: 'clientId',
      label: 'Client ID',
      type: 'text',
      description: 'Twitter OAuth 2.0 client ID'
    },
    {
      name: 'clientSecret',
      label: 'Client Secret',
      type: 'password',
      description: 'Twitter OAuth 2.0 client secret'
    }
  ],
  TWITTER_COOKIE: [
    {
      name: 'cookies',
      label: 'Twitter Cookies',
      type: 'textarea',
      description: 'Twitter cookies in JSON format or cookie string'
    },
    {
      name: 'csrfToken',
      label: 'CSRF Token',
      type: 'password',
      description: 'Twitter CSRF token (ct0)'
    },
    {
      name: 'authToken',
      label: 'Auth Token',
      type: 'password',
      description: 'Twitter auth token (auth_token)'
    }
  ],
  NPM: [
    {
      name: 'token',
      label: 'NPM Token',
      type: 'password',
      description: 'NPM authentication token'
    },
    {
      name: 'scope',
      label: 'Scope (Optional)',
      type: 'text',
      description: 'NPM scope (e.g. @myorg)'
    },
    {
      name: 'registry',
      label: 'Registry URL (Optional)',
      type: 'text',
      description: 'NPM registry URL (defaults to https://registry.npmjs.org)'
    }
  ],
  BLUESKY: [
    {
      name: 'identifier',
      label: 'Identifier',
      type: 'text',
      description: 'Bluesky handle or email'
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      description: 'Bluesky account password'
    },
    {
      name: 'server',
      label: 'Server (Optional)',
      type: 'text',
      description: 'Bluesky server URL (defaults to https://bsky.social)'
    },
    {
      name: 'accessJwt',
      label: 'Access JWT (Optional)',
      type: 'password',
      description: 'Bluesky access JWT (will be auto-generated if not provided)'
    },
    {
      name: 'refreshJwt',
      label: 'Refresh JWT (Optional)',
      type: 'password',
      description: 'Bluesky refresh JWT (will be auto-generated if not provided)'
    }
  ],
  WARPCAST: [
    {
      name: 'apiKey',
      label: 'API Key',
      type: 'password',
      description: 'Warpcast API key'
    },
    {
      name: 'apiSecret',
      label: 'API Secret',
      type: 'password',
      description: 'Warpcast API secret'
    },
    {
      name: 'fid',
      label: 'FID (Optional)',
      type: 'text',
      description: 'Farcaster ID (will be auto-retrieved if not provided)'
    }
  ],
  OTHER: [
    {
      name: 'data',
      label: 'Credential Data',
      type: 'text',
      description: 'Enter the credential data'
    }
  ]
};

// Add icons for credential types
const credentialTypeIcons: Record<string, React.ReactNode> = {
  API_KEY: <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 7.5V7C15 4.79086 13.2091 3 11 3V3C8.79086 3 7 4.79086 7 7V7.5" stroke="currentColor" strokeWidth="2"/><path d="M5 7.5H19V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V7.5Z" stroke="currentColor" strokeWidth="2"/><path d="M12 12V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  OAUTH: <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 8V12M12 16H12.01M7.8 21H16.2C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  TWITTER_OAUTH: <Twitter className="h-6 w-6 text-[#1DA1F2]" />,
  ETHEREUM_KEY: <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L4 8.5L12 15L20 8.5L12 2Z" stroke="currentColor" strokeWidth="2"/><path d="M4 8.5V15L12 21.5L20 15V8.5" stroke="currentColor" strokeWidth="2"/><path d="M12 15V21.5" stroke="currentColor" strokeWidth="2"/></svg>,
  BLUESKY: <svg className="h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M8 12L11 15L16 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  WARPCAST: <svg className="h-6 w-6 text-purple-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.3301 12.5L12 16.5L9.66987 12.5L12 8.5L14.3301 12.5Z" stroke="currentColor" strokeWidth="2"/><path d="M5.36603 12.5L7.69615 8.5L10.0263 12.5L7.69615 16.5L5.36603 12.5Z" stroke="currentColor" strokeWidth="2"/><path d="M18.634 12.5L16.3038 16.5L13.9737 12.5L16.3038 8.5L18.634 12.5Z" stroke="currentColor" strokeWidth="2"/></svg>,
  COOKIE: <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><circle cx="8" cy="10" r="1" fill="currentColor"/><circle cx="16" cy="10" r="1" fill="currentColor"/><circle cx="8" cy="14" r="1" fill="currentColor"/><circle cx="16" cy="14" r="1" fill="currentColor"/><circle cx="12" cy="8" r="1" fill="currentColor"/><circle cx="12" cy="16" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>,
  OTHER: <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 12H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M12 16V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M12 10C12 8.89543 12.8954 8 14 8C15.1046 8 16 8.89543 16 10C16 10.9706 15.3214 11.7889 14.4133 11.9659C14.1693 12.0157 14 12.2157 14 12.4635V12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
};

// Define step types
type CredentialStep = 'select-type' | 'configure';

interface CredentialType {
  id: string;
  name: string;
  description: string;
}

interface AddCredentialDialogProps {
  onCredentialAdded?: () => void;
}

export function AddCredentialDialog({ onCredentialAdded }: AddCredentialDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [credentialTypes, setCredentialTypes] = React.useState<CredentialType[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState<CredentialStep>('select-type');
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { token } = useAuth();

  // Add OAuth state and error handling
  const [authError, setAuthError] = React.useState<string | null>(null);

  // Add state to track authentication process
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const authPollIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Create a dynamic schema based on available types
  const credentialFormSchema = React.useMemo(() => {
    const typeEnum = z.enum(
      credentialTypes.length > 0 
        ? (credentialTypes.map(type => type.id) as [string, ...string[]]) 
        : ['API_KEY'] // Fallback to API_KEY if no types loaded
    );
    
    return baseCredentialFormSchema.extend({
      type: typeEnum
    });
  }, [credentialTypes]);

  type CredentialFormValues = z.infer<typeof credentialFormSchema>;

  const form = useForm<CredentialFormValues>({
    resolver: zodResolver(credentialFormSchema),
    defaultValues: {
      name: '',
      type: credentialTypes.length > 0 ? credentialTypes[0]?.id : 'API_KEY',
      data: {},
    },
  });

  const credentialType = form.watch('type');

  // Reset the dialog when it's opened/closed
  React.useEffect(() => {
    if (open) {
      setCurrentStep('select-type');
      setShowAdvanced(false);
      setShowGenericMenu(false);
      form.reset({
        name: '',
        type: credentialTypes.length > 0 ? credentialTypes[0]?.id : 'API_KEY',
        data: {},
      });
      if (credentialTypes.length === 0) {
      fetchCredentialTypes();
      }
    }
  }, [open, form, credentialTypes]);

  async function fetchCredentialTypes() {
    setIsLoadingTypes(true);
    try {
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await apiClient.get('/credentials/types');
      console.log('API response for credential types:', response);
      
      // Check the response structure
      if (response.success) {
        // Check if types array exists and is an array
        if (!response.data || !response.data.types || !Array.isArray(response.data.types)) {
          console.error('Unexpected API response format:', response);
          throw new Error('Unexpected API response format');
        }
        
        // The API returns types in the 'types' field of the data object
        const formattedTypes = response.data.types.map((type: any) => ({
          id: type.type,
          name: type.type,
          description: type.description
        }));
        
        // Always ensure Twitter OAuth is available
        const hasTwitterOAuth = formattedTypes.some((type: CredentialType) => type.id === 'TWITTER_OAUTH');
        
        if (!hasTwitterOAuth) {
          formattedTypes.push({
            id: 'TWITTER_OAUTH',
            name: 'Twitter OAuth',
            description: 'Twitter OAuth 2.0 authentication'
          });
        }
        
        setCredentialTypes(formattedTypes);
        
        // Set default value to the first type
        if (formattedTypes.length > 0) {
          form.setValue('type', formattedTypes[0].id);
        }
      } else {
        throw new Error(response.error || 'Failed to load credential types');
      }
    } catch (error: any) {
      console.error('Error fetching credential types:', error);
      // Add fallback types for testing when API fails
      setCredentialTypes([
        { id: 'API_KEY', name: 'API Key', description: 'API Key Credential' },
        { id: 'OAUTH', name: 'OAuth', description: 'OAuth Credential' },
        { id: 'TWITTER_OAUTH', name: 'Twitter OAuth', description: 'Twitter OAuth Credential' }
      ]);
      
      toast({
        variant: 'destructive',
        title: 'Failed to load credential types',
        description: error.message || 'An error occurred'
      });
    } finally {
      setIsLoadingTypes(false);
    }
  }

  async function onSubmit(data: CredentialFormValues) {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/credentials', data);
      
      if (response.success) {
      toast({
          title: 'Credential added',
          description: 'Your credential has been added successfully'
      });

      setOpen(false);
        
        // Invoke callback if provided
        if (onCredentialAdded) {
          onCredentialAdded();
        }
        
        // Refresh the credentials page if we're there
        if (window.location.pathname.includes('/credentials')) {
          router.refresh();
        }
      } else {
        throw new Error(response.error || 'Failed to add credential');
      }
    } catch (error: any) {
      console.error('Error adding credential:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to add credential',
        description: error.message || 'An error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Handle type selection and move to next step
  const handleTypeSelect = (typeId: string) => {
    form.setValue('type', typeId);
    
    // Set a default name based on the type
    const selectedType = credentialTypes.find(t => t.id === typeId);
    if (selectedType) {
      form.setValue('name', `My ${selectedType.name}`);

      // Pre-fill Twitter credentials
      if (selectedType.id === 'TWITTER_OAUTH') {
        form.setValue('data.clientId', 'YzBtT016NjBKOWJES2xFZzZiRGs6MTpjaQ');
        form.setValue('data.clientSecret', 'fH9thYQiInth4vnl5DjYon4RdwpkszAdtmtC-yzb_2h_BTZlLc');
      }
    }
    
    setCurrentStep('configure');
  };

  // Go back to type selection
  const handleBackToTypes = () => {
    setCurrentStep('select-type');
    setShowGenericMenu(false);
  };

  // Function to initiate Twitter OAuth flow with PKCE
  const initiateTwitterOAuthFlow = () => {
    try {
      setAuthError(null);
      
      // Get values from form
      const clientId = form.getValues('data.clientId');
      const clientSecret = form.getValues('data.clientSecret');
      const credentialName = form.getValues('name');
      
      if (!clientId || !clientSecret) {
        setAuthError('Client ID and Client Secret are required');
        return;
      }
      
      // Generate PKCE code verifier and challenge
      const codeVerifier = generateRandomString(64);
      generateCodeChallenge(codeVerifier).then((codeChallenge: string) => {
        // Create the OAuth state and store it
        const state = generateRandomString(32);
        
        // Store auth data in localStorage (accessible across tabs/windows)
        localStorage.setItem('twitter_oauth_state', state);
        localStorage.setItem('twitter_code_verifier', codeVerifier);
        localStorage.setItem('twitter_credential_name', credentialName);
        localStorage.setItem('twitter_client_id', clientId);
        localStorage.setItem('twitter_client_secret', clientSecret);
        localStorage.setItem('credential_dialog_open', 'true');
        
        // Get frontend origin for callback URL display
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const callbackUrl = `${origin}/oauth/callback`;
        
        // Get the exact redirect URI - must match exactly what was configured in Twitter Developer Portal
        const exactRedirectUri = callbackUrl;
        localStorage.setItem('twitter_redirect_uri', exactRedirectUri);
        
        // Build Twitter OAuth authorization URL with PKCE
        const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('client_id', clientId);
        authUrl.searchParams.append('redirect_uri', exactRedirectUri);
        
        // Twitter OAuth 2.0 expects space-separated scopes
        // tweet.read - Read tweets
        // tweet.write - Post tweets
        // users.read - Read user profile
        // email - Access user's email address
        authUrl.searchParams.append('scope', 'tweet.read tweet.write users.read email offline.access');
        
        authUrl.searchParams.append('state', state);
        authUrl.searchParams.append('code_challenge', codeChallenge);
        authUrl.searchParams.append('code_challenge_method', 'S256');
        
        // Open in a new tab instead of redirecting
        window.open(authUrl.toString(), '_blank', 'noopener,noreferrer');
      });
    } catch (error) {
      console.error('Error initiating Twitter OAuth flow:', error);
      setAuthError('Failed to initiate OAuth flow. Please try again.');
    }
  };

  // Check for successful callback and cleanup on unmount
  React.useEffect(() => {
    // Start polling for authentication status when dialog is open
    if (open) {
      const checkAuthStatus = () => {
        const credentialAdded = localStorage.getItem('credential_added');
        
        if (credentialAdded === 'true') {
          // Authentication successful!
          setIsAuthenticated(true);
          
          // Clean up localStorage
          localStorage.removeItem('credential_added');
          localStorage.removeItem('credential_dialog_open');
          
          // Clear the polling interval
          if (authPollIntervalRef.current) {
            clearInterval(authPollIntervalRef.current);
            authPollIntervalRef.current = null;
          }
          
          // Close dialog and refresh after a short delay
          setTimeout(() => {
            setOpen(false);
            
            // Invoke callback if provided
            if (onCredentialAdded) {
              onCredentialAdded();
            }
            
            // Refresh the credentials page if we're there
            if (window.location.pathname.includes('/credentials')) {
              router.refresh();
            }
          }, 500);
        }
      };
      
      // Poll every second to check if authentication completed
      authPollIntervalRef.current = setInterval(checkAuthStatus, 1000);
      
      // Check immediately as well
      checkAuthStatus();
    } else {
      // Clear interval when dialog is closed
      if (authPollIntervalRef.current) {
        clearInterval(authPollIntervalRef.current);
        authPollIntervalRef.current = null;
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (authPollIntervalRef.current) {
        clearInterval(authPollIntervalRef.current);
        authPollIntervalRef.current = null;
      }
    };
  }, [open, onCredentialAdded, router]);

  // Render the credential type selection
  const renderTypeSelection = () => {
    if (isLoadingTypes) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    // Define visible types and types to hide under "Generic"
    const hiddenTypes = ['API_KEY', 'OAUTH', 'COOKIE'];
    const visibleTypes = credentialTypes.filter(type => !hiddenTypes.includes(type.id));
    
    // Check if we have any hidden types actually available
    const hasHiddenTypes = credentialTypes.some(type => hiddenTypes.includes(type.id));
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
        {/* Display the visible credential types */}
        {visibleTypes.map((type) => (
          <Card 
            key={type.id}
            className={
              type.id === 'TWITTER_OAUTH' 
                ? 'cursor-pointer hover:bg-accent/50 transition-colors border-[#1DA1F2]/30 bg-[#1DA1F2]/5' 
                : 'cursor-pointer hover:bg-accent/50 transition-colors'
            }
            onClick={() => handleTypeSelect(type.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{type.name}</CardTitle>
                <div className="p-1">
                  {credentialTypeIcons[type.id] || (
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  )}
                </div>
              </div>
              <CardDescription>{type.description}</CardDescription>
              {type.id === 'TWITTER_OAUTH' && (
                <div className="mt-2 text-xs text-[#1DA1F2] font-medium">Recommended for Twitter integration</div>
              )}
            </CardHeader>
          </Card>
        ))}
        
        {/* Add the "Generic Credential Types" option if we have hidden types */}
        {hasHiddenTypes && (
          <Card 
            key="generic"
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => {
              // Show a submenu with the hidden credential types
              setShowGenericMenu(true);
            }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Generic Credentials</CardTitle>
                <div className="p-1">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M21 6H16M16 6V11M16 6L21 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <CardDescription>API Keys, OAuth, Cookies, and other basic credential types</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    );
  };
  
  // Add state for generic menu
  const [showGenericMenu, setShowGenericMenu] = React.useState(false);
  
  // Render the generic credential type selection
  const renderGenericTypeSelection = () => {
    // Filter to just show the hidden types
    const hiddenTypes = ['API_KEY', 'OAUTH', 'COOKIE'];
    const genericTypes = credentialTypes.filter(type => hiddenTypes.includes(type.id));
    
    return (
      <div className="space-y-4">
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => setShowGenericMenu(false)}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div className="ml-2">
            <h3 className="text-lg font-medium">Generic Credential Types</h3>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4 py-2">
          {genericTypes.map((type) => (
            <Card 
              key={type.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => handleTypeSelect(type.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{type.name}</CardTitle>
                  <div className="p-1">
                    {credentialTypeIcons[type.id] || (
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                </div>
                <CardDescription>{type.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // Render the Twitter OAuth UI
  const renderTwitterOAuthUI = () => {
    const selectedType = credentialTypes.find(t => t.id === credentialType);
    
    if (!selectedType) return null;
    
    // Get frontend origin for callback URL display
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const callbackUrl = `${origin}/oauth/callback`;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={handleBackToTypes}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div className="ml-2 flex items-center gap-2">
            <Twitter className="h-5 w-5 text-[#1DA1F2]" />
            <h3 className="text-lg font-medium">Twitter OAuth</h3>
          </div>
        </div>
      
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Credential Name</FormLabel>
              <FormControl>
                <Input placeholder="My Twitter Credentials" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="bg-card border rounded-lg p-6 space-y-4">
          {isAuthenticated ? (
            <div className="text-center space-y-3 py-2">
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 mx-auto flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h3 className="text-lg font-medium">Authentication Successful!</h3>
              <p className="text-sm text-muted-foreground">
                Your Twitter account has been successfully connected. This dialog will close shortly.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <Twitter className="h-8 w-8 text-[#1DA1F2] mx-auto" />
                <h3 className="text-lg font-medium">Connect Twitter Account</h3>
                <p className="text-sm text-muted-foreground">
                  Click the button below to authenticate with Twitter using OAuth 2.0.
                  A new tab will open for you to complete the authentication.
                </p>
              </div>
              
              <div className="flex justify-center pt-2">
                <Button 
                  type="button"
                  className="gap-2 px-6"
                  size="lg"
                  onClick={initiateTwitterOAuthFlow}
                >
                  <Twitter className="h-4 w-4" />
                  <span>Sign in with Twitter</span>
                </Button>
              </div>
              
              <Collapsible
                open={showAdvanced}
                onOpenChange={setShowAdvanced}
                className="space-y-2"
              >
                <div className="flex items-center justify-center pt-4">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Settings2 className="h-3 w-3" />
                      <span>{showAdvanced ? "Hide Advanced Settings" : "Show Advanced Settings"}</span>
                    </Button>
                  </CollapsibleTrigger>
                </div>
                
                <CollapsibleContent className="space-y-4 pt-2">
                  <div className="p-3 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 rounded-md text-sm">
                    <p className="font-medium">Important: Twitter Developer Settings</p>
                    <p className="mt-1">Make sure you've set the following callback URL in your Twitter Developer Portal:</p>
                    <code className="block mt-1 p-2 bg-white dark:bg-black/40 rounded border border-amber-200 dark:border-amber-800 overflow-x-auto">
                      {callbackUrl}
                    </code>
                    <p className="mt-2 text-xs">If you were previously using a different callback URL, you'll need to update it in the Twitter Developer Portal settings.</p>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="data.clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client ID</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          Your Twitter OAuth 2.0 Client ID
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="data.clientSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Secret</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your Twitter OAuth 2.0 Client Secret
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
        </div>
        
        {authError && !isAuthenticated && (
          <div className="bg-destructive/20 p-3 rounded-md text-destructive text-sm">
            {authError}
          </div>
        )}
      </div>
    );
  };

  // Render the appropriate content based on current step and credential type
  const renderContent = () => {
    if (currentStep === 'select-type') {
      if (showGenericMenu) {
        return renderGenericTypeSelection();
      }
      return renderTypeSelection();
    }

    // Check for special credential types
    if (credentialType === 'TWITTER_OAUTH') {
      return renderTwitterOAuthUI();
    }

    // For other credential types
    return (
      <div className="space-y-4">
        {/* Add back button */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 mb-4"
          onClick={handleBackToTypes}
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
        
        {/* Regular form fields */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Credential Name</FormLabel>
              <FormControl>
                <Input placeholder="My Credential" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Other fields based on credential type */}
        {renderOtherCredentialFields()}
      </div>
    );
  };

  // Render fields for other credential types
  const renderOtherCredentialFields = () => {
    const selectedTypeObj = credentialTypes.find(type => type.id === credentialType);
    
    if (!selectedTypeObj) return null;

    const fields = credentialTypeFields[selectedTypeObj.id] || [];
    
    return (
      <>
        {fields.map((fieldConfig) => {
          const isSelectField = fieldConfig.type === 'select';
          const fieldName = `data.${fieldConfig.name}` as const;
          
          // Handle special field cases
          if (fieldName === "data.redirectUri") {
            // Auto-populate the redirect URI with our domain
            const frontendUrl = window.location.origin;
            const redirectUri = `${frontendUrl}/oauth/callback`;
            
            // Set it in the form using the correct type
            form.setValue("data.redirectUri", redirectUri);
            
            // Don't render this field, it's just for backend use
            return null;
          }
          
          return (
          <FormField
              key={fieldName}
            control={form.control}
              name={fieldName}
              render={({ field }) => (
              <FormItem>
                  <FormLabel>{fieldConfig.label}</FormLabel>
                <FormControl>
                    {isSelectField ? (
                    <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                    >
                      <SelectTrigger>
                          <SelectValue placeholder={`Select ${fieldConfig.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                          {fieldConfig.options?.map((option) => (
                          <SelectItem key={option} value={option}>
                              {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                        type={fieldConfig.type}
                        placeholder={fieldConfig.label}
                        {...field}
                    />
                  )}
                </FormControl>
                  {fieldConfig.description && (
                    <FormDescription>
                      {fieldConfig.description}
                    </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          );
        })}
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1">
          <Plus className="h-4 w-4" />
          <span>Add Credential</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {currentStep === 'select-type' ? "Select Credential Type" : "Add Credential"}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'select-type' 
              ? "Choose the type of credential you want to add to the system." 
              : "Configure the credential details and save to add it to the system."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {renderContent()}
            
            {currentStep === 'configure' && credentialType !== 'TWITTER_OAUTH' && (
              <DialogFooter className="mt-6">
              <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleBackToTypes}
              >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Adding...</span>
                  </>
                ) : (
                    <span>Add Credential</span>
                )}
              </Button>
            </DialogFooter>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 