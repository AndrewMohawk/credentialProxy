import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface Credential {
  id: string;
  name: string;
  type: string;
  createdAt: string;
}

const CredentialsPage: React.FC = () => {
  const { } = useAuth();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCredential, setNewCredential] = useState({
    name: '',
    type: 'cookie',
    data: ''
  });

  // Mock data for demonstration
  React.useEffect(() => {
    // In a real app, you would fetch credentials from the API
    const mockCredentials: Credential[] = [
      {
        id: '1',
        name: 'Google Account',
        type: 'cookie',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'GitHub API',
        type: 'api_key',
        createdAt: new Date().toISOString()
      }
    ];
    
    setCredentials(mockCredentials);
    setLoading(false);
  }, []);

  const handleAddCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      // In a real app, you would send the new credential to the API
      // const response = await axios.post('/api/v1/credentials', newCredential);
      
      // Mock response
      const mockResponse = {
        data: {
          id: Math.random().toString(36).substring(7),
          ...newCredential,
          createdAt: new Date().toISOString()
        }
      };
      
      setCredentials([...credentials, mockResponse.data as Credential]);
      setShowAddForm(false);
      setNewCredential({
        name: '',
        type: 'cookie',
        data: ''
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add credential');
    }
  };

  const handleDeleteCredential = async (id: string) => {
    try {
      // In a real app, you would delete the credential via the API
      // await axios.delete(`/api/v1/credentials/${id}`);
      
      setCredentials(credentials.filter(cred => cred.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete credential');
    }
  };

  if (loading) {
    return <div>Loading credentials...</div>;
  }

  return (
    <div className="credentials-page">
      <div className="page-header">
        <h1>Credentials</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add Credential'}
        </button>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      {showAddForm && (
        <div className="card">
          <div className="card-header">Add New Credential</div>
          <div className="card-body">
            <form onSubmit={handleAddCredential}>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  className="form-control"
                  value={newCredential.name}
                  onChange={(e) => setNewCredential({...newCredential, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="type">Type</label>
                <select
                  id="type"
                  className="form-control"
                  value={newCredential.type}
                  onChange={(e) => setNewCredential({...newCredential, type: e.target.value})}
                  required
                >
                  <option value="cookie">Cookie</option>
                  <option value="api_key">API Key</option>
                  <option value="oauth">OAuth</option>
                  <option value="ethereum">Ethereum</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="data">Credential Data</label>
                <textarea
                  id="data"
                  className="form-control"
                  value={newCredential.data}
                  onChange={(e) => setNewCredential({...newCredential, data: e.target.value})}
                  required
                  rows={5}
                  placeholder={newCredential.type === 'cookie' ? 'Enter cookie data in format: name=value; domain=example.com; path=/; secure; httpOnly' : 'Enter credential data'}
                />
              </div>
              
              <div className="form-group">
                <button type="submit" className="btn btn-primary">Save Credential</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {credentials.length === 0 ? (
        <p>No credentials found. Add your first credential to get started.</p>
      ) : (
        <div className="credentials-list">
          {credentials.map(credential => (
            <div className="card" key={credential.id}>
              <div className="card-header">
                {credential.name}
                <span className="badge">{credential.type}</span>
              </div>
              <div className="card-body">
                <p>Created: {new Date(credential.createdAt).toLocaleDateString()}</p>
                <div className="card-actions">
                  <button className="btn btn-secondary">View Details</button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleDeleteCredential(credential.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CredentialsPage; 