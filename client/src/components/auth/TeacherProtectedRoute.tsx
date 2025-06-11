import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const TeacherProtectedRoute: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading authentication status...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'teacher') {
    // If authenticated but not a teacher, redirect to a general page (e.g., home or an unauthorized page)
    // Or display an "Unauthorized" message inline.
    // For this example, redirecting to home.
    alert('You are not authorized to access this page.'); // Optional: alert before redirect
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Outlet />; // Render child components if authenticated and is a teacher
};

export default TeacherProtectedRoute;
