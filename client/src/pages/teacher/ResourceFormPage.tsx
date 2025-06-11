import React, { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getResourceById,
  createResource,
  updateResource,
  getAllTags,
} from '../../services/resourceService';
import { Resource, ResourceType, Tag, CreateResourcePayload, UpdateResourcePayload } from '../../types/resource';
import { useAuth } from '../../contexts/AuthContext'; // For teacher role verification if needed again

// Basic styling
const styles: { [key: string]: React.CSSProperties } = {
  page: { padding: '20px', maxWidth: '700px', margin: '0 auto', fontFamily: 'Arial, sans-serif' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  formGroup: { display: 'flex', flexDirection: 'column' },
  label: { marginBottom: '5px', fontWeight: 'bold' },
  input: { padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' },
  textarea: { padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem', minHeight: '100px' },
  select: { padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' },
  button: { padding: '10px 15px', fontSize: '1rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  error: { color: 'red', marginTop: '10px' },
  loading: { textAlign: 'center', fontSize: '1.2rem', marginTop: '50px' },
  tagSelectionContainer: { border: '1px solid #eee', padding: '10px', borderRadius: '4px' },
  tagCloud: { display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' },
  tagChip: { padding: '5px 10px', backgroundColor: '#e0e0e0', borderRadius: '15px', cursor: 'pointer', fontSize: '0.9rem' },
  tagChipSelected: { backgroundColor: '#007bff', color: 'white' },
  newTagInput: { marginTop: '5px' }
};

const ResourceFormPage: React.FC = () => {
  const { resourceId } = useParams<{ resourceId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth(); // Assuming user details are needed, or for role check

  const [title, setTitle] = useState('');
  const [type, setType] = useState<ResourceType>(ResourceType.TEXT); // Default type
  const [contentData, setContentData] = useState(''); // Store as string, parse based on type on submit

  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<number>>(new Set());
  const [newTagsString, setNewTagsString] = useState(''); // Comma-separated new tags

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = Boolean(resourceId);

  useEffect(() => {
    // Fetch all available tags for selection
    const fetchTags = async () => {
      try {
        const tags = await getAllTags();
        setAvailableTags(tags);
      } catch (err) {
        console.error("Failed to fetch tags:", err);
        // Optionally set an error state for tags loading
      }
    };
    fetchTags();

    if (isEditMode && resourceId) {
      setIsFetchingDetails(true);
      getResourceById(resourceId)
        .then(resource => {
          setTitle(resource.title);
          setType(resource.type);
          // Assuming content_data is an object, stringify for textarea, or handle based on type
          setContentData(typeof resource.content_data === 'object' ? JSON.stringify(resource.content_data, null, 2) : String(resource.content_data || ''));
          if (resource.tags) {
            setSelectedTagIds(new Set(resource.tags.map(tag => tag.id)));
          }
        })
        .catch(err => {
          console.error("Failed to fetch resource details:", err);
          setError("Failed to load resource data. Please try again.");
        })
        .finally(() => setIsFetchingDetails(false));
    }
  }, [resourceId, isEditMode]);

  const handleTagSelection = (tagId: number) => {
    setSelectedTagIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tagId)) {
        newSet.delete(tagId);
      } else {
        newSet.add(tagId);
      }
      return newSet;
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    let parsedContentData: any;
    try {
        // Attempt to parse content_data if it's likely JSON (e.g. for URL types or structured text)
        // For simple text or markdown, it might just be the string itself.
        // This logic might need refinement based on how `content_data` is used per `ResourceType`.
        if (type === ResourceType.VIDEO_URL || type === ResourceType.IMAGE_URL || type === ResourceType.MODEL_3D_URL) {
            parsedContentData = { url: contentData.trim() }; // Assuming URL is directly in textarea
        } else if (type === ResourceType.TEXT && contentData.startsWith('{') && contentData.endsWith('}')) {
             // A convention if TEXT type might store JSON
            parsedContentData = JSON.parse(contentData);
        }
        else {
            parsedContentData = contentData; // For MARKDOWN or simple TEXT
        }
    } catch (e) {
        setError("Content data is not valid JSON where expected, or has an issue.");
        setIsLoading(false);
        return;
    }

    const newTagsArray = newTagsString.split(',').map(t => t.trim()).filter(t => t.length > 0);

    const payload: CreateResourcePayload | UpdateResourcePayload = {
      title,
      type,
      content_data: parsedContentData,
      tagIds: Array.from(selectedTagIds),
      newTags: newTagsArray,
    };

    try {
      if (isEditMode && resourceId) {
        await updateResource(resourceId, payload as UpdateResourcePayload);
      } else {
        await createResource(payload as CreateResourcePayload);
      }
      navigate('/teacher/resources'); // Redirect after successful operation
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Operation failed. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingDetails) {
    return <div style={styles.loading}>Loading resource details...</div>;
  }

  // Optional: Add a check here for user role if TeacherProtectedRoute isn't fully relied upon
  if (user?.role !== 'teacher') {
    return <div style={styles.error}>You are not authorized to manage resources.</div>;
  }

  return (
    <div style={styles.page}>
      <h1>{isEditMode ? 'Edit Resource' : 'Create New Resource'}</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="title" style={styles.label}>Title:</label>
          <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required style={styles.input} />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="type" style={styles.label}>Type:</label>
          <select id="type" value={type} onChange={e => setType(e.target.value as ResourceType)} style={styles.select}>
            {Object.values(ResourceType).map(rt => (
              <option key={rt} value={rt}>{rt.replace('_', ' ').toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="contentData" style={styles.label}>Content Data:</label>
          <textarea id="contentData" value={contentData} onChange={e => setContentData(e.target.value)} style={styles.textarea}
            placeholder={
                type === ResourceType.IMAGE_URL || type === ResourceType.VIDEO_URL || type === ResourceType.MODEL_3D_URL ? "Enter URL here" :
                type === ResourceType.MARKDOWN ? "Enter Markdown text" :
                type === ResourceType.TEXT ? "Enter simple text or JSON for structured content" : "Enter content"
            }
          />
           { (type === ResourceType.IMAGE_URL || type === ResourceType.VIDEO_URL || type === ResourceType.MODEL_3D_URL) &&
             <small>Please enter a direct URL.</small> }
           { type === ResourceType.TEXT &&
             <small>For structured content, you can use JSON format. E.g., {"{\"key\":\"value\"}"}</small> }

        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Tags:</label>
          <div style={styles.tagSelectionContainer}>
            <p>Select existing tags:</p>
            <div style={styles.tagCloud}>
              {availableTags.map(tag => (
                <span
                  key={tag.id}
                  style={{...styles.tagChip, ...(selectedTagIds.has(tag.id) ? styles.tagChipSelected : {})}}
                  onClick={() => handleTagSelection(tag.id)}
                >
                  {tag.name}
                </span>
              ))}
              {availableTags.length === 0 && <small>No existing tags found.</small>}
            </div>
            <p>Add new tags (comma-separated):</p>
            <input
              type="text"
              value={newTagsString}
              onChange={e => setNewTagsString(e.target.value)}
              placeholder="e.g., newTag1, anotherTag"
              style={{...styles.input, ...styles.newTagInput}}
            />
          </div>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" disabled={isLoading} style={styles.button}>
          {isLoading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Resource' : 'Create Resource')}
        </button>
      </form>
    </div>
  );
};

export default ResourceFormPage;
