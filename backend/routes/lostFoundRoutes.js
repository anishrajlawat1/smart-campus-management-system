const express = require('express');
const router = express.Router();

const {
  getLostFoundItems,
  createLostFoundItem,
  updateLostFoundItem,
  deleteLostFoundItem,
} = require('../controllers/lostFoundController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/', protect, authorizeRoles('admin'), getLostFoundItems);
router.post('/', protect, authorizeRoles('admin'), createLostFoundItem);
router.put('/:id', protect, authorizeRoles('admin'), updateLostFoundItem);
router.delete('/:id', protect, authorizeRoles('admin'), deleteLostFoundItem);

module.exports = router;