const express = require('express');
const router = express.Router();

const {
  getFacultyUsers,
  getFacultyAttendance,
  markFacultyAttendance,
  deleteFacultyAttendance,
} = require('../controllers/facultyAttendanceController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/faculty-users', protect, authorizeRoles('admin'), getFacultyUsers);
router.get('/', protect, authorizeRoles('admin'), getFacultyAttendance);
router.post('/', protect, authorizeRoles('admin'), markFacultyAttendance);
router.delete('/:id', protect, authorizeRoles('admin'), deleteFacultyAttendance);

module.exports = router;