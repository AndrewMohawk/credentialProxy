import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface Application {
  id: string;
  name: string;
  description: string;
  publicKey: string;
  createdAt: string;
}

const ApplicationsPage: React.FC = () => {
  const { } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newApplication, setNewApplication] = useState({
    name: '',
    description: '',
    publicKey: ''
  });

  // Mock data for demonstration
  useEffect(() => {
    // In a real app, you would fetch applications from the API
    const mockApplications: Application[] = [
      {
        id: '1',
        name: 'Example App',
        description: 'An example third-party application',
        publicKey: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC...',
        createdAt: new Date().toISOString()
      }
    ];
    
    setApplications(mockApplications);
    setLoading(false);
  }, []);

  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      // In a real app, you would send the new application to the API
      // const response = await axios.post('/api/v1/applications', newApplication);
      
      // Mock response
      const mockResponse = {
        data: {
          id: Math.random().toString(36).substring(7),
          ...newApplication,
          createdAt: new Date().toISOString()
        }
      };
      
      setApplications([...applications, mockResponse.data as Application]);
      setShowAddForm(false);
      setNewApplication({
        name: '',
        description: '',
        publicKey: ''
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add application');
    }
  };

  const handleDeleteApplication = async (id: string) => {
    try {
      // In a real app, you would delete the application via the API
      // await axios.delete(`/api/v1/applications/${id}`);
      
      setApplications(applications.filter(app => app.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete application');
    }
  };

  if (loading) {
    return <div>Loading applications...</div>;
  }

  return (
    <div className="applications-page">
      <div className="page-header">
        <h1>Applications</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add Application'}
        </button>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      {showAddForm && (
        <div className="card">
          <div className="card-header">Add New Application</div>
          <div className="card-body">
            <form onSubmit={handleAddApplication}>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  className="form-control"
                  value={newApplication.name}
                  onChange={(e) => setNewApplication({...newApplication, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  className="form-control"
                  value={newApplication.description}
                  onChange={(e) => setNewApplication({...newApplication, description: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="publicKey">Public Key</label>
                <textarea
                  id="publicKey"
                  className="form-control"
                  value={newApplication.publicKey}
                  onChange={(e) => setNewApplication({...newApplication, publicKey: e.target.value})}
                  required
                  rows={5}
                  placeholder="Paste the application's public key here"
                />
              </div>
              
              <div className="form-group">
                <button type="submit" className="btn btn-primary">Save Application</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {applications.length === 0 ? (
        <p>No applications found. Add your first application to get started.</p>
      ) : (
        <div className="applications-list">
          {applications.map(application => (
            <div className="card" key={application.id}>
              <div className="card-header">{application.name}</div>
              <div className="card-body">
                <p>{application.description}</p>
                <p>Created: {new Date(application.createdAt).toLocaleDateString()}</p>
                <div className="card-actions">
                  <button className="btn btn-secondary">View Details</button>
                  <button className="btn btn-primary">Manage Policies</button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleDeleteApplication(application.id)}
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

export default ApplicationsPage; 