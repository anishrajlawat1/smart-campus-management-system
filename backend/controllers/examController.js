const db = require('../config/db');

const {
  createNotification,
  createNotificationForUsers,
} = require('../utils/notificationHelper');

const mixStudentsByGroup = (students) => {
  const groups = {};

  students.forEach((student) => {
    const key = String(student.group_id);

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(student);
  });

  const groupKeys = Object.keys(groups);
  const mixed = [];

  let stillHasStudents = true;

  while (stillHasStudents) {
    stillHasStudents = false;

    for (const key of groupKeys) {
      if (groups[key].length > 0) {
        mixed.push(groups[key].shift());
        stillHasStudents = true;
      }
    }
  }

  return mixed;
};

const hasTimeOverlap = `(? < e.end_time AND ? > e.start_time)`;
const hasRoutineOverlap = `(cr.start_time < ? AND cr.end_time > ?)`;

const getExamById = async (examId, connection = db) => {
  const [[exam]] = await connection.execute(
    `
    SELECT
      e.*,
      s.subject_name
    FROM exams e
    LEFT JOIN subjects s
      ON s.id = e.subject_id
    WHERE e.id = ?
    `,
    [examId]
  );

  return exam;
};

const checkExamScheduleConflict = async ({
  course_name,
  level_name,
  exam_date,
  start_time,
  end_time,
  excludeExamId = null,
}) => {
  let excludeSql = '';
  const params = [course_name, level_name, exam_date, start_time, end_time];

  if (excludeExamId) {
    excludeSql = ' AND id != ?';
    params.push(excludeExamId);
  }

  const [conflicts] = await db.execute(
    `
    SELECT exam_name, exam_date, start_time, end_time
    FROM exams
    WHERE course_name = ?
      AND level_name = ?
      AND exam_date = ?
      AND (? < end_time AND ? > start_time)
      ${excludeSql}
    LIMIT 1
    `,
    params
  );

  if (conflicts.length > 0) {
    const conflict = conflicts[0];

    return `${course_name} ${level_name} already has "${conflict.exam_name}" on ${conflict.exam_date} from ${String(
      conflict.start_time
    ).slice(0, 5)} to ${String(conflict.end_time).slice(0, 5)}.`;
  }

  return null;
};

const checkRoomConflict = async ({
  exam_id,
  room_name,
  exam_date,
  start_time,
  end_time,
  excludeRoomId = null,
}) => {
  const params = [room_name, exam_date, start_time, end_time];

  let excludeSql = '';

  if (excludeRoomId) {
    excludeSql = ' AND er.id != ?';
    params.push(excludeRoomId);
  }

  const [conflicts] = await db.execute(
    `
    SELECT
      er.id,
      er.exam_id,
      er.room_name,
      e.exam_name,
      e.exam_date,
      e.start_time,
      e.end_time
    FROM exam_rooms er
    JOIN exams e
      ON e.id = er.exam_id
    WHERE LOWER(er.room_name) = LOWER(?)
      AND e.exam_date = ?
      AND ${hasTimeOverlap}
      ${excludeSql}
    LIMIT 1
    `,
    params
  );

  if (conflicts.length > 0) {
    const conflict = conflicts[0];

    if (Number(conflict.exam_id) === Number(exam_id)) {
      return `${room_name} is already added for this exam.`;
    }

    return `${room_name} is already booked for "${conflict.exam_name}" from ${String(
      conflict.start_time
    ).slice(0, 5)} to ${String(conflict.end_time).slice(0, 5)}.`;
  }

  return null;
};

const checkInvigilatorConflict = async ({
  invigilator_id,
  exam_date,
  start_time,
  end_time,
  excludeRoomId = null,
}) => {
  if (!invigilator_id) return null;

  const [[faculty]] = await db.execute(
    `
    SELECT id, name
    FROM users
    WHERE id = ?
      AND role = 'faculty'
    `,
    [invigilator_id]
  );

  if (!faculty) {
    return 'Selected invigilator must be a faculty member.';
  }

  let excludeSql = '';
  const examParams = [invigilator_id, exam_date, start_time, end_time];

  if (excludeRoomId) {
    excludeSql = ' AND er.id != ?';
    examParams.push(excludeRoomId);
  }

  const [examConflicts] = await db.execute(
    `
    SELECT
      e.exam_name,
      er.room_name,
      e.exam_date,
      e.start_time,
      e.end_time
    FROM exam_rooms er
    JOIN exams e
      ON e.id = er.exam_id
    WHERE er.invigilator_id = ?
      AND e.exam_date = ?
      AND ${hasTimeOverlap}
      ${excludeSql}
    LIMIT 1
    `,
    examParams
  );

  if (examConflicts.length > 0) {
    const conflict = examConflicts[0];

    return `${faculty.name} is already assigned as invigilator for "${conflict.exam_name}" in ${conflict.room_name} from ${String(
      conflict.start_time
    ).slice(0, 5)} to ${String(conflict.end_time).slice(0, 5)}.`;
  }

  const dayName = new Date(exam_date).toLocaleDateString('en-US', {
    weekday: 'long',
  });

  const [routineConflicts] = await db.execute(
    `
    SELECT
      cr.day_of_week,
      cr.start_time,
      cr.end_time,
      cr.room,
      s.subject_name,
      gt.course_name,
      gt.semester,
      gt.section_name
    FROM class_routines cr
    JOIN subjects s
      ON s.id = cr.subject_id
    JOIN groups_table gt
      ON gt.id = cr.group_id
    WHERE cr.faculty_id = ?
      AND cr.day_of_week = ?
      AND ${hasRoutineOverlap}
    LIMIT 1
    `,
    [invigilator_id, dayName, end_time, start_time]
  );

  if (routineConflicts.length > 0) {
    const conflict = routineConflicts[0];

    return `${faculty.name} has a class routine on ${dayName} from ${String(
      conflict.start_time
    ).slice(0, 5)} to ${String(conflict.end_time).slice(0, 5)} for ${
      conflict.subject_name
    }.`;
  }

  return null;
};

const findAvailableInvigilator = async ({ exam_date, start_time, end_time }) => {
  const [facultyRows] = await db.execute(
    `
    SELECT id, name
    FROM users
    WHERE role = 'faculty'
    ORDER BY name
    `
  );

  for (const faculty of facultyRows) {
    const conflict = await checkInvigilatorConflict({
      invigilator_id: faculty.id,
      exam_date,
      start_time,
      end_time,
    });

    if (!conflict) {
      return faculty.id;
    }
  }

  return null;
};

exports.getExams = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `
      SELECT
        e.*,
        s.subject_name,
        COUNT(DISTINCT er.id) AS room_count,
        COUNT(DISTINCT es.id) AS student_count
      FROM exams e
      LEFT JOIN subjects s
        ON s.id = e.subject_id
      LEFT JOIN exam_rooms er
        ON er.exam_id = e.id
      LEFT JOIN exam_seating es
        ON es.exam_id = e.id
      GROUP BY
        e.id,
        e.exam_name,
        e.subject_id,
        e.course_name,
        e.level_name,
        e.exam_date,
        e.start_time,
        e.end_time,
        e.created_at,
        s.subject_name
      ORDER BY e.exam_date DESC, e.start_time DESC
      `
    );

    res.json(rows);
  } catch (err) {
    console.error('Get exams error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getExamDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await getExamById(id);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const [rooms] = await db.execute(
      `
      SELECT
        er.id,
        er.exam_id,
        er.room_name,
        er.capacity,
        er.invigilator_id,
        u.name AS invigilator_name,
        u.email AS invigilator_email,
        COUNT(es.id) AS assigned_count
      FROM exam_rooms er
      LEFT JOIN users u
        ON u.id = er.invigilator_id
      LEFT JOIN exam_seating es
        ON es.room_id = er.id
      WHERE er.exam_id = ?
      GROUP BY
        er.id,
        er.exam_id,
        er.room_name,
        er.capacity,
        er.invigilator_id,
        u.name,
        u.email
      ORDER BY er.room_name
      `,
      [id]
    );

    const [seating] = await db.execute(
      `
      SELECT
        es.id,
        es.exam_id,
        es.room_id,
        es.student_id,
        es.seat_number,
        es.attendance_status,
        er.room_name,
        inv.name AS invigilator_name,
        u.name AS student_name,
        u.email AS student_email,
        gt.course_name,
        gt.semester,
        gt.section_name,
        sg.group_id
      FROM exam_seating es
      JOIN exam_rooms er
        ON er.id = es.room_id
      LEFT JOIN users inv
        ON inv.id = er.invigilator_id
      JOIN users u
        ON u.id = es.student_id
      LEFT JOIN student_groups sg
        ON sg.student_id = u.id
      LEFT JOIN groups_table gt
        ON gt.id = sg.group_id
      WHERE es.exam_id = ?
      ORDER BY er.room_name, es.seat_number
      `,
      [id]
    );

    res.json({
      exam,
      rooms,
      seating,
    });
  } catch (err) {
    console.error('Get exam details error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.createExam = async (req, res) => {
  try {
    const {
      exam_name,
      course_name,
      level_name,
      subject_id,
      exam_date,
      start_time,
      end_time,
    } = req.body;

    if (
      !exam_name ||
      !course_name ||
      !level_name ||
      !subject_id ||
      !exam_date ||
      !start_time ||
      !end_time
    ) {
      return res.status(400).json({
        message:
          'Exam name, course, level, subject, date, start time, and end time are required',
      });
    }

    if (String(start_time) >= String(end_time)) {
      return res.status(400).json({
        message: 'End time must be after start time',
      });
    }

    const scheduleConflict = await checkExamScheduleConflict({
      course_name,
      level_name,
      exam_date,
      start_time,
      end_time,
    });

    if (scheduleConflict) {
      return res.status(400).json({
        message: `Exam time clash: ${scheduleConflict}`,
      });
    }

    const [eligibleGroups] = await db.execute(
      `
      SELECT gt.id
      FROM groups_table gt
      INNER JOIN group_subjects gs
        ON gs.group_id = gt.id
      WHERE gt.course_name = ?
        AND gt.semester = ?
        AND gs.subject_id = ?
      `,
      [course_name, level_name, subject_id]
    );

    if (eligibleGroups.length === 0) {
      return res.status(400).json({
        message:
          'No section found for this course, level, and subject combination',
      });
    }

    await db.execute(
      `
      INSERT INTO exams
      (exam_name, course_name, level_name, subject_id, exam_date, start_time, end_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        exam_name,
        course_name,
        level_name,
        subject_id,
        exam_date,
        start_time,
        end_time,
      ]
    );

    await createNotification({
      role: 'admin',
      title: 'Exam Created',
      message: `${exam_name} has been scheduled for ${course_name} ${level_name}.`,
      type: 'exam',
    });

    res.status(201).json({
      message: 'Exam created successfully',
    });
  } catch (err) {
    console.error('Create exam error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateExam = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      exam_name,
      course_name,
      level_name,
      subject_id,
      exam_date,
      start_time,
      end_time,
    } = req.body;

    if (
      !exam_name ||
      !course_name ||
      !level_name ||
      !subject_id ||
      !exam_date ||
      !start_time ||
      !end_time
    ) {
      return res.status(400).json({
        message:
          'Exam name, course, level, subject, date, start time, and end time are required',
      });
    }

    if (String(start_time) >= String(end_time)) {
      return res.status(400).json({
        message: 'End time must be after start time',
      });
    }

    const scheduleConflict = await checkExamScheduleConflict({
      course_name,
      level_name,
      exam_date,
      start_time,
      end_time,
      excludeExamId: id,
    });

    if (scheduleConflict) {
      return res.status(400).json({
        message: `Exam time clash: ${scheduleConflict}`,
      });
    }

    const [rooms] = await db.execute(
      `
      SELECT id, room_name, invigilator_id
      FROM exam_rooms
      WHERE exam_id = ?
      `,
      [id]
    );

    for (const room of rooms) {
      const roomConflict = await checkRoomConflict({
        exam_id: id,
        room_name: room.room_name,
        exam_date,
        start_time,
        end_time,
        excludeRoomId: room.id,
      });

      if (roomConflict) {
        return res.status(400).json({
          message: `Room clash after exam update: ${roomConflict}`,
        });
      }

      if (room.invigilator_id) {
        const invigilatorConflict = await checkInvigilatorConflict({
          invigilator_id: room.invigilator_id,
          exam_date,
          start_time,
          end_time,
          excludeRoomId: room.id,
        });

        if (invigilatorConflict) {
          return res.status(400).json({
            message: `Invigilator clash after exam update: ${invigilatorConflict}`,
          });
        }
      }
    }

    await db.execute(
      `
      UPDATE exams
      SET exam_name = ?,
          course_name = ?,
          level_name = ?,
          subject_id = ?,
          exam_date = ?,
          start_time = ?,
          end_time = ?
      WHERE id = ?
      `,
      [
        exam_name,
        course_name,
        level_name,
        subject_id,
        exam_date,
        start_time,
        end_time,
        id,
      ]
    );

    await db.execute(
      `
      DELETE FROM exam_seating
      WHERE exam_id = ?
      `,
      [id]
    );

    await createNotification({
      role: 'admin',
      title: 'Exam Updated',
      message: `${exam_name} was updated. Existing seating was cleared and must be regenerated.`,
      type: 'exam',
    });

    res.json({
      message: 'Exam updated successfully. Existing seating was cleared.',
    });
  } catch (err) {
    console.error('Update exam error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteExam = async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute(
      `
      DELETE FROM exams
      WHERE id = ?
      `,
      [id]
    );

    res.json({
      message: 'Exam deleted successfully',
    });
  } catch (err) {
    console.error('Delete exam error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.addExamRoom = async (req, res) => {
  try {
    const { id } = req.params;
    let { room_name, capacity, invigilator_id = null } = req.body;

    if (!room_name || !capacity) {
      return res.status(400).json({
        message: 'Room name and capacity are required',
      });
    }

    if (Number(capacity) <= 0) {
      return res.status(400).json({
        message: 'Capacity must be greater than 0',
      });
    }

    const exam = await getExamById(id);

    if (!exam) {
      return res.status(404).json({
        message: 'Exam not found',
      });
    }

    const roomConflict = await checkRoomConflict({
      exam_id: id,
      room_name,
      exam_date: exam.exam_date,
      start_time: exam.start_time,
      end_time: exam.end_time,
    });

    if (roomConflict) {
      return res.status(400).json({
        message: roomConflict,
      });
    }

    if (!invigilator_id) {
      invigilator_id = await findAvailableInvigilator({
        exam_date: exam.exam_date,
        start_time: exam.start_time,
        end_time: exam.end_time,
      });

      if (!invigilator_id) {
        return res.status(400).json({
          message:
            'No available faculty invigilator found for this exam time. Please adjust the time or add more faculty.',
        });
      }
    }

    const invigilatorConflict = await checkInvigilatorConflict({
      invigilator_id,
      exam_date: exam.exam_date,
      start_time: exam.start_time,
      end_time: exam.end_time,
    });

    if (invigilatorConflict) {
      return res.status(400).json({
        message: invigilatorConflict,
      });
    }

    await db.execute(
      `
      INSERT INTO exam_rooms
      (exam_id, room_name, capacity, invigilator_id)
      VALUES (?, ?, ?, ?)
      `,
      [id, room_name, Number(capacity), invigilator_id]
    );

    res.status(201).json({
      message: 'Exam room added successfully',
    });
  } catch (err) {
    console.error('Add exam room error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteExamRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    await db.execute(
      `
      DELETE FROM exam_rooms
      WHERE id = ?
      `,
      [roomId]
    );

    res.json({
      message: 'Exam room deleted successfully',
    });
  } catch (err) {
    console.error('Delete exam room error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.generateSeating = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;
    const { group_ids = [] } = req.body;

    if (!Array.isArray(group_ids) || group_ids.length === 0) {
      return res.status(400).json({
        message: 'Please select at least one eligible section',
      });
    }

    const exam = await getExamById(id, connection);

    if (!exam) {
      return res.status(404).json({
        message: 'Exam not found',
      });
    }

    const [rooms] = await connection.execute(
      `
      SELECT
        er.id,
        er.exam_id,
        er.room_name,
        er.capacity,
        er.invigilator_id,
        u.name AS invigilator_name
      FROM exam_rooms er
      LEFT JOIN users u
        ON u.id = er.invigilator_id
      WHERE er.exam_id = ?
      ORDER BY er.id
      `,
      [id]
    );

    if (rooms.length === 0) {
      return res.status(400).json({
        message: 'Please add exam rooms before generating seating',
      });
    }

    const roomsWithoutInvigilator = rooms.filter(
      (room) => !room.invigilator_id
    );

    if (roomsWithoutInvigilator.length > 0) {
      return res.status(400).json({
        message:
          'All exam rooms must have an invigilator before generating seating',
      });
    }

    const placeholders = group_ids.map(() => '?').join(',');

    const [validGroups] = await connection.execute(
      `
      SELECT DISTINCT gt.id
      FROM groups_table gt
      INNER JOIN group_subjects gs
        ON gs.group_id = gt.id
      WHERE gt.course_name = ?
        AND gt.semester = ?
        AND gs.subject_id = ?
        AND gt.id IN (${placeholders})
      `,
      [exam.course_name, exam.level_name, exam.subject_id, ...group_ids]
    );

    const validGroupIds = validGroups.map((row) => String(row.id));

    const invalidGroupIds = group_ids.filter(
      (groupId) => !validGroupIds.includes(String(groupId))
    );

    if (invalidGroupIds.length > 0) {
      return res.status(400).json({
        message:
          'Some selected sections are not eligible for this course, level, and subject.',
      });
    }

    const [students] = await connection.execute(
      `
      SELECT
        u.id AS student_id,
        u.name AS student_name,
        u.email AS student_email,
        sg.group_id,
        gt.course_name,
        gt.semester,
        gt.section_name
      FROM users u
      INNER JOIN student_groups sg
        ON sg.student_id = u.id
      INNER JOIN groups_table gt
        ON gt.id = sg.group_id
      WHERE u.role = 'student'
        AND sg.group_id IN (${placeholders})
      ORDER BY sg.group_id, u.name
      `,
      group_ids
    );

    if (students.length === 0) {
      return res.status(400).json({
        message: 'No students found for selected eligible sections',
      });
    }

    const totalCapacity = rooms.reduce(
      (sum, room) => sum + Number(room.capacity || 0),
      0
    );

    if (totalCapacity < students.length) {
      return res.status(400).json({
        message: `Not enough room capacity. Selected students: ${students.length}, total room capacity: ${totalCapacity}`,
      });
    }

    const mixedStudents = mixStudentsByGroup(students);

    await connection.beginTransaction();

    await connection.execute(
      `
      DELETE FROM exam_seating
      WHERE exam_id = ?
      `,
      [id]
    );

    await connection.execute(
      `
      DELETE FROM notifications
      WHERE type IN ('exam_seat', 'exam_invigilation')
        AND message LIKE ?
      `,
      [`%${exam.exam_name}%`]
    );

    const studentNotifications = [];
    const facultyNotificationMap = new Map();

    let studentIndex = 0;

    for (const room of rooms) {
      for (
        let seat = 1;
        seat <= Number(room.capacity) && studentIndex < mixedStudents.length;
        seat++
      ) {
        const student = mixedStudents[studentIndex];

        await connection.execute(
          `
          INSERT INTO exam_seating
          (exam_id, room_id, student_id, seat_number, attendance_status)
          VALUES (?, ?, ?, ?, 'absent')
          `,
          [id, room.id, student.student_id, seat]
        );

        studentNotifications.push([
          student.student_id,
          'student',
          'Exam Seat Assigned',
          `You have been assigned ${room.room_name}, Seat ${seat} for ${exam.exam_name}.`,
          'exam_seat',
        ]);

        if (room.invigilator_id) {
          facultyNotificationMap.set(String(room.invigilator_id), {
            user_id: room.invigilator_id,
            room_name: room.room_name,
          });
        }

        studentIndex++;
      }
    }

    if (studentNotifications.length > 0) {
      await connection.query(
        `
        INSERT INTO notifications
        (user_id, role, title, message, type)
        VALUES ?
        `,
        [studentNotifications]
      );
    }

    const facultyNotifications = Array.from(
      facultyNotificationMap.values()
    ).map((item) => [
      item.user_id,
      'faculty',
      'Invigilation Assigned',
      `You are assigned to invigilate ${item.room_name} for ${exam.exam_name}.`,
      'exam_invigilation',
    ]);

    if (facultyNotifications.length > 0) {
      await connection.query(
        `
        INSERT INTO notifications
        (user_id, role, title, message, type)
        VALUES ?
        `,
        [facultyNotifications]
      );
    }

    await connection.commit();

    res.json({
      message: `${students.length} students allocated successfully. Exam seat and invigilation notifications sent.`,
    });
  } catch (err) {
    await connection.rollback();

    console.error('Generate seating error:', err);
    res.status(500).json({ message: err.message });
  } finally {
    connection.release();
  }
};

exports.updateExamAttendance = async (req, res) => {
  try {
    const { seatingId } = req.params;
    const { attendance_status } = req.body;

    if (!['present', 'absent'].includes(attendance_status)) {
      return res.status(400).json({
        message: 'Invalid attendance status',
      });
    }

    await db.execute(
      `
      UPDATE exam_seating
      SET attendance_status = ?
      WHERE id = ?
      `,
      [attendance_status, seatingId]
    );

    res.json({
      message: 'Exam attendance updated successfully',
    });
  } catch (err) {
    console.error('Update exam attendance error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getStudentExamSeats = async (req, res) => {
  try {
    const studentId = req.user.id;

    const [rows] = await db.execute(
      `
      SELECT
        e.id AS exam_id,
        e.exam_name,
        e.course_name,
        e.level_name,
        e.exam_date,
        e.start_time,
        e.end_time,
        s.subject_name,
        er.room_name,
        er.capacity,
        es.seat_number,
        es.attendance_status,
        inv.name AS invigilator_name
      FROM exam_seating es
      JOIN exams e
        ON e.id = es.exam_id
      LEFT JOIN subjects s
        ON s.id = e.subject_id
      JOIN exam_rooms er
        ON er.id = es.room_id
      LEFT JOIN users inv
        ON inv.id = er.invigilator_id
      WHERE es.student_id = ?
      ORDER BY e.exam_date ASC, e.start_time ASC
      `,
      [studentId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Get student exam seats error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getFacultyInvigilationRooms = async (req, res) => {
  try {
    const facultyId = req.user.id;

    const [rows] = await db.execute(
      `
      SELECT
        e.id AS exam_id,
        e.exam_name,
        e.course_name,
        e.level_name,
        e.exam_date,
        e.start_time,
        e.end_time,
        s.subject_name,
        er.id AS room_id,
        er.room_name,
        er.capacity,
        COUNT(es.id) AS assigned_students
      FROM exam_rooms er
      JOIN exams e
        ON e.id = er.exam_id
      LEFT JOIN subjects s
        ON s.id = e.subject_id
      LEFT JOIN exam_seating es
        ON es.room_id = er.id
      WHERE er.invigilator_id = ?
      GROUP BY
        e.id,
        e.exam_name,
        e.course_name,
        e.level_name,
        e.exam_date,
        e.start_time,
        e.end_time,
        s.subject_name,
        er.id,
        er.room_name,
        er.capacity
      ORDER BY e.exam_date ASC, e.start_time ASC
      `,
      [facultyId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Get faculty invigilation rooms error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getFacultyInvigilationStudents = async (req, res) => {
  try {
    const facultyId = req.user.id;
    const { roomId } = req.params;

    const [[room]] = await db.execute(
      `
      SELECT id
      FROM exam_rooms
      WHERE id = ?
        AND invigilator_id = ?
      `,
      [roomId, facultyId]
    );

    if (!room) {
      return res.status(403).json({
        message: 'You are not assigned as invigilator for this room',
      });
    }

    const [rows] = await db.execute(
      `
      SELECT
        es.id,
        es.seat_number,
        es.attendance_status,
        u.id AS student_id,
        u.name AS student_name,
        u.email AS student_email,
        gt.course_name,
        gt.semester,
        gt.section_name
      FROM exam_seating es
      JOIN users u
        ON u.id = es.student_id
      LEFT JOIN student_groups sg
        ON sg.student_id = u.id
      LEFT JOIN groups_table gt
        ON gt.id = sg.group_id
      WHERE es.room_id = ?
      ORDER BY es.seat_number ASC
      `,
      [roomId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Get faculty invigilation students error:', err);
    res.status(500).json({ message: err.message });
  }
};