import React from 'react';
import { Link } from 'react-router-dom';
import { Course } from '../../types/course'; // Adjust path as needed

interface CourseCardProps {
  course: Course;
}

// Basic styling (can be moved to a CSS file or use a styling library)
const styles: { [key: string]: React.CSSProperties } = {
  card: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '15px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textDecoration: 'none',
    color: 'inherit',
    display: 'block', // To make the whole card clickable
    height: '100%', // Ensure cards in a grid take full height if needed
  },
  title: {
    margin: '0 0 10px 0',
    fontSize: '1.2rem',
  },
  description: {
    fontSize: '0.9rem',
    color: '#555',
    marginBottom: '10px',
  },
  teacherInfo: {
    fontSize: '0.8rem',
    color: '#777',
  }
};

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const descriptionPreview = course.description
    ? (course.description.length > 100 ? `${course.description.substring(0, 100)}...` : course.description)
    : 'No description available.';

  return (
    <Link to={`/courses/${course.id}`} style={styles.card}>
      <h2 style={styles.title}>{course.title}</h2>
      <p style={styles.description}>{descriptionPreview}</p>
      {course.teacher && (
        <small style={styles.teacherInfo}>
          Taught by: {course.teacher.firstName || ''} {course.teacher.lastName || ''} ({course.teacher.username})
        </small>
      )}
      {/* You can add more details like number of chapters, etc. */}
    </Link>
  );
};

export default CourseCard;
