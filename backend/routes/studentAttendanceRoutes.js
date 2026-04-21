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

router.get('/groups', protect, authorizeRoles('admin'), getGroups);
router.post('/groups', protect, authorizeRoles('admin'), createGroup);

router.get('/groups/:groupId/students', protect, authorizeRoles('admin'), getStudentsByGroup);
router.post('/assign-student', protect, authorizeRoles('admin'), assignStudentToGroup);

router.get('/subjects', protect, authorizeRoles('admin'), getSubjects);
router.post('/subjects', protect, authorizeRoles('admin'), createSubject);

router.get('/', protect, authorizeRoles('admin'), getAttendance);
router.post('/', protect, authorizeRoles('admin'), markAttendance);
router.delete('/:id', protect, authorizeRoles('admin'), deleteAttendance);

module.exports = router;