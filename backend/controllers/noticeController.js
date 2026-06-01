const db = require('../config/db');

const {
  createNotification,
  createNotificationForUsers,
} = require('../utils/notificationHelper');

exports.getNoticeGroups = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `
      SELECT
        cl.id,
        cl.course_id,
        cl.level_name,
        c.course_name
      FROM course_levels cl
      LEFT JOIN courses c
        ON c.id = cl.course_id
      ORDER BY c.course_name ASC, cl.level_name ASC
      `
    );

    const formattedRows = rows.map((row) => ({
      id: row.id,
      group_id: row.id,
      course_id: row.course_id,
      course_name: row.course_name,
      semester: row.level_name,
      section_name: row.level_name,
      level_name: row.level_name,
    }));

    res.json(formattedRows);
  } catch (err) {
    console.error('Get notice groups error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getNotices = async (req, res) => {
  try {
    const { group_id, subject_id, audience_type } = req.query;

    let sql = `
      SELECT 
        n.*,
        u.name AS created_by_name,

        cl.level_name,
        c.course_name,

        s.subject_name

      FROM notices n

      LEFT JOIN users u
        ON n.created_by = u.id

      LEFT JOIN course_levels cl
        ON n.group_id = cl.id

      LEFT JOIN courses c
        ON c.id = cl.course_id

      LEFT JOIN subjects s
        ON n.subject_id = s.id

      WHERE 1 = 1
    `;

    const params = [];

    /*
      audience_type rules:
      all      => visible to everyone
      faculty  => visible to faculty only
      students => visible to students only
      group    => visible to selected group/level
    */

    if (audience_type === 'faculty') {
      sql += ` AND n.audience_type IN ('all', 'faculty')`;
    } else if (audience_type === 'students' || audience_type === 'student') {
      sql += ` AND n.audience_type IN ('all', 'students')`;
    } else if (audience_type === 'group') {
      sql += ` AND n.audience_type = 'group'`;
    } else if (audience_type === 'all') {
      sql += ` AND n.audience_type = 'all'`;
    }

    if (group_id) {
      sql += ` AND (n.group_id = ? OR n.group_id IS NULL)`;
      params.push(group_id);
    }

    if (subject_id) {
      sql += ` AND (n.subject_id = ? OR n.subject_id IS NULL)`;
      params.push(subject_id);
    }

    sql += ` ORDER BY n.created_at DESC`;

    const [rows] = await db.execute(sql, params);

    const formattedRows = rows.map((row) => ({
      ...row,
      semester: row.level_name,
      section_name: row.level_name,
    }));

    res.json(formattedRows);
  } catch (err) {
    console.error('Get notices error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getStudentNotices = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.execute(
      `
      SELECT 
        n.*,
        u.name AS created_by_name,

        sg.group_id AS student_group_id,

        cl.level_name,
        c.course_name,

        s.subject_name

      FROM student_groups sg

      INNER JOIN notices n
        ON (
          n.audience_type = 'all'
          OR n.audience_type = 'students'
          OR (
            n.audience_type = 'group'
            AND n.group_id = sg.group_id
          )
        )

      LEFT JOIN users u
        ON n.created_by = u.id

      LEFT JOIN course_levels cl
        ON cl.id = n.group_id

      LEFT JOIN courses c
        ON c.id = cl.course_id

      LEFT JOIN subjects s
        ON s.id = n.subject_id

      WHERE sg.student_id = ?

      ORDER BY n.created_at DESC
      `,
      [userId]
    );

    const formattedRows = rows.map((row) => ({
      ...row,
      semester: row.level_name,
      section_name: row.level_name,
    }));

    res.json(formattedRows);
  } catch (err) {
    console.error('Get student notices error:', err);
    res.status(500).json({
      message: 'Failed to fetch student notices',
      error: err.message,
    });
  }
};

exports.createNotice = async (req, res) => {
  try {
    const {
      title,
      message,
      audience_type = 'all',
      group_id = null,
      group_ids = [],
      subject_id = null,
      created_by,
      publish_date = null,
    } = req.body;

    const creatorId = created_by || req.user?.id;

    if (!title || !message) {
      return res.status(400).json({
        message: 'Title and message are required',
      });
    }

    const validAudienceTypes = ['all', 'faculty', 'students', 'group'];

    if (!validAudienceTypes.includes(audience_type)) {
      return res.status(400).json({
        message: 'Invalid audience type',
      });
    }

    /*
      1. All Campus Notice
      Visible to everyone.
    */
    if (audience_type === 'all') {
      await db.execute(
        `
        INSERT INTO notices 
        (title, message, audience_type, group_id, subject_id, created_by, publish_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          title,
          message,
          'all',
          null,
          subject_id || null,
          creatorId,
          publish_date || null,
        ]
      );

      await createNotification({
        user_id: null,
        role: 'student',
        title: 'New Campus Notice',
        message: title,
        type: 'notice',
      });

      await createNotification({
        user_id: null,
        role: 'faculty',
        title: 'New Campus Notice',
        message: title,
        type: 'notice',
      });

      await createNotification({
        user_id: null,
        role: 'admin',
        title: 'New Campus Notice',
        message: title,
        type: 'notice',
      });

      return res.status(201).json({
        message: 'Campus-wide notice created successfully',
      });
    }

    /*
      2. Faculty Only Notice
      Visible only to faculty.
    */
    if (audience_type === 'faculty') {
      await db.execute(
        `
        INSERT INTO notices 
        (title, message, audience_type, group_id, subject_id, created_by, publish_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          title,
          message,
          'faculty',
          null,
          subject_id || null,
          creatorId,
          publish_date || null,
        ]
      );

      await createNotification({
        user_id: null,
        role: 'faculty',
        title: 'New Faculty Notice',
        message: title,
        type: 'notice',
      });

      return res.status(201).json({
        message: 'Faculty notice created successfully',
      });
    }

    /*
      3. Students Only Notice
      Visible to all students.
    */
    if (audience_type === 'students') {
      await db.execute(
        `
        INSERT INTO notices 
        (title, message, audience_type, group_id, subject_id, created_by, publish_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          title,
          message,
          'students',
          null,
          subject_id || null,
          creatorId,
          publish_date || null,
        ]
      );

      await createNotification({
        user_id: null,
        role: 'student',
        title: 'New Student Notice',
        message: title,
        type: 'notice',
      });

      return res.status(201).json({
        message: 'Students notice created successfully',
      });
    }

    /*
      4. Group / Level Notice
      Visible to selected student groups.
    */
    const selectedGroups =
      Array.isArray(group_ids) && group_ids.length > 0
        ? group_ids
        : group_id
          ? [group_id]
          : [];

    if (selectedGroups.length === 0) {
      return res.status(400).json({
        message: 'Please select at least one group',
      });
    }

    const values = selectedGroups.map((selectedGroupId) => [
      title,
      message,
      'group',
      selectedGroupId,
      subject_id || null,
      creatorId,
      publish_date || null,
    ]);

    await db.query(
      `
      INSERT INTO notices 
      (title, message, audience_type, group_id, subject_id, created_by, publish_date)
      VALUES ?
      `,
      [values]
    );

    const [studentRows] = await db.query(
      `
      SELECT DISTINCT student_id
      FROM student_groups
      WHERE group_id IN (?)
      `,
      [selectedGroups]
    );

    const studentIds = studentRows.map((row) => row.student_id);

    await createNotificationForUsers({
      userIds: studentIds,
      role: 'student',
      title: 'New Group Notice',
      message: title,
      type: 'notice',
    });

    return res.status(201).json({
      message:
        selectedGroups.length === 1
          ? 'Group notice created successfully'
          : `Notice created for ${selectedGroups.length} groups successfully`,
    });
  } catch (err) {
    console.error('Create notice error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateNotice = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      message,
      audience_type = 'all',
      group_id = null,
      subject_id = null,
      publish_date = null,
    } = req.body;

    const validAudienceTypes = ['all', 'faculty', 'students', 'group'];

    if (!validAudienceTypes.includes(audience_type)) {
      return res.status(400).json({
        message: 'Invalid audience type',
      });
    }

    await db.execute(
      `
      UPDATE notices
      SET title = ?, message = ?, audience_type = ?, group_id = ?, subject_id = ?, publish_date = ?
      WHERE id = ?
      `,
      [
        title,
        message,
        audience_type,
        audience_type === 'group' ? group_id || null : null,
        subject_id || null,
        publish_date || null,
        id,
      ]
    );

    if (audience_type === 'faculty') {
      await createNotification({
        user_id: null,
        role: 'faculty',
        title: 'Faculty Notice Updated',
        message: title,
        type: 'notice',
      });
    } else if (audience_type === 'students' || audience_type === 'group') {
      await createNotification({
        user_id: null,
        role: 'student',
        title: 'Notice Updated',
        message: title,
        type: 'notice',
      });
    } else {
      await createNotification({
        user_id: null,
        role: 'student',
        title: 'Campus Notice Updated',
        message: title,
        type: 'notice',
      });

      await createNotification({
        user_id: null,
        role: 'faculty',
        title: 'Campus Notice Updated',
        message: title,
        type: 'notice',
      });
    }

    res.json({ message: 'Notice updated successfully' });
  } catch (err) {
    console.error('Update notice error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute(`DELETE FROM notices WHERE id = ?`, [id]);

    res.json({ message: 'Notice deleted successfully' });
  } catch (err) {
    console.error('Delete notice error:', err);
    res.status(500).json({ message: err.message });
  }
};