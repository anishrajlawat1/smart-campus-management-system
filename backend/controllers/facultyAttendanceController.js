const db = require('../config/db');

// get faculty list
exports.getFacultyList = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, name, email FROM users WHERE role = 'faculty'"
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// get faculty attendance by date
exports.getFacultyAttendance = async (req, res) => {
  const { date } = req.query;

  try {
    const [rows] = await db.execute(
      `SELECT fa.*, u.name, u.email
       FROM faculty_attendance fa
       JOIN users u ON fa.faculty_id = u.id
       WHERE fa.date = ?`,
      [date]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// mark faculty attendance
exports.markFacultyAttendance = async (req, res) => {
  const { faculty_id, date, status } = req.body;

  try {
    await db.execute(
      `INSERT INTO faculty_attendance (faculty_id, date, status)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [faculty_id, date, status]
    );

    res.json({ message: 'Faculty attendance marked' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};