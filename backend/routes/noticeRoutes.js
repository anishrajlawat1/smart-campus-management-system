const express = require('express');
const router = express.Router();

const {
  getNoticeGroups,
  getNotices,
  getStudentNotices,
  createNotice,
  updateNotice,
  deleteNotice,
} = require('../controllers/noticeController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get(
  '/groups',
  protect,
  authorizeRoles('admin', 'faculty'),
  getNoticeGroups
);

router.get(
  '/student/my-notices',
  protect,
  authorizeRoles('student'),
  getStudentNotices
);

router.get(
  '/',
  protect,
  authorizeRoles('admin', 'faculty', 'student'),
  getNotices
);

router.post(
  '/',
  protect,
  authorizeRoles('admin', 'faculty'),
  createNotice
);

router.put(
  '/:id',
  protect,
  authorizeRoles('admin', 'faculty'),
  updateNotice
);

router.delete(
  '/:id',
  protect,
  authorizeRoles('admin', 'faculty'),
  deleteNotice
);

module.exports = router;