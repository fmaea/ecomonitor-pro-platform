import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import TeacherProtectedRoute from './components/auth/TeacherProtectedRoute'; // Import TeacherProtectedRoute

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import CourseListPage from './pages/CourseListPage';
import CourseDetailPage from './pages/CourseDetailPage';
import MyResourcesPage from './pages/teacher/MyResourcesPage';
import ResourceFormPage from './pages/teacher/ResourceFormPage';
import ManageChapterContentPage from './pages/teacher/ManageChapterContentPage'; // Import ManageChapterContentPage

// Layout component to include Navbar and Footer
const AppLayout: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: '1', padding: '1rem' }}>
        <Outlet /> {/* Nested routes will render here */}
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<AppLayout />}> {/* Apply layout to all these routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/courses" element={<CourseListPage />} />
            <Route path="/courses/:courseId" element={<CourseDetailPage />} /> {/* Add CourseDetailPage route */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            {/* Teacher specific routes */}
            <Route path="/teacher/resources" element={
              <TeacherProtectedRoute>
                <MyResourcesPage />
              </TeacherProtectedRoute>
            } />
            {/* Add other routes here, e.g., /teacher/resources/new, /teacher/resources/edit/:id */}
            {/* For now, /teacher/resources/new will be a placeholder until its page is created */}
             <Route path="/teacher/resources/new" element={
              <TeacherProtectedRoute>
                <ResourceFormPage />
              </TeacherProtectedRoute>
            } />
             <Route path="/teacher/resources/edit/:resourceId" element={
              <TeacherProtectedRoute>
                <ResourceFormPage />
              </TeacherProtectedRoute>
            } />
            <Route path="/teacher/courses/:courseId/chapters/:chapterId/manage-content" element={
              <TeacherProtectedRoute>
                <ManageChapterContentPage />
              </TeacherProtectedRoute>
            } />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;