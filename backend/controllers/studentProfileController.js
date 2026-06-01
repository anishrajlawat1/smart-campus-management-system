const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Get Student Profile
const getStudentProfile = async (req, res) => {
  try {
    const studentId = req.user.id;

    const [studentRows] = await db.query(
      `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.address,
        u.dob,
        u.profile_image,
        c.name AS course_name,
        l.name AS level_name,
        g.name AS group_name
      FROM users u
      LEFT JOIN student_group_assignments sga ON sga.student_id = u.id
      LEFT JOIN groups g ON g.id = sga.group_id
      LEFT JOIN levels l ON l.id = g.level_id
      LEFT JOIN courses c ON c.id = l.course_id
      WHERE u.id = ? AND u.role = 'student'
      LIMIT 1
      `,
      [studentId]
    );

    if (studentRows.length === 0) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    res.json(studentRows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

// Update Student Profile
const updateStudentProfile = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { phone, address, dob } = req.body;

    const [result] = await db.query(
      `UPDATE users SET phone = ?, address = ?, dob = ? WHERE id = ? AND role = 'student'`,
      [phone, address, dob, studentId]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'Failed to update profile' });
    }

    // Return updated profile
    const [updatedRows] = await db.query(
      `SELECT id, name, email, phone, address, dob, profile_image FROM users WHERE id = ?`,
      [studentId]
    );

    res.json(updatedRows[0]);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

// Change Password
const changePassword = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    const [rows] = await db.query(
      `SELECT password FROM users WHERE id = ? AND role = 'student'`,
      [studentId]
    );

    if (rows.length === 0) return res.status(404).json({ message: 'Student not found' });

    const user = rows[0];

    // Check old password
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return res.status(400).json({ message: 'Old password is incorrect' });

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);

    await db.query(
      `UPDATE users SET password = ? WHERE id = ?`,
      [hashed, studentId]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ message: 'Error changing password' });
  }
};

module.exports = {
  getStudentProfile,
  updateStudentProfile,
  changePassword
};