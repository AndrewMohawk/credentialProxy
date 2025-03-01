import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable
} from '@simplewebauthn/browser';

const LoginPage: React.FC = () => {
  const { login, getPasskeyAuthOptions, verifyPasskeyAuth, error } = useAuth();
  const navigate = useNavigate();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [webAuthnSupported, setWebAuthnSupported] = useState(false);
  const [platformAuthenticatorAvailable, setPlatformAuthenticatorAvailable] = useState(false);

  // Check if WebAuthn is supported
  React.useEffect(() => {
    const checkWebAuthnSupport = async () => {
      const supportsWebAuthn = browserSupportsWebAuthn();
      setWebAuthnSupported(supportsWebAuthn);

      if (supportsWebAuthn) {
        const hasAuthenticator = await platformAuthenticatorIsAvailable();
        setPlatformAuthenticatorAvailable(hasAuthenticator);
      }
    };

    checkWebAuthnSupport();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    try {
      await login(usernameOrEmail, password);
      navigate('/dashboard');
    } catch (err) {
      setLoginError(error || 'Login failed');
    }
  };

  const handlePasskeyLogin = async () => {
    if (!usernameOrEmail) {
      setLoginError('Please enter your username');
      return;
    }

    if (!webAuthnSupported) {
      setLoginError('Your browser does not support WebAuthn/Passkeys');
      return;
    }

    setIsPasskeyLoading(true);
    setLoginError(null);

    try {
      // Get the passkey options from the server
      const authOptions = await getPasskeyAuthOptions(usernameOrEmail);
      
      // Start the WebAuthn authentication process
      const authenticationResponse = await startAuthentication(authOptions.options);
      
      // Verify the authentication with the server
      await verifyPasskeyAuth(authenticationResponse, authOptions.userId);
      
      // If successful, navigate to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setLoginError(err.message || error || 'Passkey authentication failed');
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="card">
        <div className="card-header">Login</div>
        <div className="card-body">
          {loginError && <div className="alert alert-danger">{loginError}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="usernameOrEmail">Username or Email</label>
              <input
                type="text"
                id="usernameOrEmail"
                className="form-control"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <button type="submit" className="btn btn-primary">Login</button>
            </div>
          </form>
          
          <hr />
          
          <div className="passkey-section">
            <h3>Login with Passkey</h3>
            {webAuthnSupported ? (
              platformAuthenticatorAvailable ? (
                <>
                  <p>Use your device's passkey to authenticate.</p>
                  <button
                    className="btn btn-secondary"
                    onClick={handlePasskeyLogin}
                    disabled={isPasskeyLoading || !usernameOrEmail}
                  >
                    {isPasskeyLoading ? 'Authenticating...' : 'Use Passkey'}
                  </button>
                </>
              ) : (
                <p>
                  Your browser supports WebAuthn, but no platform authenticator (like Touch ID, Face ID, or Windows Hello) is available.
                </p>
              )
            ) : (
              <p>
                Your browser does not support WebAuthn/Passkeys. Please use a modern browser or update your current one.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 