const express = require('express');
const router = express.Router();

const {
  getGroups,
  createGroup,
  getStudentsByGroup,
  assignStudentToGroup,
  getSubjects,
  createSubject,
  getAttendance,
  markAttendance,
  deleteAttendance,
} = require('../controllers/studentAttendanceController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Admin setup routes
router.get('/groups', protect, authorizeRoles('admin', 'faculty'), getGroups);
router.post('/groups', protect, authorizeRoles('admin'), createGroup);

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

router.get('/subjects', protect, authorizeRoles('admin', 'faculty'), getSubjects);
router.post('/subjects', protect, authorizeRoles('admin'), createSubject);

// Attendance routes
router.get('/', protect, authorizeRoles('admin', 'faculty'), getAttendance);
router.post('/', protect, authorizeRoles('admin', 'faculty'), markAttendance);
router.delete('/:id', protect, authorizeRoles('admin'), deleteAttendance);

module.exports = router;