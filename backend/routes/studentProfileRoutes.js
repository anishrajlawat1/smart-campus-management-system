const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const db = require('../config/db');

// Upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/profile_images';

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },

  filename: function (req, file, cb) {
    cb(
      null,
      `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  },
});

const makeImageUrl = (imagePath) => {
  if (!imagePath) return null;

  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  return `http://localhost:5000/${imagePath.replaceAll('\\', '/')}`;
};

// GET STUDENT PROFILE
router.get('/profile', protect, authorizeRoles('student'), async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.phone,
        u.address,
        u.dob,
        u.profile_image,

        sg.id AS student_group_assignment_id,
        sg.group_id,

        cl.id AS course_level_id,
        cl.level_name,

        c.id AS course_id,
        c.course_name

      FROM users u
      LEFT JOIN student_groups sg
        ON sg.student_id = u.id
      LEFT JOIN course_levels cl
        ON cl.id = sg.group_id
      LEFT JOIN courses c
        ON c.id = cl.course_id
      WHERE u.id = ? AND u.role = 'student'
      LIMIT 1
      `,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Student profile not found',
      });
    }

    const student = rows[0];

    res.json({
      ...student,
      profile_image: makeImageUrl(student.profile_image),
      class_name: student.course_name || null,
      section_name: student.level_name || null,
    });
  } catch (err) {
    console.error('Get student profile error:', err);

    res.status(500).json({
      message: 'Failed to fetch student profile',
      error: err.message,
    });
  }
});

// UPDATE STUDENT PROFILE INFO
router.put('/update-profile', protect, authorizeRoles('student'), async (req, res) => {
  try {
    const { phone, address, dob } = req.body;
    const userId = req.user.id;

    await db.query(
      `
      UPDATE users
      SET phone = ?, address = ?, dob = ?
      WHERE id = ? AND role = 'student'
      `,
      [phone || null, address || null, dob || null, userId]
    );

    const [updatedUserRows] = await db.query(
      `
      SELECT
        id,
        name,
        email,
        role,
        phone,
        address,
        dob,
        profile_image
      FROM users
      WHERE id = ? AND role = 'student'
      `,
      [userId]
    );

    const updatedUser = updatedUserRows[0];

    res.json({
      message: 'Profile updated',
      student: {
        ...updatedUser,
        profile_image: makeImageUrl(updatedUser.profile_image),
      },
    });
  } catch (err) {
    console.error('Update student profile error:', err);

    res.status(500).json({
      message: 'Error updating profile',
      error: err.message,
    });
  }
});

// UPLOAD STUDENT PROFILE IMAGE
router.post(
  '/upload',
  protect,
  authorizeRoles('student'),
  upload.single('profile_image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: 'No file uploaded',
        });
      }

      const userId = req.user.id;
      const profilePath = req.file.path.replaceAll('\\', '/');

      const [oldRows] = await db.query(
        'SELECT profile_image FROM users WHERE id = ? AND role = ?',
        [userId, 'student']
      );

      const oldImage = oldRows?.[0]?.profile_image;

      if (oldImage && fs.existsSync(oldImage)) {
        fs.unlinkSync(oldImage);
      }

      await db.query(
        'UPDATE users SET profile_image = ? WHERE id = ? AND role = ?',
        [profilePath, userId, 'student']
      );

      res.json({
        message: 'Profile image updated',
        profile_image: makeImageUrl(profilePath),
      });
    } catch (err) {
      console.error('Upload profile image error:', err);

      res.status(500).json({
        message: 'Upload failed',
        error: err.message,
      });
    }
  }
);

// DELETE STUDENT PROFILE IMAGE
router.delete('/profile-image', protect, authorizeRoles('student'), async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      'SELECT profile_image FROM users WHERE id = ? AND role = ?',
      [userId, 'student']
    );

    const oldImage = rows?.[0]?.profile_image;

    if (oldImage && fs.existsSync(oldImage)) {
      fs.unlinkSync(oldImage);
    }

    await db.query(
      'UPDATE users SET profile_image = NULL WHERE id = ? AND role = ?',
      [userId, 'student']
    );

    res.json({
      message: 'Profile image removed',
    });
  } catch (err) {
    console.error('Delete profile image error:', err);

    res.status(500).json({
      message: 'Failed to delete profile image',
      error: err.message,
    });
  }
});

// CHANGE STUDENT PASSWORD
router.put('/change-password', protect, authorizeRoles('student'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    const [rows] = await db.query(
      'SELECT password FROM users WHERE id = ? AND role = ?',
      [userId, 'student']
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, rows[0].password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      'UPDATE users SET password = ? WHERE id = ? AND role = ?',
      [hashedPassword, userId, 'student']
    );

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);

    res.status(500).json({
      message: 'Error changing password',
      error: err.message,
    });
  }
});

module.exports = router;