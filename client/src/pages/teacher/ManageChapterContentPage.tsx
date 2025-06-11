import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getResourcesForChapter } from '../../services/resourceService';
import { getCourseById } from '../../services/courseService'; // To get course title
import { Resource, ResourceType } from '../../types/resource';
import { Course, Chapter } from '../../types/course'; // Assuming Chapter type is here
import { useAuth } from '../../contexts/AuthContext';

const styles: { [key: string]: React.CSSProperties } = {
  page: { padding: '20px', fontFamily: 'Arial, sans-serif' },
  header: { marginBottom: '20px' },
  courseTitle: { fontSize: '1.2rem', color: '#555', marginBottom: '5px' },
  chapterTitle: { fontSize: '1.8rem', margin: '0 0 20px 0'},
  resourceList: { listStyle: 'none', padding: 0 },
  resourceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    border: '1px solid #eee',
    borderRadius: '4px',
    marginBottom: '10px'
  },
  resourceInfo: {},
  resourceTitle: { fontSize: '1.1rem', margin: '0 0 5px 0' },
  resourceType: { fontSize: '0.9rem', color: '#777' },
  actionsPlaceholder: { marginTop: '20px', borderTop: '1px dashed #ccc', paddingTop: '20px' },
  addButton: {
    padding: '10px 15px',
    fontSize: '1rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    textDecoration: 'none',
    marginRight: '10px',
  },
  loading: { textAlign: 'center', fontSize: '1.2rem', marginTop: '50px' },
  error: { textAlign: 'center', color: 'red', fontSize: '1.2rem', marginTop: '50px' },
};

const ManageChapterContentPage: React.FC = () => {
  const { courseId, chapterId } = useParams<{ courseId: string; chapterId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null); // For chapter title
  const [linkedResources, setLinkedResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!courseId || !chapterId) {
      setError("Course or Chapter ID missing from URL.");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch course details (for title and to find specific chapter title)
        const courseData = await getCourseById(courseId);
        setCourse(courseData);
        const currentChapter = courseData.chapters?.find(c => c.id.toString() === chapterId);
        setChapter(currentChapter || null);
        if (!currentChapter) {
            throw new Error("Chapter not found in the course.");
        }

        // Fetch resources linked to this chapter
        const resourcesData = await getResourcesForChapter(courseId, chapterId);
        setLinkedResources(resourcesData);

      } catch (err: any) {
        console.error("Error fetching chapter content data:", err);
        setError(err.message || "Failed to load data for managing chapter content.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [courseId, chapterId]);

  // Basic role check, TeacherProtectedRoute should handle primary guarding
  if (user?.role !== 'teacher') {
    return <div style={styles.error}>You are not authorized to manage this content.</div>;
  }


  if (isLoading) {
    return <div style={styles.loading}>Loading chapter content management...</div>;
  }

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  if (!course || !chapter) {
    return <div style={styles.error}>Course or Chapter details could not be loaded.</div>;
  }


  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <Link to={`/courses/${courseId}`} style={styles.courseTitle}>Back to Course: {course?.title}</Link>
        <h1 style={styles.chapterTitle}>Manage Content for Chapter: {chapter?.title}</h1>
      </header>

      <div>
        <h3>Currently Linked Resources:</h3>
        {linkedResources.length === 0 ? (
          <p>No resources added to this chapter yet.</p>
        ) : (
          <ul style={styles.resourceList}>
            {linkedResources.map(resource => (
              <li key={resource.id} style={styles.resourceItem}>
                <div style={styles.resourceInfo}>
                  <h4 style={styles.resourceTitle}>{resource.title}</h4>
                  <p style={styles.resourceType}>Type: {resource.type}</p>
                </div>
                {/* Placeholder for Remove/Reorder controls */}
                <div>
                  <button disabled style={{marginRight: '5px'}}>Reorder</button>
                  <button disabled>Remove</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={styles.actionsPlaceholder}>
        <h3>Manage Resources</h3>
        <button style={styles.addButton} disabled>Add Existing Resource</button>
        {/* Above button could link to /teacher/resources to select one, or a modal */}
        <Link to={`/teacher/resources/new?courseId=${courseId}&chapterId=${chapterId}`} style={styles.addButton}>
            Create New Resource for this Chapter
        </Link>
        <p style={{marginTop: '10px'}}><small>Reordering and removal functionality will be implemented here.</small></p>
      </div>
    </div>
  );
};

export default ManageChapterContentPage;
