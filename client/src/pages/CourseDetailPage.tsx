import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom'; // Import Link
import { getCourseById } from '../../services/courseService';
import { Course, Chapter as ChapterType } from '../../types/course'; // Explicitly import ChapterType
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth
import ChapterListItem from '../../components/courses/ChapterListItem';

// Basic styling (can be moved to a CSS file)
const styles: { [key: string]: React.CSSProperties } = {
  page: {
    padding: '20px',
  },
  courseHeader: {
    marginBottom: '30px',
    borderBottom: '1px solid #eee',
    paddingBottom: '20px',
  },
  courseTitle: {
    fontSize: '2rem',
    margin: '0 0 10px 0',
  },
  courseDescription: {
    fontSize: '1rem',
    color: '#333',
    marginBottom: '10px',
  },
  teacherInfo: {
    fontSize: '0.9rem',
    color: '#555',
    marginBottom: '20px',
  },
  chaptersSection: {
    marginTop: '20px',
  },
  chaptersTitle: {
    fontSize: '1.5rem',
    marginBottom: '15px',
  },
  chapterList: {
    listStyle: 'none',
    padding: 0,
  },
  chapterManagementItem: { // Style for the li containing ChapterListItem and Manage button
    marginBottom: '10px',
    padding: '10px',
    border: '1px solid #f0f0f0',
    borderRadius: '4px',
    backgroundColor: '#fafafa',
  },
  manageButton: {
    marginTop: '10px',
    padding: '8px 12px',
    backgroundColor: '#007bff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    display: 'inline-block', // To allow margin-top
    fontSize: '0.9rem',
  },
  // chapterListItem, chapterTitle, chapterContentPreview can be removed if fully handled by ChapterListItem
  loading: {
    textAlign: 'center',
    fontSize: '1.2rem',
    marginTop: '50px',
  },
  error: {
    textAlign: 'center',
    color: 'red',
    fontSize: '1.2rem',
    marginTop: '50px',
  }
};

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth(); // Get current user from AuthContext

  useEffect(() => {
    if (!courseId) {
      setError('Course ID is missing.');
      setIsLoading(false);
      return;
    }

    const fetchCourseDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getCourseById(courseId);
        setCourse(data);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch course details.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId]);

  if (isLoading) {
    return <div style={styles.loading}>Loading course details...</div>;
  }

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  if (!course) {
    return <div style={styles.page}><p>Course not found.</p></div>;
  }

  return (
    <div style={styles.page}>
      <header style={styles.courseHeader}>
        <h1 style={styles.courseTitle}>{course.title}</h1>
        {course.description && <p style={styles.courseDescription}>{course.description}</p>}
        {course.teacher && (
          <p style={styles.teacherInfo}>
            Taught by: {course.teacher.firstName || ''} {course.teacher.lastName || ''} ({course.teacher.username})
          </p>
        )}
        <p style={styles.teacherInfo}>Last updated: {new Date(course.updatedAt).toLocaleDateString()}</p>
      </header>

      <section style={styles.chaptersSection}>
        <h2 style={styles.chaptersTitle}>Chapters</h2>
        {course.chapters && course.chapters.length > 0 ? (
          <ul style={styles.chapterList}>
            {course.chapters
              .sort((a, b) => a.order - b.order)
              .map((chapter: ChapterType, index) => ( // Use ChapterType for clarity
                <li key={chapter.id} style={styles.chapterManagementItem}>
                  <ChapterListItem chapter={chapter} index={index} />
                  {user && user.role === 'teacher' && course.teacherId === user.id && (
                    <Link
                      to={`/teacher/courses/${course.id}/chapters/${chapter.id}/manage-content`}
                      style={styles.manageButton}
                    >
                      Manage Content
                    </Link>
                  )}
                </li>
              ))}
          </ul>
        ) : (
          <p>No chapters available for this course yet.</p>
        )}
      </section>
    </div>
  );
};

export default CourseDetailPage;
