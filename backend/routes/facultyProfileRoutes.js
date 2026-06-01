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
      `faculty-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`
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

// GET FACULTY PROFILE
router.get('/profile', protect, authorizeRoles('faculty'), async (req, res) => {
  try {
    const facultyId = req.user.id;

    const [rows] = await db.query(
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
      WHERE id = ? AND role = 'faculty'
      LIMIT 1
      `,
      [facultyId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Faculty profile not found',
      });
    }

    const faculty = rows[0];

    res.json({
      ...faculty,
      profile_image: makeImageUrl(faculty.profile_image),
    });
  } catch (err) {
    console.error('Get faculty profile error:', err);

    res.status(500).json({
      message: 'Failed to fetch faculty profile',
      error: err.message,
    });
  }
});

// UPDATE FACULTY PROFILE INFO
router.put('/update-profile', protect, authorizeRoles('faculty'), async (req, res) => {
  try {
    const facultyId = req.user.id;
    const { phone, address, dob } = req.body;

    await db.query(
      `
      UPDATE users
      SET phone = ?, address = ?, dob = ?
      WHERE id = ? AND role = 'faculty'
      `,
      [phone || null, address || null, dob || null, facultyId]
    );

    const [updatedRows] = await db.query(
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
      WHERE id = ? AND role = 'faculty'
      `,
      [facultyId]
    );

    const updatedFaculty = updatedRows[0];

    res.json({
      message: 'Faculty profile updated',
      faculty: {
        ...updatedFaculty,
        profile_image: makeImageUrl(updatedFaculty.profile_image),
      },
    });
  } catch (err) {
    console.error('Update faculty profile error:', err);

    res.status(500).json({
      message: 'Error updating faculty profile',
      error: err.message,
    });
  }
});

// UPLOAD FACULTY PROFILE IMAGE
router.post(
  '/upload',
  protect,
  authorizeRoles('faculty'),
  upload.single('profile_image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: 'No file uploaded',
        });
      }

      const facultyId = req.user.id;
      const profilePath = req.file.path.replaceAll('\\', '/');

      const [oldRows] = await db.query(
        'SELECT profile_image FROM users WHERE id = ? AND role = ?',
        [facultyId, 'faculty']
      );

      const oldImage = oldRows?.[0]?.profile_image;

      if (oldImage && fs.existsSync(oldImage)) {
        fs.unlinkSync(oldImage);
      }

      await db.query(
        'UPDATE users SET profile_image = ? WHERE id = ? AND role = ?',
        [profilePath, facultyId, 'faculty']
      );

      res.json({
        message: 'Faculty profile image updated',
        profile_image: makeImageUrl(profilePath),
      });
    } catch (err) {
      console.error('Upload faculty profile image error:', err);

      res.status(500).json({
        message: 'Upload failed',
        error: err.message,
      });
    }
  }
);

// DELETE FACULTY PROFILE IMAGE
router.delete('/profile-image', protect, authorizeRoles('faculty'), async (req, res) => {
  try {
    const facultyId = req.user.id;

    const [rows] = await db.query(
      'SELECT profile_image FROM users WHERE id = ? AND role = ?',
      [facultyId, 'faculty']
    );

    const oldImage = rows?.[0]?.profile_image;

    if (oldImage && fs.existsSync(oldImage)) {
      fs.unlinkSync(oldImage);
    }

    await db.query(
      'UPDATE users SET profile_image = NULL WHERE id = ? AND role = ?',
      [facultyId, 'faculty']
    );

    res.json({
      message: 'Faculty profile image removed',
    });
  } catch (err) {
    console.error('Delete faculty profile image error:', err);

    res.status(500).json({
      message: 'Failed to delete faculty profile image',
      error: err.message,
    });
  }
});

// CHANGE FACULTY PASSWORD
router.put('/change-password', protect, authorizeRoles('faculty'), async (req, res) => {
  try {
    const facultyId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    const [rows] = await db.query(
      'SELECT password FROM users WHERE id = ? AND role = ?',
      [facultyId, 'faculty']
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, rows[0].password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      'UPDATE users SET password = ? WHERE id = ? AND role = ?',
      [hashedPassword, facultyId, 'faculty']
    );

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Faculty change password error:', err);

    res.status(500).json({
      message: 'Error changing password',
      error: err.message,
    });
  }
});

module.exports = router;