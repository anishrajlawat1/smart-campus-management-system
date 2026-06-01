import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import StudentAttendanceManagement from './pages/admin/StudentAttendanceManagement';
import StudentAssignmentPage from './pages/admin/StudentAssignmentPage';
import NoticeManagement from './pages/admin/NoticeManagement';
import EventManagement from './pages/admin/EventManagement';
import LostFoundManagement from './pages/admin/LostFoundManagement';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import FacultyAttendanceManagement from './pages/admin/FacultyAttendanceManagement';
import FacultySubjectAssignment from './pages/admin/FacultySubjectAssignment';
import RoutineManagement from './pages/admin/RoutineManagement';
import ExamManagement from './pages/admin/ExamManagement';
import AdminAttendanceReportPage from './pages/admin/AdminAttendanceReportPage';

// Faculty
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import FacultyAttendancePage from './pages/faculty/FacultyAttendancePage';
import FacultyLostFoundPage from './pages/faculty/FacultyLostFoundPage';
import FacultyClasses from './pages/faculty/FacultyClasses';
import FacultyReports from './pages/faculty/FacultyReports';
import FacultyNoticePage from './pages/faculty/FacultyNoticePage';
import FacultyExamInvigilationPage from './pages/faculty/FacultyExamInvigilationPage';
import FacultyProfilePage from './pages/faculty/FacultyProfilePage';

// Student
import StudentDashboard from './pages/student/StudentDashboard';
import StudentLostFoundPage from './pages/student/StudentLostFoundPage';
import StudentRoutinePage from './pages/student/StudentRoutinePage';
import StudentNoticePage from './pages/student/StudentNoticePage';
import StudentAttendancePage from './pages/student/StudentAttendancePage';
import StudentEventsPage from './pages/student/StudentEventsPage';
import StudentProfilePage from './pages/student/StudentProfilePage';
import StudentExamPage from './pages/student/StudentExamPage';

import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin */}
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
          path="/admin/attendance-reports"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminAttendanceReportPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/student-assignment"
          element={
            <ProtectedRoute allowedRole="admin">
              <StudentAssignmentPage />
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
          path="/admin/faculty-subjects"
          element={
            <ProtectedRoute allowedRole="admin">
              <FacultySubjectAssignment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/routines"
          element={
            <ProtectedRoute allowedRole="admin">
              <RoutineManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/exams"
          element={
            <ProtectedRoute allowedRole="admin">
              <ExamManagement />
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

        {/* Faculty */}
        <Route
          path="/faculty-dashboard"
          element={
            <ProtectedRoute allowedRole="faculty">
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/profile"
          element={
            <ProtectedRoute allowedRole="faculty">
              <FacultyProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/attendance"
          element={
            <ProtectedRoute allowedRole="faculty">
              <FacultyAttendancePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/classes"
          element={
            <ProtectedRoute allowedRole="faculty">
              <FacultyClasses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/routines"
          element={
            <ProtectedRoute allowedRole="faculty">
              <FacultyClasses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/reports"
          element={
            <ProtectedRoute allowedRole="faculty">
              <FacultyReports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/lost-found"
          element={
            <ProtectedRoute allowedRole="faculty">
              <FacultyLostFoundPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/notices"
          element={
            <ProtectedRoute allowedRole="faculty">
              <FacultyNoticePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/exams"
          element={
            <ProtectedRoute allowedRole="faculty">
              <FacultyExamInvigilationPage />
            </ProtectedRoute>
          }
        />

        {/* Student */}
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/routines"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentRoutinePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/attendance"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentAttendancePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/notices"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentNoticePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/events"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentEventsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/lost-found"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentLostFoundPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/profile"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/exams"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentExamPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;