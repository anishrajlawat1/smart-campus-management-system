const express = require('express');
const router = express.Router();

const {
  getCourses,
  createCourse,
  deleteCourse,

  getLevels,
  getLevelsByCourse,
  createLevel,
  deleteLevel,

  getGroups,
  createGroup,

  getSubjects,
  createSubject,
  deleteSubject,

  assignSubjectToGroup,
  getGroupSubjects,
  deleteGroupSubject,

  getStudentsByGroup,
  assignStudentToGroup,
  getAssignedStudents,
  deleteAssignedStudent,

  getFacultySubjects,
  assignFacultyToSubject,
  deleteFacultySubject,

  getAttendance,
  getAttendanceReport,
  getStudentDashboardSummary,
  markAttendance,
  deleteAttendance,
  getStudentSubjectAttendance,
  getFacultyLowAttendanceRisk,
} = require('../controllers/studentAttendanceController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

/* =========================
   COURSES
========================= */
router.get('/courses', protect, authorizeRoles('admin'), getCourses);
router.post('/courses', protect, authorizeRoles('admin'), createCourse);
router.delete('/courses/:id', protect, authorizeRoles('admin'), deleteCourse);

/* =========================
   LEVELS
========================= */
router.get('/levels', protect, authorizeRoles('admin'), getLevels);

router.get(
  '/courses/:courseId/levels',
  protect,
  authorizeRoles('admin'),
  getLevelsByCourse
);

router.post('/levels', protect, authorizeRoles('admin'), createLevel);
router.delete('/levels/:id', protect, authorizeRoles('admin'), deleteLevel);

/* =========================
   GROUPS / SECTIONS
========================= */
router.get('/groups', protect, authorizeRoles('admin', 'faculty'), getGroups);
router.post('/groups', protect, authorizeRoles('admin'), createGroup);

/* =========================
   SUBJECTS
========================= */
router.get('/subjects', protect, authorizeRoles('admin', 'faculty'), getSubjects);
router.post('/subjects', protect, authorizeRoles('admin'), createSubject);
router.delete('/subjects/:id', protect, authorizeRoles('admin'), deleteSubject);

/* =========================
   GROUP SUBJECTS
========================= */
router.get(
  '/group-subjects',
  protect,
  authorizeRoles('admin', 'faculty'),
  getGroupSubjects
);

router.post(
  '/group-subjects',
  protect,
  authorizeRoles('admin'),
  assignSubjectToGroup
);

router.delete(
  '/group-subjects/:id',
  protect,
  authorizeRoles('admin'),
  deleteGroupSubject
);

/* =========================
   STUDENT ASSIGNMENT
========================= */
router.get(
  '/groups/:groupId/students',
  protect,
  authorizeRoles('admin', 'faculty'),
  getStudentsByGroup
);

router.post(
  '/assign-student',
  protect,
  authorizeRoles('admin'),
  assignStudentToGroup
);

router.get(
  '/assigned-students',
  protect,
  authorizeRoles('admin'),
  getAssignedStudents
);

router.delete(
  '/assigned-students/:id',
  protect,
  authorizeRoles('admin'),
  deleteAssignedStudent
);

/* =========================
   FACULTY SUBJECT ASSIGNMENT
========================= */
router.get(
  '/faculty-subjects',
  protect,
  authorizeRoles('admin', 'faculty'),
  getFacultySubjects
);

router.post(
  '/faculty-subjects',
  protect,
  authorizeRoles('admin'),
  assignFacultyToSubject
);

router.delete(
  '/faculty-subjects/:id',
  protect,
  authorizeRoles('admin'),
  deleteFacultySubject
);

/* =========================
   STUDENT DASHBOARD
========================= */
router.get(
  '/student-dashboard/:studentId',
  protect,
  authorizeRoles('student'),
  getStudentDashboardSummary
);

/* =========================
   ATTENDANCE REPORT EXPORT
   Keep both paths for compatibility:
   /report
   /reports/attendance
========================= */
router.get(
  '/report',
  protect,
  authorizeRoles('admin', 'faculty'),
  getAttendanceReport
);

router.get(
  '/reports/attendance',
  protect,
  authorizeRoles('admin', 'faculty'),
  getAttendanceReport
);

/* =========================
   STUDENT SUBJECT-WISE ATTENDANCE
========================= */
router.get(
  '/student/:studentId/subjects',
  protect,
  authorizeRoles('student'),
  getStudentSubjectAttendance
);

/* =========================
   FACULTY LOW ATTENDANCE RISK
========================= */
router.get(
  '/faculty/:facultyId/low-attendance-risk',
  protect,
  authorizeRoles('faculty', 'admin'),
  getFacultyLowAttendanceRisk
);

/* =========================
   ATTENDANCE CRUD
   Keep these generic routes near bottom.
========================= */
router.get('/', protect, authorizeRoles('admin', 'faculty'), getAttendance);
router.post('/', protect, authorizeRoles('admin', 'faculty'), markAttendance);
router.delete('/:id', protect, authorizeRoles('admin'), deleteAttendance);

module.exports = router;