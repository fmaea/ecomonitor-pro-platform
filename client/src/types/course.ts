// Basic User interface, expand as needed
export interface User {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  // email?: string; // Add if needed for display
  // role?: string; // Add if needed
}

export interface Chapter {
  id: number;
  title: string;
  content?: string; // Content might be optional for list views
  order: number;
  createdAt?: string; // Or Date, depending on transformation
  updatedAt?: string; // Or Date
  // courseId?: number; // If needed directly on chapter object
}

export interface Course {
  id: number;
  title: string;
  description?: string;
  teacherId: number; // Or directly embed teacher object
  teacher?: User; // Assuming backend populates this with user details
  chapters: Chapter[]; // Assuming chapters are included in course details
  createdAt: string; // Or Date, depending on transformation
  updatedAt: string; // Or Date
}

// For paged results or additional metadata if API provides it
export interface PaginatedCourses {
  items: Course[];
  total: number;
  page: number;
  limit: number;
}
