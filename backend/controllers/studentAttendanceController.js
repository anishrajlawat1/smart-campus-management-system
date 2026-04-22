const db = require('../config/db');

// GET all groups
exports.getGroups = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM groups_table ORDER BY course_name, semester, section_name'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE group
exports.createGroup = async (req, res) => {
  const { course_name, semester, section_name } = req.body;

  try {
    if (!course_name || !semester || !section_name) {
      return res.status(400).json({ message: 'All group fields are required' });
    }

    await db.execute(
      'INSERT INTO groups_table (course_name, semester, section_name) VALUES (?, ?, ?)',
      [course_name, semester, section_name]
    );

    res.json({ message: 'Group created successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET students by group
exports.getStudentsByGroup = async (req, res) => {
  const { groupId } = req.params;

  try {
    const [rows] = await db.execute(
      `
      SELECT u.id, u.name, u.email, u.role
      FROM student_groups sg
      JOIN users u ON sg.student_id = u.id
      WHERE sg.group_id = ? AND u.role = 'student'
      ORDER BY u.name
      `,
      [groupId]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ASSIGN student to group
exports.assignStudentToGroup = async (req, res) => {
  const { student_id, group_id } = req.body;

  try {
    if (!student_id || !group_id) {
      return res.status(400).json({ message: 'Student and group are required' });
    }

    const [existing] = await db.execute(
      'SELECT id FROM student_groups WHERE student_id = ? AND group_id = ?',
      [student_id, group_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Student already assigned to this group' });
    }

    await db.execute(
      'INSERT INTO student_groups (student_id, group_id) VALUES (?, ?)',
      [student_id, group_id]
    );

    res.json({ message: 'Student assigned successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET subjects
exports.getSubjects = async (req, res) => {
  const { group_id, faculty_id } = req.query;

  try {
    let query = `
      SELECT s.*, g.course_name, g.semester, g.section_name
      FROM subjects s
      JOIN groups_table g ON s.group_id = g.id
      WHERE 1=1
    `;
    const params = [];

    if (group_id) {
      query += ' AND s.group_id = ?';
      params.push(group_id);
    }

    if (faculty_id) {
      query += ' AND s.faculty_id = ?';
      params.push(faculty_id);
    }

    query += ' ORDER BY s.subject_name';

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE subject
exports.createSubject = async (req, res) => {
  const { subject_name, group_id, faculty_id } = req.body;

  try {
    if (!subject_name || !group_id) {
      return res.status(400).json({ message: 'Subject name and group are required' });
    }

    await db.execute(
      'INSERT INTO subjects (subject_name, group_id, faculty_id) VALUES (?, ?, ?)',
      [subject_name, group_id, faculty_id || null]
    );

    res.json({ message: 'Subject created successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET attendance
exports.getAttendance = async (req, res) => {
  const { date, group_id, subject_id } = req.query;

  try {
    let query = `
      SELECT 
        a.id,
        a.date,
        a.status,
        u.name AS student_name,
        u.email AS student_email,
        s.subject_name,
        g.course_name,
        g.semester,
        g.section_name
      FROM attendance a
      JOIN users u ON a.student_id = u.id
      JOIN subjects s ON a.subject_id = s.id
      JOIN groups_table g ON s.group_id = g.id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      query += ' AND a.date = ?';
      params.push(date);
    }

    if (group_id) {
      query += ' AND s.group_id = ?';
      params.push(group_id);
    }

    if (subject_id) {
      query += ' AND a.subject_id = ?';
      params.push(subject_id);
    }

    query += ' ORDER BY a.date DESC, u.name ASC';

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// MARK attendance
exports.markAttendance = async (req, res) => {
  const { student_id, subject_id, faculty_id, date, status } = req.body;

  try {
    if (!student_id || !subject_id || !date || !status) {
      return res.status(400).json({ message: 'All attendance fields are required' });
    }

    await db.execute(
      `
      INSERT INTO attendance (student_id, subject_id, faculty_id, date, status)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE status = VALUES(status), faculty_id = VALUES(faculty_id)
      `,
      [student_id, subject_id, faculty_id || null, date, status]
    );

    res.json({ message: 'Attendance saved successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE attendance
exports.deleteAttendance = async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute('DELETE FROM attendance WHERE id = ?', [id]);
    res.json({ message: 'Attendance deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};