import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Layout/Sidebar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DecksPage from './pages/DecksPage';
import FlashcardPage from './pages/FlashcardPage';
import ExtractPage from './pages/ExtractPage';
import MiniTestPage from './pages/MiniTestPage';
import StreakPage from './pages/StreakPage';
import PetPage from './pages/PetPage';
import StudyBuddyPage from './pages/StudyBuddyPage';
import ProfilePage from './pages/ProfilePage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-spinner" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/login" element={<Navigate to="/dashboard" />} />
          <Route path="/register" element={<Navigate to="/dashboard" />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppLayout><Dashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/decks" element={
            <ProtectedRoute>
              <AppLayout><DecksPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/decks/:deckId" element={
            <ProtectedRoute>
              <AppLayout><FlashcardPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/extract" element={
            <ProtectedRoute>
              <AppLayout><ExtractPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/test" element={
            <ProtectedRoute>
              <AppLayout><MiniTestPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/test/:deckId" element={
            <ProtectedRoute>
              <AppLayout><MiniTestPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/streak" element={
            <ProtectedRoute>
              <AppLayout><StreakPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/pet" element={
            <ProtectedRoute>
              <AppLayout><PetPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/buddy" element={
            <ProtectedRoute>
              <AppLayout><StudyBuddyPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <AppLayout><ProfilePage /></AppLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
