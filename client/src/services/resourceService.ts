import api from './api'; // Import the configured Axios instance
import { Resource, CreateResourcePayload, UpdateResourcePayload } from '../types/resource';

// Fetch resources authored by the currently logged-in teacher
export const getMyResources = async (): Promise<Resource[]> => {
  try {
    const response = await api.get<Resource[]>('/resources/teacher/my-resources');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch my resources:', error);
    // Consider throwing a custom error or returning a structure that indicates error
    throw error;
  }
};

// Fetch all resources (publicly, or based on user role if backend filters)
// This is similar to courseService.getAllCourses
export const getAllResources = async (queryParams?: { tag?: string; type?: string; teacherId?: number }): Promise<Resource[]> => {
  try {
    const response = await api.get<Resource[]>('/resources', { params: queryParams });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch all resources:', error);
    throw error;
  }
};

// Fetch a single resource by its ID
export const getResourceById = async (resourceId: string): Promise<Resource> => {
  try {
    const response = await api.get<Resource>(`/resources/${resourceId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch resource with ID ${resourceId}:`, error);
    throw error;
  }
};

// Create a new resource
export const createResource = async (payload: CreateResourcePayload): Promise<Resource> => {
  try {
    const response = await api.post<Resource>('/resources', payload);
    return response.data;
  } catch (error) {
    console.error('Failed to create resource:', error);
    throw error;
  }
};

// Update an existing resource
export const updateResource = async (resourceId: string, payload: UpdateResourcePayload): Promise<Resource> => {
  try {
    const response = await api.patch<Resource>(`/resources/${resourceId}`, payload);
    return response.data;
  } catch (error) {
    console.error(`Failed to update resource with ID ${resourceId}:`, error);
    throw error;
  }
};

// Delete a resource
export const deleteResource = async (resourceId: string): Promise<void> => {
  try {
    await api.delete(`/resources/${resourceId}`);
  } catch (error) {
    console.error(`Failed to delete resource with ID ${resourceId}:`, error);
    throw error;
  }
};

// --- Tag related services (can be in a separate tagService.ts if grows complex) ---
import { Tag } from '../types/resource'; // Re-import if moved to separate file

export const getAllTags = async (): Promise<Tag[]> => {
    try {
        const response = await api.get<Tag[]>('/tags');
        return response.data;
    } catch (error) {
        console.error('Failed to fetch tags:', error);
        throw error;
    }
};

// Fetch resources linked to a specific chapter
export const getResourcesForChapter = async (courseId: string | number, chapterId: string | number): Promise<Resource[]> => {
  try {
    // Note: The backend API is GET /courses/:courseId/chapters/:chapterId/resources
    // This service function is placed in resourceService.ts for convenience as it returns Resource[]
    // It could also logically fit in a courseService.ts or chapterService.ts
    const response = await api.get<Resource[]>(`/courses/${courseId}/chapters/${chapterId}/resources`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch resources for chapter ID ${chapterId} of course ID ${courseId}:`, error);
    throw error;
  }
};
