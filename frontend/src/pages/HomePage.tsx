import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="home-page">
      <div className="hero">
        <h1>Credential Proxy</h1>
        <p className="lead">
          A secure credential management system that allows third-party applications to perform operations using credentials without ever seeing the actual credentials.
        </p>
        {!user ? (
          <div className="cta-buttons">
            <Link to="/login" className="btn btn-primary">Login</Link>
            <Link to="/register" className="btn btn-secondary">Register</Link>
          </div>
        ) : (
          <div className="cta-buttons">
            <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
          </div>
        )}
      </div>

      <div className="features">
        <div className="feature">
          <h2>Secure Credential Storage</h2>
          <p>
            Your credentials are encrypted using industry-standard encryption algorithms and stored securely.
          </p>
        </div>
        <div className="feature">
          <h2>Third-Party Access</h2>
          <p>
            Allow third-party applications to perform operations using your credentials without ever exposing the actual credential data.
          </p>
        </div>
        <div className="feature">
          <h2>Passkey Authentication</h2>
          <p>
            Use passkeys for secure authentication without having to remember complex passwords.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 