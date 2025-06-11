import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  if (!user) {
    // This should ideally not happen if ProtectedRoute is working correctly
    return <div>User not found. Please log in.</div>;
  }

  return (
    <div>
      <h1>User Profile</h1>
      <p><strong>Username:</strong> {user.username}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>First Name:</strong> {user.firstName || 'N/A'}</p>
      <p><strong>Last Name:</strong> {user.lastName || 'N/A'}</p>
      <p><strong>Role:</strong> {user.role}</p>
      {/* Display other user information as needed */}
    </div>
  );
};

export default ProfilePage;
