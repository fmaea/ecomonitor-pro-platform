import React, { useEffect, useState } from 'react';
// Link is removed as CourseCard handles navigation
import { getAllCourses } from '../../services/courseService';
import { Course } from '../../types/course';
import CourseCard from '../../components/courses/CourseCard'; // Import CourseCard

// Basic styling (can be moved to a CSS file)
const styles: { [key: string]: React.CSSProperties } = {
  page: {
    padding: '20px',
  },
  title: {
    marginBottom: '20px',
  },
  courseList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
    listStyle: 'none',
    padding: 0,
  },
  // courseCard, courseTitle, courseDescription styles can be removed if fully handled by CourseCard
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

const CourseListPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getAllCourses();
        setCourses(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch courses. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (isLoading) {
    return <div style={styles.loading}>Loading courses...</div>;
  }

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  if (courses.length === 0) {
    return <div style={styles.page}><p>No courses available at the moment.</p></div>;
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Available Courses</h1>
      <div style={styles.courseList}> {/* Changed ul to div for better grid compatibility if CourseCard is a block */}
        {courses.map((course) => (
          // The li wrapper might still be useful for grid item control or can be removed if CourseCard handles its own sizing well in a grid
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
};

export default CourseListPage;
