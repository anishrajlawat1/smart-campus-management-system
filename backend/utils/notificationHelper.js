const db = require('../config/db');

const createNotification = async ({
  user_id = null,
  role,
  title,
  message,
  type = 'general',
}) => {
  try {
    if (!role || !title || !message) return;

    await db.execute(
      `
      INSERT INTO notifications
      (user_id, role, title, message, type)
      VALUES (?, ?, ?, ?, ?)
      `,
      [user_id || null, role, title, message, type]
    );
  } catch (error) {
    console.error('Create notification helper error:', error.message);
  }
};

const createNotificationForUsers = async ({
  userIds = [],
  role,
  title,
  message,
  type = 'general',
}) => {
  try {
    if (!Array.isArray(userIds) || userIds.length === 0) return;
    if (!role || !title || !message) return;

    const uniqueUserIds = [...new Set(userIds.filter(Boolean))];

    if (uniqueUserIds.length === 0) return;

    const values = uniqueUserIds.map((userId) => [
      userId,
      role,
      title,
      message,
      type,
    ]);

    await db.query(
      `
      INSERT INTO notifications
      (user_id, role, title, message, type)
      VALUES ?
      `,
      [values]
    );
  } catch (error) {
    console.error('Create notifications for users error:', error.message);
  }
};

const createNotificationForRoles = async ({
  roles = [],
  title,
  message,
  type = 'general',
}) => {
  try {
    if (!Array.isArray(roles) || roles.length === 0) return;
    if (!title || !message) return;

    const uniqueRoles = [...new Set(roles.filter(Boolean))];

    for (const role of uniqueRoles) {
      await createNotification({
        user_id: null,
        role,
        title,
        message,
        type,
      });
    }
  } catch (error) {
    console.error('Create notifications for roles error:', error.message);
  }
};

const createNotificationForGroupStudents = async ({
  groupId,
  title,
  message,
  type = 'general',
}) => {
  try {
    if (!groupId || !title || !message) return;

    const [rows] = await db.execute(
      `
      SELECT DISTINCT student_id
      FROM student_groups
      WHERE group_id = ?
      `,
      [groupId]
    );

    const studentIds = rows.map((row) => row.student_id);

    await createNotificationForUsers({
      userIds: studentIds,
      role: 'student',
      title,
      message,
      type,
    });
  } catch (error) {
    console.error('Create group student notifications error:', error.message);
  }
};

module.exports = {
  createNotification,
  createNotificationForUsers,
  createNotificationForRoles,
  createNotificationForGroupStudents,
};