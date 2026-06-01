const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const db = require('../config/db');

// Get notifications for logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    const [rows] = await db.execute(
      `
      SELECT *
      FROM notifications
      WHERE role = ?
        AND (user_id IS NULL OR user_id = ?)
      ORDER BY created_at DESC
      LIMIT 20
      `,
      [role, userId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Get notifications error:', err);

    res.status(500).json({
      message: 'Failed to fetch notifications',
      error: err.message,
    });
  }
});

// Mark one notification as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    await db.execute(
      `
      UPDATE notifications
      SET is_read = 1
      WHERE id = ?
        AND role = ?
        AND (user_id IS NULL OR user_id = ?)
      `,
      [id, role, userId]
    );

    res.json({
      message: 'Notification marked as read',
    });
  } catch (err) {
    console.error('Mark notification read error:', err);

    res.status(500).json({
      message: 'Failed to mark notification as read',
      error: err.message,
    });
  }
});

// Create notification manually/admin use
router.post('/', protect, authorizeRoles('admin', 'faculty'), async (req, res) => {
  try {
    const {
      user_id = null,
      role,
      title,
      message,
      type = 'general',
    } = req.body;

    if (!role || !title || !message) {
      return res.status(400).json({
        message: 'role, title, and message are required',
      });
    }

    await db.execute(
      `
      INSERT INTO notifications
      (user_id, role, title, message, type)
      VALUES (?, ?, ?, ?, ?)
      `,
      [user_id || null, role, title, message, type]
    );

    res.status(201).json({
      message: 'Notification created',
    });
  } catch (err) {
    console.error('Create notification error:', err);

    res.status(500).json({
      message: 'Failed to create notification',
      error: err.message,
    });
  }
});

module.exports = router;