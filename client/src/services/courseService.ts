import api from './api'; // Import the configured Axios instance
import { Course, Chapter } from '../types/course'; // Assuming types will be in this path

// Fetch all courses
export const getAllCourses = async (): Promise<Course[]> => {
  try {
    const response = await api.get<Course[]>('/courses');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch all courses:', error);
    // Depending on error handling strategy, you might throw the error,
    // return a default value, or an object with an error message.
    throw error;
  }
};

// Fetch a single course by its ID (should include chapters as per backend)
export const getCourseById = async (courseId: string | number): Promise<Course> => {
  try {
    const response = await api.get<Course>(`/courses/${courseId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch course with ID ${courseId}:`, error);
    throw error;
  }
};

// Fetch chapters for a specific course ID
// This might be redundant if getCourseById already returns chapters.
// However, it's good to have if there's a separate endpoint or for specific use cases.
export const getChaptersByCourseId = async (courseId: string | number): Promise<Chapter[]> => {
  try {
    const response = await api.get<Chapter[]>(`/courses/${courseId}/chapters`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch chapters for course ID ${courseId}:`, error);
    throw error;
  }
};

// Example of how you might use these functions:
/*
async function exampleUsage() {
  try {
    const courses = await getAllCourses();
    console.log('All Courses:', courses);

    if (courses.length > 0) {
      const firstCourseId = courses[0].id;
      const courseDetail = await getCourseById(firstCourseId);
      console.log('Course Detail:', courseDetail);

      // If chapters are not included in courseDetail or you need to refresh them:
      // const chapters = await getChaptersByCourseId(firstCourseId);
      // console.log('Chapters for course:', chapters);
    }
  } catch (error) {
    // Handle errors, perhaps update UI state to show an error message
    console.error('An error occurred in exampleUsage:', error);
  }
}
*/
