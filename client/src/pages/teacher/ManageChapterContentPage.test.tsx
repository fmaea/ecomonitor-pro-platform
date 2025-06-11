import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext, AuthContextType } from '../../contexts/AuthContext';
import ManageChapterContentPage from './ManageChapterContentPage';
import * as resourceService from '../../services/resourceService';
import * as courseService from '../../services/courseService'; // For getCourseById
import { Resource, ResourceType } from '../../types/resource';
import { Course, Chapter } from '../../types/course';

jest.mock('../../services/resourceService');
const mockedResourceService = resourceService as jest.Mocked<typeof resourceService>;

jest.mock('../../services/courseService');
const mockedCourseService = courseService as jest.Mocked<typeof courseService>;

const mockTeacherUser = {
  id: 1, username: 'teacher1', email: 'teacher@example.com', role: 'teacher',
};

const mockCourse: Course = {
  id: 1, title: 'Test Course', teacherId: 1, chapters: [
    { id: 1, title: 'Chapter 1: Intro', order: 1, content: '', courseId: 1, createdAt: '', updatedAt: '' },
    { id: 2, title: 'Chapter 2: Deep Dive', order: 2, content: '', courseId: 1, createdAt: '', updatedAt: '' },
  ], createdAt: '', updatedAt: '',
};

const mockLinkedResources: Resource[] = [
  { id: 'res1', title: 'Linked Resource A', type: ResourceType.MARKDOWN, teacherId:1, createdAt: '', updatedAt: '' },
  { id: 'res2', title: 'Linked Resource B', type: ResourceType.VIDEO_URL, teacherId:1, createdAt: '', updatedAt: '' },
];

const renderPage = (authContextValue: Partial<AuthContextType>, courseId: string, chapterId: string) => {
  return render(
    <AuthContext.Provider value={authContextValue as AuthContextType}>
      <MemoryRouter initialEntries={[`/teacher/courses/${courseId}/chapters/${chapterId}/manage-content`]}>
        <Routes>
          <Route path="/teacher/courses/:courseId/chapters/:chapterId/manage-content" element={<ManageChapterContentPage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('ManageChapterContentPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCourseService.getCourseById.mockResolvedValue(mockCourse);
    mockedResourceService.getResourcesForChapter.mockResolvedValue(mockLinkedResources);
  });

  it('fetches and displays course, chapter, and linked resource information', async () => {
    renderPage({ user: mockTeacherUser, isLoading: false }, '1', '1');

    await waitFor(() => {
      expect(mockedCourseService.getCourseById).toHaveBeenCalledWith('1');
      expect(mockedResourceService.getResourcesForChapter).toHaveBeenCalledWith('1', '1');
    });

    expect(screen.getByText(`Back to Course: ${mockCourse.title}`)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: `Manage Content for Chapter: ${mockCourse.chapters[0].title}`})).toBeInTheDocument();

    expect(screen.getByText('Linked Resource A')).toBeInTheDocument();
    expect(screen.getByText('Type: markdown')).toBeInTheDocument();
    expect(screen.getByText('Linked Resource B')).toBeInTheDocument();
    expect(screen.getByText('Type: video_url')).toBeInTheDocument();
  });

  it('displays "no resources" message if chapter has no linked resources', async () => {
    mockedResourceService.getResourcesForChapter.mockResolvedValue([]);
    renderPage({ user: mockTeacherUser, isLoading: false }, '1', '1');

    await waitFor(() => expect(mockedResourceService.getResourcesForChapter).toHaveBeenCalled());
    expect(screen.getByText('No resources added to this chapter yet.')).toBeInTheDocument();
  });

  it('handles error when fetching course details', async () => {
    mockedCourseService.getCourseById.mockRejectedValue(new Error('Failed to fetch course'));
    renderPage({ user: mockTeacherUser, isLoading: false }, '1', '1');

    await waitFor(() => expect(screen.getByText(/Failed to load data for managing chapter content./i)).toBeInTheDocument());
  });

  it('handles error when fetching linked resources', async () => {
    mockedResourceService.getResourcesForChapter.mockRejectedValue(new Error('Failed to fetch resources'));
    renderPage({ user: mockTeacherUser, isLoading: false }, '1', '1');

    await waitFor(() => expect(screen.getByText(/Failed to load data for managing chapter content./i)).toBeInTheDocument());
  });

  it('shows unauthorized message if user is not a teacher', async () => {
    renderPage({ user: { ...mockTeacherUser, role: 'student'}, isLoading: false }, '1', '1');
    // The fetchData useEffect might not run if role check happens first,
    // but the component itself has a role check.
    await waitFor(() => expect(screen.getByText('You are not authorized to manage this content.')).toBeInTheDocument());
  });

  it('displays placeholder buttons for actions', async () => {
    renderPage({ user: mockTeacherUser, isLoading: false }, '1', '1');
    await waitFor(() => expect(mockedResourceService.getResourcesForChapter).toHaveBeenCalled());

    expect(screen.getByRole('button', { name: /add existing resource/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create new resource for this chapter/i })).toBeInTheDocument();
    expect(screen.getByText(/reordering and removal functionality will be implemented here./i)).toBeInTheDocument();
  });
});
