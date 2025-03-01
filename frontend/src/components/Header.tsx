import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="container header-content">
        <Link to="/" className="logo">Credential Proxy</Link>
        <nav>
          <ul className="nav-list">
            {!user ? (
              <>
                <li className="nav-item">
                  <Link to="/login" className="nav-link">Login</Link>
                </li>
                <li className="nav-item">
                  <Link to="/register" className="nav-link">Register</Link>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link to="/dashboard" className="nav-link">Dashboard</Link>
                </li>
                <li className="nav-item">
                  <Link to="/dashboard/credentials" className="nav-link">Credentials</Link>
                </li>
                <li className="nav-item">
                  <Link to="/dashboard/applications" className="nav-link">Applications</Link>
                </li>
                <li className="nav-item">
                  <button onClick={handleLogout} className="nav-link btn-link">Logout</button>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header; 