import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext, AuthContextType } from '../../contexts/AuthContext';
import MyResourcesPage from './MyResourcesPage';
import * as resourceService from '../../services/resourceService'; // To mock getMyResources & deleteResource

// Mock resourceService
jest.mock('../../services/resourceService');
const mockedResourceService = resourceService as jest.Mocked<typeof resourceService>;

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockTeacherUser = {
  id: 1,
  username: 'teacher1',
  email: 'teacher@example.com',
  role: 'teacher',
  firstName: 'Test',
  lastName: 'Teacher',
};

const mockStudentUser = {
  id: 2,
  username: 'student1',
  email: 'student@example.com',
  role: 'student',
};

const mockResources = [
  { id: 'res1', title: 'Resource Alpha', type: 'markdown', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), teacherId: 1 },
  { id: 'res2', title: 'Resource Beta', type: 'video_url', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), teacherId: 1 },
];

const renderPage = (authContextValue: Partial<AuthContextType>) => {
  return render(
    <AuthContext.Provider value={authContextValue as AuthContextType}>
      <BrowserRouter>
        <MyResourcesPage />
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

describe('MyResourcesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.confirm
    window.confirm = jest.fn(() => true); // Default to user confirming delete
  });

  it('redirects if user is not a teacher', () => {
    renderPage({ user: mockStudentUser, isLoading: false });
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('fetches and displays resources for a teacher', async () => {
    mockedResourceService.getMyResources.mockResolvedValue(mockResources);
    renderPage({ user: mockTeacherUser, isLoading: false });

    expect(screen.getByText('Loading your resources...')).toBeInTheDocument();
    await waitFor(() => expect(mockedResourceService.getMyResources).toHaveBeenCalledTimes(1));

    expect(screen.getByText('Resource Alpha')).toBeInTheDocument();
    expect(screen.getByText('Resource Beta')).toBeInTheDocument();
    expect(screen.getByText('Create New Resource')).toBeInTheDocument(); // Button
  });

  it('shows "no resources" message if none are found', async () => {
    mockedResourceService.getMyResources.mockResolvedValue([]);
    renderPage({ user: mockTeacherUser, isLoading: false });

    await waitFor(() => expect(mockedResourceService.getMyResources).toHaveBeenCalledTimes(1));
    expect(screen.getByText("You haven't created any resources yet.")).toBeInTheDocument();
  });

  it('handles error when fetching resources', async () => {
    mockedResourceService.getMyResources.mockRejectedValue(new Error('Failed to fetch'));
    renderPage({ user: mockTeacherUser, isLoading: false });

    await waitFor(() => expect(mockedResourceService.getMyResources).toHaveBeenCalledTimes(1));
    expect(screen.getByText('Failed to fetch resources.')).toBeInTheDocument();
  });

  it('navigates to create new resource page on button click', async () => {
    mockedResourceService.getMyResources.mockResolvedValue([]);
    renderPage({ user: mockTeacherUser, isLoading: false });
    await waitFor(() => {}); // Ensure page is loaded

    fireEvent.click(screen.getByText('Create New Resource'));
    expect(mockNavigate).toHaveBeenCalledWith('/teacher/resources/new'); // Assuming Link uses navigate internally or test Link component
  });

  it('navigates to edit page on "Edit" button click', async () => {
    mockedResourceService.getMyResources.mockResolvedValue([mockResources[0]]);
    renderPage({ user: mockTeacherUser, isLoading: false });
    await waitFor(() => screen.getByText('Resource Alpha'));

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);
    expect(mockNavigate).toHaveBeenCalledWith(`/teacher/resources/edit/${mockResources[0].id}`);
  });


  it('calls deleteResource and updates UI on confirmed delete', async () => {
    mockedResourceService.getMyResources.mockResolvedValue([...mockResources]);
    mockedResourceService.deleteResource.mockResolvedValue(undefined); // Successful delete

    renderPage({ user: mockTeacherUser, isLoading: false });
    await waitFor(() => expect(screen.getByText('Resource Alpha')).toBeInTheDocument());

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]); // Click delete for "Resource Alpha"

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete the resource "Resource Alpha"?');
    expect(mockedResourceService.deleteResource).toHaveBeenCalledWith('res1');

    await waitFor(() => expect(screen.queryByText('Resource Alpha')).not.toBeInTheDocument());
    expect(screen.getByText('Resource "Resource Alpha" deleted successfully.')).toBeInTheDocument();
    expect(screen.getByText('Resource Beta')).toBeInTheDocument(); // Ensure other resource is still there
  });

  it('does not call deleteResource if confirmation is cancelled', async () => {
    (window.confirm as jest.Mock).mockReturnValueOnce(false); // User cancels delete
    mockedResourceService.getMyResources.mockResolvedValue([mockResources[0]]);
    renderPage({ user: mockTeacherUser, isLoading: false });
    await waitFor(() => screen.getByText('Resource Alpha'));

    const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockedResourceService.deleteResource).not.toHaveBeenCalled();
    expect(screen.getByText('Resource Alpha')).toBeInTheDocument(); // Resource still present
  });

  it('shows error message on delete failure', async () => {
    mockedResourceService.getMyResources.mockResolvedValue([mockResources[0]]);
    mockedResourceService.deleteResource.mockRejectedValue(new Error('Deletion failed'));
    renderPage({ user: mockTeacherUser, isLoading: false });
    await waitFor(() => screen.getByText('Resource Alpha'));

    const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockedResourceService.deleteResource).toHaveBeenCalledWith('res1');
    await waitFor(() => expect(screen.getByText('Error: Failed to delete resource.')).toBeInTheDocument());
  });
});
