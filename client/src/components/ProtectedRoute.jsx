import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') {
    return (
      <div style={{textAlign:'center', padding:'48px'}}>
        <h2>🔒 Access Denied</h2>
        <p style={{color:'#6b7280',marginTop:'8px'}}>You need admin access for this page.</p>
      </div>
    );
  }
  return children;
};

export default ProtectedRoute;
