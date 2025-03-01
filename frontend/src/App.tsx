import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CredentialsPage from './pages/CredentialsPage';
import ApplicationsPage from './pages/ApplicationsPage';
import NotFoundPage from './pages/NotFoundPage';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <div className="container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/credentials" element={
              <ProtectedRoute>
                <CredentialsPage />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/applications" element={
              <ProtectedRoute>
                <ApplicationsPage />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App; 