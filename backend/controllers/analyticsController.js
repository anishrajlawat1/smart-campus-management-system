const db = require('../config/db');

exports.getAnalyticsSummary = async (req, res) => {
  try {
    const [[totalUsers]] = await db.execute(
      'SELECT COUNT(*) AS total FROM users'
    );

    const [[totalStudents]] = await db.execute(
      "SELECT COUNT(*) AS total FROM users WHERE role = 'student'"
    );

    const [[totalFaculty]] = await db.execute(
      "SELECT COUNT(*) AS total FROM users WHERE role = 'faculty'"
    );

    const [[totalAdmins]] = await db.execute(
      "SELECT COUNT(*) AS total FROM users WHERE role = 'admin'"
    );

    const [[totalAttendance]] = await db.execute(
      'SELECT COUNT(*) AS total FROM attendance'
    );

    const [[presentCount]] = await db.execute(
      "SELECT COUNT(*) AS total FROM attendance WHERE status = 'present'"
    );

    const [[absentCount]] = await db.execute(
      "SELECT COUNT(*) AS total FROM attendance WHERE status = 'absent'"
    );

    const [[lateCount]] = await db.execute(
      "SELECT COUNT(*) AS total FROM attendance WHERE status = 'late'"
    );

    const [[totalNotices]] = await db.execute(
      'SELECT COUNT(*) AS total FROM notices'
    );

    const [[totalEvents]] = await db.execute(
      'SELECT COUNT(*) AS total FROM events'
    );

    const [[totalLostFound]] = await db.execute(
      'SELECT COUNT(*) AS total FROM lost_found'
    );

    const [[resolvedLostFound]] = await db.execute(
      "SELECT COUNT(*) AS total FROM lost_found WHERE status = 'resolved'"
    );

    res.json({
      users: {
        total: totalUsers.total,
        students: totalStudents.total,
        faculty: totalFaculty.total,
        admins: totalAdmins.total,
      },
      attendance: {
        total: totalAttendance.total,
        present: presentCount.total,
        absent: absentCount.total,
        late: lateCount.total,
      },
      notices: {
        total: totalNotices.total,
      },
      events: {
        total: totalEvents.total,
      },
      lostFound: {
        total: totalLostFound.total,
        resolved: resolvedLostFound.total,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};