const db = require('../config/db');

// GET all notices
exports.getNotices = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT n.*, g.course_name, g.semester, g.section_name, u.name AS created_by_name
      FROM notices n
      LEFT JOIN groups_table g ON n.group_id = g.id
      LEFT JOIN users u ON n.created_by = u.id
      ORDER BY n.publish_date DESC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE notice
exports.createNotice = async (req, res) => {
  const { title, message, audience_type, group_id, publish_date } = req.body;
  const created_by = req.user.id;

  try {
    await db.execute(
      `INSERT INTO notices (title, message, audience_type, group_id, created_by, publish_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, message, audience_type, group_id || null, created_by, publish_date]
    );

    res.json({ message: 'Notice created' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE notice
exports.updateNotice = async (req, res) => {
  const { id } = req.params;
  const { title, message, audience_type, group_id, publish_date } = req.body;

  try {
    await db.execute(
      `UPDATE notices 
       SET title=?, message=?, audience_type=?, group_id=?, publish_date=? 
       WHERE id=?`,
      [title, message, audience_type, group_id || null, publish_date, id]
    );

    res.json({ message: 'Notice updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE notice
exports.deleteNotice = async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute('DELETE FROM notices WHERE id=?', [id]);
    res.json({ message: 'Notice deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};