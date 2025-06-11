// Matches ResourceType enum in backend (resource.entity.ts)
export enum ResourceType {
  TEXT = 'text',
  IMAGE_URL = 'image_url',
  VIDEO_URL = 'video_url',
  MARKDOWN = 'markdown',
  QUIZ_REF = 'quiz_ref',
  MODEL_3D_URL = '3d_model_url',
}

// Basic Tag interface, expand if needed
export interface Tag {
  id: number;
  name: string;
}

// Basic User interface for teacher details, expand if needed
export interface BasicUser {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
}

export interface Resource {
  id: string; // Assuming UUID from backend
  title: string;
  type: ResourceType;
  content_data?: any; // Flexible based on type, e.g., { text: "..." }, { url: "..." }
  teacherId: number;
  teacher?: BasicUser; // Optional: if backend populates teacher details
  tags?: Tag[]; // Optional: if backend populates tags
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// For DTOs if needed on frontend, e.g., CreateResourcePayload
export interface CreateResourcePayload {
  title: string;
  type: ResourceType;
  content_data?: any;
  tagIds?: number[];
  newTags?: string[];
}

export interface UpdateResourcePayload extends Partial<CreateResourcePayload> {}
