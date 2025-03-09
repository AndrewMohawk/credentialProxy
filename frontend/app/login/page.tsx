'use client';

import type React from 'react';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Fingerprint, KeyRound, ArrowRight, User, AlertCircle, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { ModeToggle } from '@/components/mode-toggle';
import { useAuth } from '@/hooks/use-auth';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Calculate password entropy
const calculatePasswordEntropy = (password: string): number => {
  if (!password) return 0;
  
  // Calculate character set size
  let charSetSize = 0;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[^a-zA-Z0-9]/.test(password);
  
  if (hasLowercase) charSetSize += 26;
  if (hasUppercase) charSetSize += 26;
  if (hasNumbers) charSetSize += 10;
  if (hasSymbols) charSetSize += 33; // Approximation of common symbols
  
  // Calculate entropy: log2(charSetSize^length)
  const entropy = Math.log2(Math.pow(charSetSize, password.length));
  
  return entropy;
};

// Get password strength info based on entropy
const getPasswordStrengthInfo = (entropy: number) => {
  if (entropy === 0) return { strength: 0, label: 'No password', color: 'bg-gray-300' };
  if (entropy < 28) return { strength: 25, label: 'Very weak', color: 'bg-red-500' };
  if (entropy < 36) return { strength: 50, label: 'Weak', color: 'bg-orange-500' };
  if (entropy < 60) return { strength: 75, label: 'Good', color: 'bg-yellow-500' };
  return { strength: 100, label: 'Strong', color: 'bg-green-500' };
};

export default function LoginPage() {
  const [step, setStep] = useState<'username' | 'password' | 'passkey' | 'register'>('username');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [passwordEntropy, setPasswordEntropy] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState({ strength: 0, label: '', color: '' });
  
  const router = useRouter();
  const { toast } = useToast();
  const { login, register, isAuthenticated } = useAuth();

  // Add refs for input fields
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  
  // Focus the appropriate input field when step changes
  useEffect(() => {
    if (step === 'username' && usernameInputRef.current) {
      usernameInputRef.current.focus();
    } else if (step === 'password' && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [step]);

  // Update password entropy when password changes
  useEffect(() => {
    const entropy = calculatePasswordEntropy(password);
    setPasswordEntropy(entropy);
    setPasswordStrength(getPasswordStrengthInfo(entropy));
  }, [password]);

  // Add a useEffect to redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);
  
  // Prevent form reset when there's an error
  useEffect(() => {
    if (errorMessage && step === 'password') {
      // Ensure password field stays focused when there's an error
      passwordInputRef.current?.focus();
    }
  }, [errorMessage, step]);

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!username) {
      setErrorMessage('Username is required');
      return;
    }

    // For now, we'll just go to password step
    setStep('password');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!password) {
      setErrorMessage('Password is required');
      return;
    }
    
    setIsLoading(true);

    try {
      const success = await login(username, password);
      
      if (success) {
        // Redirect handled by useAuth hook
        router.push('/');
      } else {
        setIsLoading(false);
        setErrorMessage('Login failed. Please check your credentials and try again.');
      }
    } catch (error: any) {
      setIsLoading(false);
      // Set error message from the caught error
      setErrorMessage(error.message || 'Login failed. Please check your credentials and try again.');
      
      // Ensure we stay on the password step
      setStep('password');
    }
  };

  const handlePasskeySubmit = async () => {
    setIsLoading(true);

    try {
      // Passkey authentication is not implemented yet
      toast({
        variant: 'destructive',
        title: 'Not implemented',
        description: 'Passkey authentication is not implemented yet.',
      });
      setIsLoading(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Authentication failed',
        description: 'Passkey verification failed. Please try again.',
      });
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    // Validate fields
    if (!username) {
      setErrorMessage('Username is required');
      return;
    }
    
    if (!email) {
      setErrorMessage('Email is required');
      return;
    }
    
    if (!password) {
      setErrorMessage('Password is required');
      return;
    }
    
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }
    
    // Warn about weak passwords but don't prevent registration
    if (passwordEntropy < 36) {
      const confirm = window.confirm('Your password is weak and may be easy to guess. Are you sure you want to continue with this password?');
      if (!confirm) return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await register(username, email, password);
      
      if (success) {
        // Redirect handled by useAuth hook
        toast({
          title: 'Account created successfully',
          description: 'Welcome to Credential Proxy!',
        });
        router.push('/');
      } else {
        setIsLoading(false);
        // The error is handled in the useAuth hook via toast notifications,
        // but we should check if there's an error message we need to display in the UI
        
        // To ensure error messages also appear in the UI, we need to wait a moment
        // for any potential error messages to be updated
        setTimeout(() => {
          if (!errorMessage) {
            setErrorMessage('Registration failed. Please check your inputs and try again.');
          }
        }, 100);
      }
    } catch (error: any) {
      setIsLoading(false);
      
      // Display the error message in the UI
      if (error.message) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Registration failed. Please check your inputs and try again.');
      }
    }
  };

  const resetFlow = () => {
    setStep('username');
    setPassword('');
    setEmail('');
    setConfirmPassword('');
    setErrorMessage('');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="absolute right-4 top-4">
        <ModeToggle />
      </div>
      <main className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-2">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">Credential Proxy</CardTitle>
            <CardDescription className="text-center">
              {step === 'username'
                ? 'Enter your username to continue'
                : step === 'password'
                  ? `Welcome back, ${username}`
                  : step === 'passkey'
                    ? `Verify with passkey, ${username}`
                    : 'Create a new account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            
            {step === 'username' && (
              <form onSubmit={handleUsernameSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10"
                      autoComplete="username"
                      required
                      ref={usernameInputRef}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            )}

            {step === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Button variant="link" className="px-0 text-xs" onClick={resetFlow}>
                      Not you?
                    </Button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      autoComplete="current-password"
                      required
                      ref={passwordInputRef}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handlePasswordSubmit(e);
                        }
                      }}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Authenticating...' : 'Sign in'}
                </Button>
                <div className="text-center">
                  <Button variant="link" className="text-xs" onClick={() => setStep('passkey')}>
                    Use passkey instead
                  </Button>
                </div>
              </form>
            )}

            {step === 'passkey' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Passkey Authentication</Label>
                  <Button variant="link" className="px-0 text-xs" onClick={resetFlow}>
                    Not you?
                  </Button>
                </div>
                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Fingerprint className="h-10 w-10 text-primary" />
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    Use your biometric or security key to verify your identity
                  </p>
                </div>
                <Button onClick={handlePasskeySubmit} className="w-full" disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Verify with passkey'}
                </Button>
                <div className="text-center">
                  <Button variant="link" className="text-xs" onClick={() => setStep('password')}>
                    Use password instead
                  </Button>
                </div>
              </div>
            )}

            {step === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-username"
                      placeholder="Choose a username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10"
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  
                  {/* Password strength meter */}
                  {password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Password strength: {passwordStrength.label}</span>
                        <span>Entropy: {Math.round(passwordEntropy)} bits</span>
                      </div>
                      <Progress 
                        value={passwordStrength.strength} 
                        className={passwordStrength.color} 
                      />
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center text-xs">
                          {passwordEntropy >= 60 ? (
                            <Check className="h-3 w-3 text-green-500 mr-1" />
                          ) : (
                            <X className="h-3 w-3 text-red-500 mr-1" />
                          )}
                          <span>Strong password (60+ bits of entropy)</span>
                        </div>
                        <div className="flex items-center text-xs">
                          {passwordEntropy >= 36 ? (
                            <Check className="h-3 w-3 text-green-500 mr-1" />
                          ) : (
                            <X className="h-3 w-3 text-red-500 mr-1" />
                          )}
                          <span>Reasonable password (36+ bits of entropy)</span>
                        </div>
                        <div className="flex items-center text-xs mt-1">
                          <span className="text-muted-foreground">Server requires: 8+ chars, uppercase, lowercase, number</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password">Confirm Password</Label>
                  <Input
                    id="register-confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                  )}
                </div>
                <Button type="submit" className="w-full relative" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <span className="opacity-0">Creating account...</span>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-5 w-5 rounded-full border-2 border-b-transparent animate-spin" />
                      </div>
                    </>
                  ) : (
                    'Create account'
                  )}
                </Button>
                <div className="text-center">
                  <Button variant="link" className="text-xs" onClick={() => setStep('username')}>
                    Back to login
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            <Tabs defaultValue="login" className="w-full" onValueChange={(value) => {
              if (value === 'register') {
                setStep('register');
              } else {
                setStep('username');
              }
            }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}

