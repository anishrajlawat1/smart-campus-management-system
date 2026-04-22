import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';

import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import StudentAttendanceManagement from './pages/admin/StudentAttendanceManagement';
import NoticeManagement from './pages/admin/NoticeManagement';
import EventManagement from './pages/admin/EventManagement';
import LostFoundManagement from './pages/admin/LostFoundManagement';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import FacultyAttendanceManagement from './pages/admin/FacultyAttendanceManagement';

import FacultyDashboard from './pages/faculty/FacultyDashboard';
import StudentDashboard from './pages/StudentDashboard';

import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRole="admin">
              <UserManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/attendance"
          element={
            <ProtectedRoute allowedRole="admin">
              <StudentAttendanceManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/notices"
          element={
            <ProtectedRoute allowedRole="admin">
              <NoticeManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/events"
          element={
            <ProtectedRoute allowedRole="admin">
              <EventManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/lost-found"
          element={
            <ProtectedRoute allowedRole="admin">
              <LostFoundManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRole="admin">
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/faculty-attendance"
          element={
            <ProtectedRoute allowedRole="admin">
              <FacultyAttendanceManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty-dashboard"
          element={
            <ProtectedRoute allowedRole="faculty">
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;