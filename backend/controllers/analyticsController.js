const db = require('../config/db');

const safeQuery = async (sql, params = [], fallback = []) => {
  try {
    const [rows] = await db.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Analytics query failed:', error.message);
    return fallback;
  }
};

const safeSingle = async (sql, params = [], fallback = { total: 0 }) => {
  const rows = await safeQuery(sql, params, [fallback]);
  return rows[0] || fallback;
};

exports.getAnalyticsSummary = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const totalUsers = await safeSingle('SELECT COUNT(*) AS total FROM users');
    const totalStudents = await safeSingle("SELECT COUNT(*) AS total FROM users WHERE role = 'student'");
    const totalFaculty = await safeSingle("SELECT COUNT(*) AS total FROM users WHERE role = 'faculty'");
    const totalAdmins = await safeSingle("SELECT COUNT(*) AS total FROM users WHERE role = 'admin'");

    const totalAttendance = await safeSingle('SELECT COUNT(*) AS total FROM attendance');
    const presentCount = await safeSingle("SELECT COUNT(*) AS total FROM attendance WHERE status = 'present'");
    const absentCount = await safeSingle("SELECT COUNT(*) AS total FROM attendance WHERE status = 'absent'");
    const lateCount = await safeSingle("SELECT COUNT(*) AS total FROM attendance WHERE status = 'late'");

    const todayAttendance = await safeSingle(
      `SELECT COUNT(*) AS total FROM attendance WHERE DATE(date) = ?`,
      [today]
    );

    const totalNotices = await safeSingle('SELECT COUNT(*) AS total FROM notices');
    const totalEvents = await safeSingle('SELECT COUNT(*) AS total FROM events');

    const todayEvents = await safeSingle(
      `SELECT COUNT(*) AS total FROM events WHERE DATE(start_datetime) = ?`,
      [today]
    );

    const upcomingEventsCount = await safeSingle(
      `SELECT COUNT(*) AS total FROM events WHERE start_datetime >= NOW()`
    );

    const totalLostFound = await safeSingle('SELECT COUNT(*) AS total FROM lost_found');
    const openLostFound = await safeSingle("SELECT COUNT(*) AS total FROM lost_found WHERE status = 'open'");
    const resolvedLostFound = await safeSingle("SELECT COUNT(*) AS total FROM lost_found WHERE status = 'resolved'");

    const unreadNotifications = await safeSingle(
      `
      SELECT COUNT(*) AS total
      FROM notifications
      WHERE role = 'admin'
      AND is_read = 0
      `
    );

    const totalExams = await safeSingle(`SELECT COUNT(*) AS total FROM exams`);

    const todayExams = await safeSingle(
      `SELECT COUNT(*) AS total FROM exams WHERE exam_date = ?`,
      [today]
    );

    const upcomingExams = await safeSingle(
      `SELECT COUNT(*) AS total FROM exams WHERE exam_date >= ?`,
      [today]
    );

    const assignedExamRooms = await safeSingle(`SELECT COUNT(*) AS total FROM exam_rooms`);

    const assignedInvigilators = await safeSingle(
      `
      SELECT COUNT(DISTINCT invigilator_id) AS total
      FROM exam_rooms
      WHERE invigilator_id IS NOT NULL
      `
    );

    const allocatedExamStudents = await safeSingle(`SELECT COUNT(*) AS total FROM exam_seating`);

    const attendancePercentage =
      totalAttendance.total > 0
        ? Math.round(((Number(presentCount.total) + Number(lateCount.total)) / Number(totalAttendance.total)) * 100)
        : 0;

    const recentNotices = await safeQuery(
      `
      SELECT
        n.id,
        n.title,
        n.message,
        n.audience_type,
        n.created_at,
        u.name AS created_by_name
      FROM notices n
      LEFT JOIN users u ON n.created_by = u.id
      ORDER BY n.created_at DESC
      LIMIT 5
      `
    );

    const upcomingEvents = await safeQuery(
      `
      SELECT
        e.id,
        e.title,
        e.event_type,
        e.venue,
        e.start_datetime,
        e.end_datetime,
        e.audience_type,
        u.name AS organizer_name
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      WHERE e.start_datetime >= NOW()
      ORDER BY e.start_datetime ASC
      LIMIT 5
      `
    );

    const upcomingExamList = await safeQuery(
      `
      SELECT
        e.id,
        e.exam_name,
        e.course_name,
        e.level_name,
        e.exam_date,
        e.start_time,
        e.end_time,
        s.subject_name,
        COUNT(DISTINCT er.id) AS room_count,
        COUNT(DISTINCT er.invigilator_id) AS invigilator_count,
        COUNT(DISTINCT es.student_id) AS student_count
      FROM exams e
      LEFT JOIN subjects s ON s.id = e.subject_id
      LEFT JOIN exam_rooms er ON er.exam_id = e.id
      LEFT JOIN exam_seating es ON es.exam_id = e.id
      WHERE e.exam_date >= ?
      GROUP BY
        e.id,
        e.exam_name,
        e.course_name,
        e.level_name,
        e.exam_date,
        e.start_time,
        e.end_time,
        s.subject_name
      ORDER BY e.exam_date ASC, e.start_time ASC
      LIMIT 5
      `,
      [today]
    );

    const todayExamList = await safeQuery(
      `
      SELECT
        e.id,
        e.exam_name,
        e.course_name,
        e.level_name,
        e.exam_date,
        e.start_time,
        e.end_time,
        s.subject_name,
        COUNT(DISTINCT er.id) AS room_count,
        COUNT(DISTINCT er.invigilator_id) AS invigilator_count,
        COUNT(DISTINCT es.student_id) AS student_count
      FROM exams e
      LEFT JOIN subjects s ON s.id = e.subject_id
      LEFT JOIN exam_rooms er ON er.exam_id = e.id
      LEFT JOIN exam_seating es ON es.exam_id = e.id
      WHERE e.exam_date = ?
      GROUP BY
        e.id,
        e.exam_name,
        e.course_name,
        e.level_name,
        e.exam_date,
        e.start_time,
        e.end_time,
        s.subject_name
      ORDER BY e.start_time ASC
      LIMIT 5
      `,
      [today]
    );

    const examRoomList = await safeQuery(
      `
      SELECT
        er.id,
        er.room_name,
        er.capacity,
        e.exam_name,
        e.exam_date,
        e.start_time,
        e.end_time,
        s.subject_name,
        u.name AS invigilator_name,
        COUNT(es.id) AS assigned_students
      FROM exam_rooms er
      JOIN exams e ON e.id = er.exam_id
      LEFT JOIN subjects s ON s.id = e.subject_id
      LEFT JOIN users u ON u.id = er.invigilator_id
      LEFT JOIN exam_seating es ON es.room_id = er.id
      WHERE e.exam_date >= ?
      GROUP BY
        er.id,
        er.room_name,
        er.capacity,
        e.exam_name,
        e.exam_date,
        e.start_time,
        e.end_time,
        s.subject_name,
        u.name
      ORDER BY e.exam_date ASC, e.start_time ASC, er.room_name ASC
      LIMIT 6
      `,
      [today]
    );

    const recentLostFound = await safeQuery(
      `
      SELECT
        lf.id,
        lf.item_type,
        lf.title,
        lf.location,
        lf.collection_point,
        lf.status,
        lf.created_at,
        u.name AS reported_by_name
      FROM lost_found lf
      LEFT JOIN users u ON lf.reported_by = u.id
      ORDER BY lf.created_at DESC
      LIMIT 5
      `
    );

    const lowAttendanceStudents = await safeQuery(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        gt.course_name,
        gt.semester,
        gt.section_name,
        COUNT(a.id) AS total_classes,
        SUM(CASE WHEN a.status IN ('present', 'late') THEN 1 ELSE 0 END) AS attended_classes,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent_classes,
        ROUND(
          (SUM(CASE WHEN a.status IN ('present', 'late') THEN 1 ELSE 0 END) / COUNT(a.id)) * 100,
          2
        ) AS attendance_percentage
      FROM users u
      INNER JOIN attendance a ON a.student_id = u.id
      LEFT JOIN groups_table gt ON gt.id = a.group_id
      WHERE u.role = 'student'
      GROUP BY u.id, u.name, u.email, gt.course_name, gt.semester, gt.section_name
      HAVING attendance_percentage < 75
      ORDER BY attendance_percentage ASC
      LIMIT 10
      `
    );

    const lowAttendanceSubjects = await safeQuery(
      `
      SELECT
        s.id AS subject_id,
        s.subject_name,
        gt.course_name,
        gt.semester,
        gt.section_name,
        COUNT(DISTINCT a.student_id) AS total_students,
        SUM(
          CASE
            WHEN student_summary.attendance_percentage < 75 THEN 1
            ELSE 0
          END
        ) AS risk_students,
        ROUND(AVG(student_summary.attendance_percentage), 2) AS average_attendance
      FROM (
        SELECT
          a.student_id,
          a.subject_id,
          a.group_id,
          ROUND(
            (SUM(CASE WHEN a.status IN ('present', 'late') THEN 1 ELSE 0 END) / COUNT(a.id)) * 100,
            2
          ) AS attendance_percentage
        FROM attendance a
        GROUP BY a.student_id, a.subject_id, a.group_id
      ) student_summary
      JOIN attendance a
        ON a.student_id = student_summary.student_id
        AND a.subject_id = student_summary.subject_id
        AND a.group_id = student_summary.group_id
      JOIN subjects s ON s.id = student_summary.subject_id
      JOIN groups_table gt ON gt.id = student_summary.group_id
      GROUP BY s.id, s.subject_name, gt.course_name, gt.semester, gt.section_name
      HAVING risk_students > 0
      ORDER BY risk_students DESC, average_attendance ASC
      LIMIT 10
      `
    );

    const lowAttendanceGroups = await safeQuery(
      `
      SELECT
        gt.id AS group_id,
        gt.course_name,
        gt.semester,
        gt.section_name,
        COUNT(DISTINCT student_summary.student_id) AS students_with_attendance,
        SUM(
          CASE
            WHEN student_summary.attendance_percentage < 75 THEN 1
            ELSE 0
          END
        ) AS risk_students,
        ROUND(AVG(student_summary.attendance_percentage), 2) AS average_attendance
      FROM (
        SELECT
          a.student_id,
          a.group_id,
          ROUND(
            (SUM(CASE WHEN a.status IN ('present', 'late') THEN 1 ELSE 0 END) / COUNT(a.id)) * 100,
            2
          ) AS attendance_percentage
        FROM attendance a
        GROUP BY a.student_id, a.group_id
      ) student_summary
      JOIN groups_table gt ON gt.id = student_summary.group_id
      GROUP BY gt.id, gt.course_name, gt.semester, gt.section_name
      HAVING risk_students > 0
      ORDER BY risk_students DESC, average_attendance ASC
      LIMIT 10
      `
    );

    const totalLowAttendanceStudents = await safeSingle(
      `
      SELECT COUNT(*) AS total
      FROM (
        SELECT
          a.student_id,
          ROUND(
            (SUM(CASE WHEN a.status IN ('present', 'late') THEN 1 ELSE 0 END) / COUNT(a.id)) * 100,
            2
          ) AS attendance_percentage
        FROM attendance a
        GROUP BY a.student_id
        HAVING attendance_percentage < 75
      ) risk
      `
    );

    const recentActivity = await safeQuery(
      `
      SELECT
        id,
        title,
        message,
        type,
        created_at
      FROM notifications
      WHERE role = 'admin'
      ORDER BY created_at DESC
      LIMIT 6
      `
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
        today: todayAttendance.total,
        percentage: attendancePercentage,
        lowRiskTotal: totalLowAttendanceStudents.total,
      },

      notices: {
        total: totalNotices.total,
        recent: recentNotices,
      },

      events: {
        total: totalEvents.total,
        today: todayEvents.total,
        upcoming: upcomingEventsCount.total,
        upcomingList: upcomingEvents,
      },

      exams: {
        total: totalExams.total,
        today: todayExams.total,
        upcoming: upcomingExams.total,
        assignedRooms: assignedExamRooms.total,
        assignedInvigilators: assignedInvigilators.total,
        allocatedStudents: allocatedExamStudents.total,
        todayList: todayExamList,
        upcomingList: upcomingExamList,
        roomList: examRoomList,
      },

      lostFound: {
        total: totalLostFound.total,
        open: openLostFound.total,
        resolved: resolvedLostFound.total,
        recent: recentLostFound,
      },

      notifications: {
        unread: unreadNotifications.total,
        recentActivity,
      },

      lowAttendanceStudents,
      lowAttendanceSubjects,
      lowAttendanceGroups,
    });
  } catch (err) {
    console.error('Analytics summary error:', err);
    res.status(500).json({ message: err.message });
  }
};