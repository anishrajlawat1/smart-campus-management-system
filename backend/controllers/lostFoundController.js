const db = require('../config/db');

// GET all lost & found items
exports.getLostFoundItems = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        lf.*,
        u.name AS reported_by_name,
        u.email AS reported_by_email
      FROM lost_found lf
      JOIN users u ON lf.reported_by = u.id
      ORDER BY lf.date_reported DESC, lf.created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE item
exports.createLostFoundItem = async (req, res) => {
  const {
    item_type,
    title,
    description,
    location,
    reported_by,
    contact_info,
    date_reported,
    status,
  } = req.body;

  try {
    if (!item_type || !title || !location || !reported_by || !date_reported) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    await db.execute(
      `
      INSERT INTO lost_found
      (item_type, title, description, location, reported_by, contact_info, date_reported, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        item_type,
        title,
        description || '',
        location,
        reported_by,
        contact_info || '',
        date_reported,
        status || 'open',
      ]
    );

    res.json({ message: 'Item created successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE item
exports.updateLostFoundItem = async (req, res) => {
  const { id } = req.params;
  const {
    item_type,
    title,
    description,
    location,
    reported_by,
    contact_info,
    date_reported,
    status,
  } = req.body;

  try {
    if (!item_type || !title || !location || !reported_by || !date_reported) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    await db.execute(
      `
      UPDATE lost_found
      SET item_type = ?, title = ?, description = ?, location = ?, reported_by = ?, contact_info = ?, date_reported = ?, status = ?
      WHERE id = ?
      `,
      [
        item_type,
        title,
        description || '',
        location,
        reported_by,
        contact_info || '',
        date_reported,
        status || 'open',
        id,
      ]
    );

    res.json({ message: 'Item updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE item
exports.deleteLostFoundItem = async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute('DELETE FROM lost_found WHERE id = ?', [id]);
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};