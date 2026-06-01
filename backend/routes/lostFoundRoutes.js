const express = require('express');
const router = express.Router();

const {
  getLostFoundItems,
  createLostFoundItem,
  updateLostFoundItem,
  updateLostFoundStatus,
  requestLostFoundClaim,
  deleteLostFoundItem,
} = require('../controllers/lostFoundController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const upload = require('../middleware/lostFoundUploadMiddleware');

router.get(
  '/',
  protect,
  authorizeRoles('admin', 'faculty', 'student'),
  getLostFoundItems
);

router.post(
  '/',
  protect,
  authorizeRoles('admin', 'faculty', 'student'),
  upload.single('image'),
  createLostFoundItem
);

router.put(
  '/:id',
  protect,
  authorizeRoles('admin', 'faculty', 'student'),
  upload.single('image'),
  updateLostFoundItem
);

router.patch(
  '/:id/status',
  protect,
  authorizeRoles('admin'),
  updateLostFoundStatus
);

router.post(
  '/:id/request-claim',
  protect,
  authorizeRoles('faculty', 'student'),
  requestLostFoundClaim
);

router.delete(
  '/:id',
  protect,
  authorizeRoles('admin'),
  deleteLostFoundItem
);

module.exports = router;