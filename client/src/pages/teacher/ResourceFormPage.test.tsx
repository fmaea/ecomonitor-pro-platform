import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext, AuthContextType } from '../../contexts/AuthContext';
import ResourceFormPage from './ResourceFormPage';
import * as resourceService from '../../services/resourceService';
import { ResourceType, Resource, Tag } from '../../types/resource';

jest.mock('../../services/resourceService');
const mockedResourceService = resourceService as jest.Mocked<typeof resourceService>;

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: jest.fn(), // Will be mocked per test case
}));

const mockTeacherUser = {
  id: 1, username: 'teacher1', email: 'teacher@example.com', role: 'teacher',
  firstName: 'Test', lastName: 'Teacher',
};

const mockAvailableTags: Tag[] = [
  { id: 1, name: 'TagA' },
  { id: 2, name: 'TagB' },
];

const mockResource: Resource = {
  id: 'res1', title: 'Existing Resource', type: ResourceType.MARKDOWN,
  content_data: 'Some markdown content', teacherId: 1,
  tags: [mockAvailableTags[0]], // TagA
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};

const renderFormPage = (authContextValue: Partial<AuthContextType>, resourceId?: string) => {
  // Mock useParams for this render
  jest.spyOn(require('react-router-dom'), 'useParams').mockReturnValue({ resourceId });

  return render(
    <AuthContext.Provider value={authContextValue as AuthContextType}>
        <MemoryRouter initialEntries={resourceId ? [`/teacher/resources/edit/${resourceId}`] : ['/teacher/resources/new']}>
            <Routes>
                <Route path={resourceId ? "/teacher/resources/edit/:resourceId" : "/teacher/resources/new"} element={<ResourceFormPage />} />
            </Routes>
        </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('ResourceFormPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedResourceService.getAllTags.mockResolvedValue(mockAvailableTags);
    mockedResourceService.getResourceById.mockResolvedValue(mockResource);
    mockedResourceService.createResource.mockResolvedValue(mockResource); // Mock create
    mockedResourceService.updateResource.mockResolvedValue(mockResource); // Mock update
  });

  it('renders in create mode with empty fields', async () => {
    renderFormPage({ user: mockTeacherUser, isLoading: false });
    await waitFor(() => expect(mockedResourceService.getAllTags).toHaveBeenCalled());

    expect(screen.getByRole('heading', { name: /create new resource/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveValue('');
    expect(screen.getByLabelText(/type/i)).toHaveValue(ResourceType.TEXT); // Default
    expect(screen.getByLabelText(/content data/i)).toHaveValue('');
    expect(screen.getByText('TagA')).toBeInTheDocument(); // Check if tags are rendered
  });

  it('renders in edit mode and populates form with resource data', async () => {
    renderFormPage({ user: mockTeacherUser, isLoading: false }, 'res1');

    await waitFor(() => expect(mockedResourceService.getResourceById).toHaveBeenCalledWith('res1'));
    await waitFor(() => expect(mockedResourceService.getAllTags).toHaveBeenCalled());

    expect(screen.getByRole('heading', { name: /edit resource/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveValue(mockResource.title);
    expect(screen.getByLabelText(/type/i)).toHaveValue(mockResource.type);
    expect(screen.getByLabelText(/content data/i)).toHaveValue(mockResource.content_data);

    // Check if TagA is selected (has selected style)
    const tagAChip = screen.getByText(mockAvailableTags[0].name);
    expect(tagAChip).toHaveStyle('background-color: #007bff'); // Assuming this is selected style
  });

  it('updates input fields on change', async () => {
    renderFormPage({ user: mockTeacherUser, isLoading: false });
    await waitFor(() => expect(mockedResourceService.getAllTags).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'New Title' } });
    expect(screen.getByLabelText(/title/i)).toHaveValue('New Title');

    fireEvent.change(screen.getByLabelText(/type/i), { target: { value: ResourceType.VIDEO_URL } });
    expect(screen.getByLabelText(/type/i)).toHaveValue(ResourceType.VIDEO_URL);
  });

  it('handles tag selection and new tag input', async () => {
    renderFormPage({ user: mockTeacherUser, isLoading: false });
    await waitFor(() => expect(mockedResourceService.getAllTags).toHaveBeenCalled());

    // Select TagB
    fireEvent.click(screen.getByText(mockAvailableTags[1].name));
    expect(screen.getByText(mockAvailableTags[1].name)).toHaveStyle('background-color: #007bff');

    // Add new tags
    fireEvent.change(screen.getByPlaceholderText(/e.g., newTag1, anotherTag/i), { target: { value: 'customTag1, customTag2' } });
    expect(screen.getByPlaceholderText(/e.g., newTag1, anotherTag/i)).toHaveValue('customTag1, customTag2');
  });

  it('submits form for creating a new resource', async () => {
    renderFormPage({ user: mockTeacherUser, isLoading: false });
    await waitFor(() => expect(mockedResourceService.getAllTags).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Final Title' } });
    fireEvent.change(screen.getByLabelText(/type/i), { target: { value: ResourceType.MARKDOWN } });
    fireEvent.change(screen.getByLabelText(/content data/i), { target: { value: '# Markdown Content' } });
    fireEvent.click(screen.getByText(mockAvailableTags[0].name)); // Select TagA
    fireEvent.change(screen.getByPlaceholderText(/e.g., newTag1, anotherTag/i), { target: { value: 'newCustom' } });

    fireEvent.click(screen.getByRole('button', { name: /create resource/i }));

    await waitFor(() =>
      expect(mockedResourceService.createResource).toHaveBeenCalledWith({
        title: 'Final Title',
        type: ResourceType.MARKDOWN,
        content_data: '# Markdown Content',
        tagIds: [mockAvailableTags[0].id],
        newTags: ['newCustom'],
      })
    );
    expect(mockNavigate).toHaveBeenCalledWith('/teacher/resources');
  });

  it('submits form for updating an existing resource', async () => {
    renderFormPage({ user: mockTeacherUser, isLoading: false }, 'res1');
    await waitFor(() => expect(mockedResourceService.getResourceById).toHaveBeenCalledWith('res1'));

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Updated Resource Title' } });
    // Unselect TagA (was initially selected for mockResource) then select TagB
    fireEvent.click(screen.getByText(mockAvailableTags[0].name));
    fireEvent.click(screen.getByText(mockAvailableTags[1].name));
    fireEvent.change(screen.getByPlaceholderText(/e.g., newTag1, anotherTag/i), { target: { value: 'anotherNew' } });


    fireEvent.click(screen.getByRole('button', { name: /update resource/i }));

    await waitFor(() =>
      expect(mockedResourceService.updateResource).toHaveBeenCalledWith('res1', {
        title: 'Updated Resource Title',
        type: mockResource.type, // Type wasn't changed in this test
        content_data: mockResource.content_data, // Content data wasn't changed
        tagIds: [mockAvailableTags[1].id], // TagA unselected, TagB selected
        newTags: ['anotherNew'],
      })
    );
    expect(mockNavigate).toHaveBeenCalledWith('/teacher/resources');
  });

  it('displays error message on submission failure', async () => {
    mockedResourceService.createResource.mockRejectedValueOnce(new Error('Create failed miserably'));
    renderFormPage({ user: mockTeacherUser, isLoading: false });
    await waitFor(() => expect(mockedResourceService.getAllTags).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Test' } });
    fireEvent.click(screen.getByRole('button', { name: /create resource/i }));

    await waitFor(() => expect(screen.getByText(/Create failed miserably/i)).toBeInTheDocument());
  });
});
