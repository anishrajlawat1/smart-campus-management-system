const db = require('../config/db');

const {
  createNotification,
} = require('../utils/notificationHelper');

const notifyEventAudience = async ({
  audience_type = 'all',
  title,
  message,
  notificationTitle,
}) => {
  if (audience_type === 'all' || audience_type === 'students') {
    await createNotification({
      user_id: null,
      role: 'student',
      title: notificationTitle,
      message,
      type: 'event',
    });
  }

  if (audience_type === 'all' || audience_type === 'faculty') {
    await createNotification({
      user_id: null,
      role: 'faculty',
      title: notificationTitle,
      message,
      type: 'event',
    });
  }
};

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
    console.error('Get events error:', err);
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
    end_datetime,
    audience_type = 'all',
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
      return res.status(400).json({
        message: 'All required fields must be filled',
      });
    }

    if (!['all', 'students', 'faculty'].includes(audience_type)) {
      return res.status(400).json({
        message: 'Invalid audience type',
      });
    }

    if (new Date(start_datetime) >= new Date(end_datetime)) {
      return res.status(400).json({
        message: 'End time must be after start time',
      });
    }

    const [conflicts] = await db.execute(
      `
      SELECT id
      FROM events
      WHERE venue = ?
      AND (? < end_datetime AND ? > start_datetime)
      `,
      [venue, start_datetime, end_datetime]
    );

    if (conflicts.length > 0) {
      return res.status(400).json({
        message: 'Venue is already booked for the selected time range',
      });
    }

    await db.execute(
      `
      INSERT INTO events
      (title, description, event_type, venue, organizer_id, start_datetime, end_datetime, audience_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        title,
        description || '',
        event_type,
        venue,
        organizer_id,
        start_datetime,
        end_datetime,
        audience_type,
      ]
    );

    await notifyEventAudience({
      audience_type,
      title,
      notificationTitle: 'New Campus Event',
      message: `${title} has been scheduled at ${venue}.`,
    });

    res.status(201).json({
      message: 'Event created successfully',
    });
  } catch (err) {
    console.error('Create event error:', err);
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
    end_datetime,
    audience_type = 'all',
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
      return res.status(400).json({
        message: 'All required fields must be filled',
      });
    }

    if (!['all', 'students', 'faculty'].includes(audience_type)) {
      return res.status(400).json({
        message: 'Invalid audience type',
      });
    }

    if (new Date(start_datetime) >= new Date(end_datetime)) {
      return res.status(400).json({
        message: 'End time must be after start time',
      });
    }

    const [conflicts] = await db.execute(
      `
      SELECT id
      FROM events
      WHERE venue = ?
      AND id != ?
      AND (? < end_datetime AND ? > start_datetime)
      `,
      [venue, id, start_datetime, end_datetime]
    );

    if (conflicts.length > 0) {
      return res.status(400).json({
        message: 'Venue is already booked for the selected time range',
      });
    }

    await db.execute(
      `
      UPDATE events
      SET title = ?,
          description = ?,
          event_type = ?,
          venue = ?,
          organizer_id = ?,
          start_datetime = ?,
          end_datetime = ?,
          audience_type = ?
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
        audience_type,
        id,
      ]
    );

    await notifyEventAudience({
      audience_type,
      title,
      notificationTitle: 'Campus Event Updated',
      message: `${title} event details have been updated.`,
    });

    res.json({
      message: 'Event updated successfully',
    });
  } catch (err) {
    console.error('Update event error:', err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE event
exports.deleteEvent = async (req, res) => {
  const { id } = req.params;

  try {
    const [eventRows] = await db.execute(
      `
      SELECT title, audience_type
      FROM events
      WHERE id = ?
      `,
      [id]
    );

    const eventTitle = eventRows?.[0]?.title || 'An event';
    const audienceType = eventRows?.[0]?.audience_type || 'all';

    await db.execute('DELETE FROM events WHERE id = ?', [id]);

    await notifyEventAudience({
      audience_type: audienceType,
      title: eventTitle,
      notificationTitle: 'Campus Event Cancelled',
      message: `${eventTitle} has been cancelled or removed.`,
    });

    res.json({
      message: 'Event deleted successfully',
    });
  } catch (err) {
    console.error('Delete event error:', err);
    res.status(500).json({ message: err.message });
  }
};