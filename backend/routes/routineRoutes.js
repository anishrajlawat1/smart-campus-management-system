const express = require('express');
const router = express.Router();

const {
  getRoutines,
  createRoutine,
  updateRoutine,
  generateRoutine,
  deleteRoutine,
} = require('../controllers/routineController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const db = require('../config/db');

/*
  STUDENT ROUTINE ROUTE

  Your assignment structure:
  users.id
    -> student_groups.student_id
    -> student_groups.group_id
    -> class_routines.group_id

  So this fetches only routines assigned to the logged-in student's group.
*/
router.get(
  '/student/my-routines',
  protect,
  authorizeRoles('student'),
  async (req, res) => {
    try {
      const userId = req.user.id;

      const [rows] = await db.query(
        `
        SELECT
          cr.*,

          sg.group_id,

          cl.level_name,

          c.course_name,

          s.subject_name,

          f.name AS faculty_name

        FROM student_groups sg

        INNER JOIN class_routines cr
          ON cr.group_id = sg.group_id

        LEFT JOIN course_levels cl
          ON cl.id = sg.group_id

        LEFT JOIN courses c
          ON c.id = cl.course_id

        LEFT JOIN subjects s
          ON s.id = cr.subject_id

        LEFT JOIN users f
          ON f.id = cr.faculty_id

        WHERE sg.student_id = ?

        ORDER BY
          FIELD(
            cr.day_of_week,
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday'
          ),
          cr.start_time
        `,
        [userId]
      );

      res.json(rows);
    } catch (error) {
      console.error('Fetch student routines error:', error);

      res.status(500).json({
        message: 'Failed to fetch student routines',
        error: error.message,
      });
    }
  }
);

router.get('/', protect, authorizeRoles('admin', 'faculty', 'student'), getRoutines);
router.post('/', protect, authorizeRoles('admin'), createRoutine);
router.post('/generate', protect, authorizeRoles('admin'), generateRoutine);
router.put('/:id', protect, authorizeRoles('admin'), updateRoutine);
router.delete('/:id', protect, authorizeRoles('admin'), deleteRoutine);

module.exports = router;