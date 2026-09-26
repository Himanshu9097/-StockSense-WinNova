import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  // Show nothing while we check if the user is logged in
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-md-background">
        <div className="text-md-primary text-lg font-medium animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
