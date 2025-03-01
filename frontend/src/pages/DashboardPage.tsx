import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { startRegistration, browserSupportsWebAuthn } from '@simplewebauthn/browser';

const DashboardPage: React.FC = () => {
  const { user, getPasskeyRegistrationOptions, verifyPasskeyRegistration } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null);

  const handleRegisterPasskey = async () => {
    if (!browserSupportsWebAuthn()) {
      setRegistrationStatus('Your browser does not support WebAuthn/Passkeys');
      setStatusType('error');
      return;
    }

    try {
      setIsRegistering(true);
      setRegistrationStatus('Initializing passkey registration...');
      setStatusType(null);

      // Get registration options from the server
      const options = await getPasskeyRegistrationOptions();
      
      // Start the registration process in the browser
      const registrationResponse = await startRegistration(options);

      // Verify the registration with the server
      await verifyPasskeyRegistration(registrationResponse);
      
      setRegistrationStatus('Passkey registered successfully!');
      setStatusType('success');
    } catch (err: any) {
      console.error(err);
      setRegistrationStatus(err.message || 'Failed to register passkey');
      setStatusType('error');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="dashboard-page">
      <h1>Dashboard</h1>
      <p>Welcome, {user?.username}!</p>
      
      {registrationStatus && (
        <div className={`alert ${statusType === 'success' ? 'alert-success' : statusType === 'error' ? 'alert-danger' : 'alert-info'}`}>
          {registrationStatus}
        </div>
      )}
      
      <div className="dashboard-cards">
        <div className="card">
          <div className="card-header">Credentials</div>
          <div className="card-body">
            <p>Manage your credentials securely.</p>
            <Link to="/dashboard/credentials" className="btn btn-primary">View Credentials</Link>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">Applications</div>
          <div className="card-body">
            <p>Manage third-party applications that can use your credentials.</p>
            <Link to="/dashboard/applications" className="btn btn-primary">View Applications</Link>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">Passkeys</div>
          <div className="card-body">
            <p>Manage your passkeys for secure authentication.</p>
            <button 
              className="btn btn-primary"
              onClick={handleRegisterPasskey}
              disabled={isRegistering}
            >
              {isRegistering ? 'Registering...' : 'Register New Passkey'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="recent-activity">
        <h2>Recent Activity</h2>
        <p>No recent activity to display.</p>
      </div>
    </div>
  );
};

export default DashboardPage; 