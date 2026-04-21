const db = require('../config/db');

// GET all events
exports.getEvents = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        e.*,
        u.name AS organizer_name,
        u.email AS organizer_email
      FROM events e
      JOIN users u ON e.organizer_id = u.id
      ORDER BY e.start_datetime DESC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE event
exports.createEvent = async (req, res) => {
  const {
    title,
    description,
    event_type,
    venue,
    organizer_id,
    start_datetime,
    end_datetime
  } = req.body;

  try {
    if (
      !title ||
      !event_type ||
      !venue ||
      !organizer_id ||
      !start_datetime ||
      !end_datetime
    ) {
      return res.status(400).json({ message: 'All required fields must be filled' });
    }

    if (new Date(start_datetime) >= new Date(end_datetime)) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // conflict check
    const [conflicts] = await db.execute(
      `
      SELECT id FROM events
      WHERE venue = ?
      AND (
        (? BETWEEN start_datetime AND end_datetime)
        OR (? BETWEEN start_datetime AND end_datetime)
        OR (start_datetime BETWEEN ? AND ?)
      )
      `,
      [venue, start_datetime, end_datetime, start_datetime, end_datetime]
    );

    if (conflicts.length > 0) {
      return res.status(400).json({
        message: 'Venue is already booked for the selected time range'
      });
    }

    await db.execute(
      `
      INSERT INTO events
      (title, description, event_type, venue, organizer_id, start_datetime, end_datetime)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        title,
        description || '',
        event_type,
        venue,
        organizer_id,
        start_datetime,
        end_datetime
      ]
    );

    res.json({ message: 'Event created successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE event
exports.updateEvent = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    event_type,
    venue,
    organizer_id,
    start_datetime,
    end_datetime
  } = req.body;

  try {
    if (
      !title ||
      !event_type ||
      !venue ||
      !organizer_id ||
      !start_datetime ||
      !end_datetime
    ) {
      return res.status(400).json({ message: 'All required fields must be filled' });
    }

    if (new Date(start_datetime) >= new Date(end_datetime)) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    const [conflicts] = await db.execute(
      `
      SELECT id FROM events
      WHERE venue = ?
      AND id != ?
      AND (
        (? BETWEEN start_datetime AND end_datetime)
        OR (? BETWEEN start_datetime AND end_datetime)
        OR (start_datetime BETWEEN ? AND ?)
      )
      `,
      [venue, id, start_datetime, end_datetime, start_datetime, end_datetime]
    );

    if (conflicts.length > 0) {
      return res.status(400).json({
        message: 'Venue is already booked for the selected time range'
      });
    }

    await db.execute(
      `
      UPDATE events
      SET title = ?, description = ?, event_type = ?, venue = ?, organizer_id = ?, start_datetime = ?, end_datetime = ?
      WHERE id = ?
      `,
      [
        title,
        description || '',
        event_type,
        venue,
        organizer_id,
        start_datetime,
        end_datetime,
        id
      ]
    );

    res.json({ message: 'Event updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE event
exports.deleteEvent = async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute('DELETE FROM events WHERE id = ?', [id]);
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};