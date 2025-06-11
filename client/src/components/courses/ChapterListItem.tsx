import React from 'react';
import { Chapter } from '../../types/course'; // Adjust path as needed

interface ChapterListItemProps {
  chapter: Chapter;
  index: number; // To display chapter number like 1, 2, 3...
}

// Basic styling (can be moved to a CSS file or use a styling library)
const styles: { [key: string]: React.CSSProperties } = {
  listItem: {
    border: '1px solid #eee',
    borderRadius: '4px',
    padding: '10px 15px',
    marginBottom: '10px',
    backgroundColor: '#f9f9f9',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  title: {
    margin: '0 0 5px 0',
    fontSize: '1.1rem',
    color: '#333',
  },
  contentPreview: {
    fontSize: '0.9rem',
    color: '#666',
    whiteSpace: 'pre-wrap', // Preserve whitespace for basic formatting
  }
};

const ChapterListItem: React.FC<ChapterListItemProps> = ({ chapter, index }) => {
  const contentPreview = chapter.content
    ? (chapter.content.length > 150 ? `${chapter.content.substring(0, 150)}...` : chapter.content)
    : 'No content preview available.';

  return (
    <li style={styles.listItem}>
      <h3 style={styles.title}>{chapter.order}. {chapter.title}</h3> {/* Use chapter.order directly */}
      {/*
        If you want to display index (1, 2, 3...) based on array order instead of chapter.order:
        <h3 style={styles.title}>{index + 1}. {chapter.title}</h3>
      */}
      <p style={styles.contentPreview}>{contentPreview}</p>
      {/* Add link to full chapter page or expand functionality here later */}
    </li>
  );
};

export default ChapterListItem;
