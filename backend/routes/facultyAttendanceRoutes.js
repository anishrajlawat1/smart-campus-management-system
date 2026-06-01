const express = require('express');
const router = express.Router();

const {
  getFacultyList,
  getFacultyAttendance,
  markFacultyAttendance,
} = require('../controllers/facultyAttendanceController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// get all faculty
router.get('/faculty', protect, authorizeRoles('admin'), getFacultyList);

// get faculty attendance by date
router.get('/', protect, authorizeRoles('admin'), getFacultyAttendance);

// mark faculty attendance
router.post('/', protect, authorizeRoles('admin'), markFacultyAttendance);

module.exports = router;