import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyResources, deleteResource } from '../../services/resourceService'; // Import deleteResource
import { Resource } from '../../types/resource'; // Import Resource type
import { useAuth } from '../../contexts/AuthContext';

// Basic styling (can be moved to a CSS file)
const styles: { [key: string]: React.CSSProperties } = {
  page: { padding: '20px', fontFamily: 'Arial, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  title: { fontSize: '2rem', margin: 0 },
  createButton: {
    padding: '10px 15px',
    fontSize: '1rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  resourceTable: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
  tableHeader: { backgroundColor: '#f0f0f0' },
  tableCell: { border: '1px solid #ddd', padding: '8px', textAlign: 'left' },
  actionsCell: { display: 'flex', gap: '10px'},
  actionButton: { padding: '5px 10px', fontSize: '0.9rem', border: 'none', borderRadius: '3px', cursor: 'pointer' },
  editButton: { backgroundColor: '#ffc107' },
  deleteButton: { backgroundColor: '#dc3545', color: 'white' },
  loading: { textAlign: 'center', fontSize: '1.2rem', marginTop: '50px' },
  error: { textAlign: 'center', color: 'red', fontSize: '1.2rem', marginTop: '50px' },
  noResources: { textAlign: 'center', fontSize: '1.1rem', marginTop: '30px' }
};


const MyResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false); // For delete operation loading state
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // For success notifications
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'teacher') {
      // This is a fallback, route protection should ideally handle this.
      // Or, display a message "You are not authorized to view this page."
      navigate('/'); // Redirect to home if not a teacher
      return;
    }

    const fetchResources = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null); // Clear previous success messages
        const data = await getMyResources(); // Use actual service call
        setResources(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch resources.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === 'teacher') { // Fetch only if user is confirmed as teacher
        fetchResources();
    } else if (user && user.role !== 'teacher') { // If user is loaded but not teacher
        navigate('/');
        setIsLoading(false); // Stop loading as we are redirecting
    }
    // If user is null (still loading from AuthContext), useEffect will re-run when user state changes.
  }, [user, navigate]);

  const handleDeleteResource = async (resourceId: string, resourceTitle: string) => {
    if (window.confirm(`Are you sure you want to delete the resource "${resourceTitle}"?`)) {
      setIsDeleting(true);
      setError(null);
      setSuccessMessage(null);
      try {
        await deleteResource(resourceId);
        setResources(prevResources => prevResources.filter(res => res.id !== resourceId));
        setSuccessMessage(`Resource "${resourceTitle}" deleted successfully.`);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to delete resource.');
        console.error("Delete error:", err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (isLoading) { // Initial page load
    return <div style={styles.loading}>Loading your resources...</div>;
  }

  // This error is for initial fetch. Delete errors are handled inline or via success/error messages.
  if (error && !isDeleting) { // Show general fetch error if not in midst of deleting
    return <div style={styles.error}>{error}</div>;
  }

  // Fallback if user somehow lands here without being a teacher
  if (user?.role !== 'teacher') {
    return <div style={styles.error}>You are not authorized to view this page.</div>;
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>My Resources</h1>
        <Link to="/teacher/resources/new" style={styles.createButton}>
          Create New Resource
        </Link>
      </header>

      {/* Display success or error messages related to delete operations */}
      {successMessage && <p style={{ color: 'green', textAlign: 'center' }}>{successMessage}</p>}
      {error && isDeleting && <p style={{ color: 'red', textAlign: 'center' }}>Error: {error}</p>}


      {resources.length === 0 ? (
        <p style={styles.noResources}>You haven't created any resources yet.</p>
      ) : (
        <table style={styles.resourceTable}>
          <thead style={styles.tableHeader}>
            <tr>
              <th style={styles.tableCell}>Title</th>
              <th style={styles.tableCell}>Type</th>
              <th style={styles.tableCell}>Created At</th>
              <th style={styles.tableCell}>Last Updated</th>
              <th style={styles.tableCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((resource) => (
              <tr key={resource.id}>
                <td style={styles.tableCell}>{resource.title}</td>
                <td style={styles.tableCell}>{resource.type}</td>
                <td style={styles.tableCell}>{new Date(resource.createdAt).toLocaleDateString()}</td>
                <td style={styles.tableCell}>{new Date(resource.updatedAt).toLocaleDateString()}</td>
                <td style={{...styles.tableCell, ...styles.actionsCell}}>
                  <button
                    style={{...styles.actionButton, ...styles.editButton}}
                    onClick={() => navigate(`/teacher/resources/edit/${resource.id}`)}
                    disabled={isDeleting} // Disable edit while a delete is in progress
                  >
                    Edit
                  </button>
                  <button
                    style={{...styles.actionButton, ...styles.deleteButton}}
                    onClick={() => handleDeleteResource(resource.id, resource.title)}
                    disabled={isDeleting} // Prevent multiple delete clicks
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MyResourcesPage;
