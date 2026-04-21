const db = require('../config/db');

// GET all faculty users
exports.getFacultyUsers = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, name, email, role, created_at FROM users WHERE role = 'faculty' ORDER BY name ASC"
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET faculty attendance
exports.getFacultyAttendance = async (req, res) => {
  const { date } = req.query;

  try {
    let query = `
      SELECT 
        fa.id,
        fa.date,
        fa.status,
        u.id AS faculty_id,
        u.name AS faculty_name,
        u.email AS faculty_email
      FROM faculty_attendance fa
      JOIN users u ON fa.faculty_id = u.id
    `;
    const params = [];

    if (date) {
      query += ' WHERE fa.date = ?';
      params.push(date);
    }

    query += ' ORDER BY fa.date DESC, u.name ASC';

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// MARK faculty attendance
exports.markFacultyAttendance = async (req, res) => {
  const { faculty_id, date, status } = req.body;

  try {
    if (!faculty_id || !date || !status) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    await db.execute(
      `
      INSERT INTO faculty_attendance (faculty_id, date, status)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE status = VALUES(status)
      `,
      [faculty_id, date, status]
    );

    res.json({ message: 'Faculty attendance saved successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE faculty attendance
exports.deleteFacultyAttendance = async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute('DELETE FROM faculty_attendance WHERE id = ?', [id]);
    res.json({ message: 'Faculty attendance deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};