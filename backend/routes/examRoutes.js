const express = require('express');

const {
  getExams,
  getExamDetails,
  createExam,
  updateExam,
  deleteExam,
  addExamRoom,
  deleteExamRoom,
  generateSeating,
  updateExamAttendance,
  getStudentExamSeats,
  getFacultyInvigilationRooms,
  getFacultyInvigilationStudents,
} = require('../controllers/examController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get(
  '/student/my-seats',
  protect,
  authorizeRoles('student'),
  getStudentExamSeats
);

router.get(
  '/faculty/my-rooms',
  protect,
  authorizeRoles('faculty'),
  getFacultyInvigilationRooms
);

router.get(
  '/faculty/rooms/:roomId/students',
  protect,
  authorizeRoles('faculty'),
  getFacultyInvigilationStudents
);

router.get(
  '/',
  protect,
  authorizeRoles('admin'),
  getExams
);

router.get(
  '/:id',
  protect,
  authorizeRoles('admin'),
  getExamDetails
);

router.post(
  '/',
  protect,
  authorizeRoles('admin'),
  createExam
);

router.put(
  '/:id',
  protect,
  authorizeRoles('admin'),
  updateExam
);

router.delete(
  '/:id',
  protect,
  authorizeRoles('admin'),
  deleteExam
);

router.post(
  '/:id/rooms',
  protect,
  authorizeRoles('admin'),
  addExamRoom
);

router.delete(
  '/rooms/:roomId',
  protect,
  authorizeRoles('admin'),
  deleteExamRoom
);

router.post(
  '/:id/generate-seating',
  protect,
  authorizeRoles('admin'),
  generateSeating
);

router.patch(
  '/seating/:seatingId/attendance',
  protect,
  authorizeRoles('admin', 'faculty'),
  updateExamAttendance
);

module.exports = router;