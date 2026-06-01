const db = require('../config/db');

const {
  createNotification,
  createNotificationForUsers,
} = require('../utils/notificationHelper');

const hasTimeOverlap = `(start_time < ? AND end_time > ?)`;

const normalizeTime = (time) => {
  if (!time) return '';
  return String(time).length === 5 ? `${time}:00` : String(time);
};

const validateRoutinePayload = ({
  group_id,
  subject_id,
  faculty_id,
  day_of_week,
  start_time,
  end_time,
  room,
}) => {
  if (
    !group_id ||
    !subject_id ||
    !faculty_id ||
    !day_of_week ||
    !start_time ||
    !end_time ||
    !room
  ) {
    return 'Required fields missing';
  }

  const normalizedStart = normalizeTime(start_time);
  const normalizedEnd = normalizeTime(end_time);

  if (normalizedStart >= normalizedEnd) {
    return 'End time must be after start time.';
  }

  return null;
};

const notifyRoutineUsers = async ({
  group_id,
  faculty_id,
  subject_id,
  day_of_week,
  start_time,
  end_time,
  room,
  action = 'created',
}) => {
  try {
    const [[subject]] = await db.execute(
      `
      SELECT subject_name
      FROM subjects
      WHERE id = ?
      `,
      [subject_id]
    );

    const [[group]] = await db.execute(
      `
      SELECT course_name, semester, section_name
      FROM groups_table
      WHERE id = ?
      `,
      [group_id]
    );

    const [studentRows] = await db.execute(
      `
      SELECT student_id
      FROM student_groups
      WHERE group_id = ?
      `,
      [group_id]
    );

    const studentIds = studentRows.map((row) => row.student_id);

    const routineText = `${subject?.subject_name || 'Class'} for ${
      group?.course_name || ''
    } ${group?.semester || ''} ${group?.section_name || ''} on ${day_of_week} from ${String(
      start_time
    ).slice(0, 5)} to ${String(end_time).slice(0, 5)} in ${room}.`;

    await createNotificationForUsers({
      userIds: studentIds,
      role: 'student',
      title:
        action === 'created'
          ? 'New Class Routine Added'
          : 'Class Routine Updated',
      message:
        action === 'created'
          ? `A new routine has been added: ${routineText}`
          : `Your class routine has been updated: ${routineText}`,
      type: 'routine',
    });

    await createNotification({
      user_id: faculty_id,
      role: 'faculty',
      title:
        action === 'created'
          ? 'New Teaching Routine Assigned'
          : 'Teaching Routine Updated',
      message:
        action === 'created'
          ? `You have been assigned: ${routineText}`
          : `Your teaching routine has been updated: ${routineText}`,
      type: 'routine',
    });

    await createNotification({
      user_id: null,
      role: 'admin',
      title: action === 'created' ? 'Routine Created' : 'Routine Updated',
      message: routineText,
      type: 'routine',
    });
  } catch (error) {
    console.error('Routine notification error:', error.message);
  }
};

exports.getRoutines = async (req, res) => {
  const { group_id, faculty_id, student_id } = req.query;

  try {
    let query = `
      SELECT 
        r.id,
        r.group_id,
        r.subject_id,
        r.faculty_id,
        r.day_of_week,
        r.start_time,
        r.end_time,
        r.room,
        r.block,
        r.module_code,
        r.class_type,
        g.course_name,
        g.semester,
        g.section_name,
        s.subject_name,
        u.name AS faculty_name
      FROM class_routines r
      JOIN groups_table g
        ON r.group_id = g.id
      JOIN subjects s
        ON r.subject_id = s.id
      JOIN users u
        ON r.faculty_id = u.id
      WHERE 1 = 1
    `;

    const params = [];

    if (group_id) {
      query += ' AND r.group_id = ?';
      params.push(group_id);
    }

    if (faculty_id) {
      query += ' AND r.faculty_id = ?';
      params.push(faculty_id);
    }

    if (student_id) {
      query += `
        AND r.group_id IN (
          SELECT group_id
          FROM student_groups
          WHERE student_id = ?
        )
      `;
      params.push(student_id);
    }

    query += `
      ORDER BY
        FIELD(
          r.day_of_week,
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday'
        ),
        r.start_time
    `;

    const [rows] = await db.execute(query, params);

    res.json(rows);
  } catch (err) {
    console.error('Get routines error:', err);
    res.status(500).json({ message: err.message });
  }
};

const checkRoutineClash = async ({
  group_id,
  subject_id,
  faculty_id,
  day_of_week,
  start_time,
  end_time,
  room,
  excludeId = null,
}) => {
  const normalizedStart = normalizeTime(start_time);
  const normalizedEnd = normalizeTime(end_time);

  let excludeSql = '';
  const excludeParams = [];

  if (excludeId) {
    excludeSql = ' AND r.id != ?';
    excludeParams.push(excludeId);
  }

  const [facultyClash] = await db.execute(
    `
    SELECT
      r.id,
      r.start_time,
      r.end_time,
      r.room,
      u.name AS faculty_name,
      s.subject_name,
      g.course_name,
      g.semester,
      g.section_name
    FROM class_routines r
    JOIN users u
      ON u.id = r.faculty_id
    JOIN subjects s
      ON s.id = r.subject_id
    JOIN groups_table g
      ON g.id = r.group_id
    WHERE r.faculty_id = ?
      AND r.day_of_week = ?
      AND ${hasTimeOverlap}
      ${excludeSql}
    LIMIT 1
    `,
    [
      faculty_id,
      day_of_week,
      normalizedEnd,
      normalizedStart,
      ...excludeParams,
    ]
  );

  if (facultyClash.length > 0) {
    const clash = facultyClash[0];

    return `Faculty clash: ${clash.faculty_name} already has ${
      clash.subject_name
    } for ${clash.course_name} ${clash.semester} ${
      clash.section_name
    } on ${day_of_week} from ${String(clash.start_time).slice(
      0,
      5
    )} to ${String(clash.end_time).slice(0, 5)}.`;
  }

  const [sectionClash] = await db.execute(
    `
    SELECT
      r.id,
      r.start_time,
      r.end_time,
      r.room,
      s.subject_name,
      g.course_name,
      g.semester,
      g.section_name
    FROM class_routines r
    JOIN subjects s
      ON s.id = r.subject_id
    JOIN groups_table g
      ON g.id = r.group_id
    WHERE r.group_id = ?
      AND r.day_of_week = ?
      AND ${hasTimeOverlap}
      ${excludeSql}
    LIMIT 1
    `,
    [
      group_id,
      day_of_week,
      normalizedEnd,
      normalizedStart,
      ...excludeParams,
    ]
  );

  if (sectionClash.length > 0) {
    const clash = sectionClash[0];

    return `Section clash: ${clash.course_name} ${clash.semester} ${
      clash.section_name
    } already has ${clash.subject_name} on ${day_of_week} from ${String(
      clash.start_time
    ).slice(0, 5)} to ${String(clash.end_time).slice(0, 5)}.`;
  }

  const [roomClash] = await db.execute(
    `
    SELECT
      r.id,
      r.start_time,
      r.end_time,
      r.room,
      s.subject_name,
      u.name AS faculty_name,
      g.course_name,
      g.semester,
      g.section_name
    FROM class_routines r
    JOIN subjects s
      ON s.id = r.subject_id
    JOIN users u
      ON u.id = r.faculty_id
    JOIN groups_table g
      ON g.id = r.group_id
    WHERE LOWER(r.room) = LOWER(?)
      AND r.day_of_week = ?
      AND ${hasTimeOverlap}
      ${excludeSql}
    LIMIT 1
    `,
    [
      room,
      day_of_week,
      normalizedEnd,
      normalizedStart,
      ...excludeParams,
    ]
  );

  if (roomClash.length > 0) {
    const clash = roomClash[0];

    return `Room clash: ${clash.room} is already booked for ${
      clash.subject_name
    } by ${clash.faculty_name} on ${day_of_week} from ${String(
      clash.start_time
    ).slice(0, 5)} to ${String(clash.end_time).slice(0, 5)}.`;
  }

  const [duplicateSubject] = await db.execute(
    `
    SELECT
      r.id,
      s.subject_name
    FROM class_routines r
    JOIN subjects s
      ON s.id = r.subject_id
    WHERE r.group_id = ?
      AND r.subject_id = ?
      AND r.day_of_week = ?
      AND r.start_time = ?
      AND r.end_time = ?
      ${excludeSql}
    LIMIT 1
    `,
    [
      group_id,
      subject_id,
      day_of_week,
      normalizedStart,
      normalizedEnd,
      ...excludeParams,
    ]
  );

  if (duplicateSubject.length > 0) {
    return `Duplicate routine: ${duplicateSubject[0].subject_name} is already scheduled for this section at the same time.`;
  }

  return null;
};

exports.createRoutine = async (req, res) => {
  const {
    group_id,
    subject_id,
    faculty_id,
    day_of_week,
    start_time,
    end_time,
    room,
    block,
    module_code,
    class_type,
  } = req.body;

  try {
    const validationError = validateRoutinePayload({
      group_id,
      subject_id,
      faculty_id,
      day_of_week,
      start_time,
      end_time,
      room,
    });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const normalizedStart = normalizeTime(start_time);
    const normalizedEnd = normalizeTime(end_time);

    const clash = await checkRoutineClash({
      group_id,
      subject_id,
      faculty_id,
      day_of_week,
      start_time: normalizedStart,
      end_time: normalizedEnd,
      room,
    });

    if (clash) {
      return res.status(400).json({ message: clash });
    }

    await db.execute(
      `
      INSERT INTO class_routines
      (
        group_id,
        subject_id,
        faculty_id,
        day_of_week,
        start_time,
        end_time,
        room,
        block,
        module_code,
        class_type
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        group_id,
        subject_id,
        faculty_id,
        day_of_week,
        normalizedStart,
        normalizedEnd,
        room,
        block || '-',
        module_code || '-',
        class_type || 'Lecture',
      ]
    );

    await notifyRoutineUsers({
      group_id,
      faculty_id,
      subject_id,
      day_of_week,
      start_time: normalizedStart,
      end_time: normalizedEnd,
      room,
      action: 'created',
    });

    res.status(201).json({
      message: 'Routine created successfully',
    });
  } catch (err) {
    console.error('Create routine error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateRoutine = async (req, res) => {
  const { id } = req.params;

  const {
    group_id,
    subject_id,
    faculty_id,
    day_of_week,
    start_time,
    end_time,
    room,
    block,
    module_code,
    class_type,
  } = req.body;

  try {
    const validationError = validateRoutinePayload({
      group_id,
      subject_id,
      faculty_id,
      day_of_week,
      start_time,
      end_time,
      room,
    });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const normalizedStart = normalizeTime(start_time);
    const normalizedEnd = normalizeTime(end_time);

    const clash = await checkRoutineClash({
      group_id,
      subject_id,
      faculty_id,
      day_of_week,
      start_time: normalizedStart,
      end_time: normalizedEnd,
      room,
      excludeId: id,
    });

    if (clash) {
      return res.status(400).json({ message: clash });
    }

    await db.execute(
      `
      UPDATE class_routines
      SET 
        group_id = ?,
        subject_id = ?,
        faculty_id = ?,
        day_of_week = ?,
        start_time = ?,
        end_time = ?,
        room = ?,
        block = ?,
        module_code = ?,
        class_type = ?
      WHERE id = ?
      `,
      [
        group_id,
        subject_id,
        faculty_id,
        day_of_week,
        normalizedStart,
        normalizedEnd,
        room,
        block || '-',
        module_code || '-',
        class_type || 'Lecture',
        id,
      ]
    );

    await notifyRoutineUsers({
      group_id,
      faculty_id,
      subject_id,
      day_of_week,
      start_time: normalizedStart,
      end_time: normalizedEnd,
      room,
      action: 'updated',
    });

    res.json({
      message: 'Routine updated successfully',
    });
  } catch (err) {
    console.error('Update routine error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.generateRoutine = async (req, res) => {
  const { group_id } = req.body;

  try {
    if (!group_id) {
      return res.status(400).json({ message: 'Section is required' });
    }

    const [subjects] = await db.execute(
      `
      SELECT 
        gs.subject_id,
        s.subject_name
      FROM group_subjects gs
      JOIN subjects s
        ON gs.subject_id = s.id
      WHERE gs.group_id = ?
      ORDER BY s.id
      `,
      [group_id]
    );

    if (subjects.length === 0) {
      return res.status(400).json({
        message: 'No subjects assigned to this section.',
      });
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
    const slots = [
      ['07:00:00', '09:30:00'],
      ['09:30:00', '12:00:00'],
      ['12:00:00', '14:00:00'],
      ['14:00:00', '16:00:00'],
      ['10:30:00', '12:30:00'],
      ['12:30:00', '15:00:00'],
    ];

    const rooms = [
      'LT-02',
      'TR-24',
      'Lab-01',
      'TR-21',
      'MR-01',
      'Finance Lab',
      'Cloud Lab',
      'HR Room',
    ];

    const classTypes = ['Lecture', 'Tutorial', 'Workshop', 'Practical'];

    let created = 0;
    const skippedSubjects = [];

    for (let i = 0; i < subjects.length; i++) {
      const subject = subjects[i];

      const [facultyRows] = await db.execute(
        `
        SELECT faculty_id
        FROM subject_faculty
        WHERE group_id = ?
          AND subject_id = ?
        LIMIT 1
        `,
        [group_id, subject.subject_id]
      );

      if (facultyRows.length === 0) {
        skippedSubjects.push(`${subject.subject_name}: no faculty assigned`);
        continue;
      }

      const facultyId = facultyRows[0].faculty_id;
      let inserted = false;

      for (let d = 0; d < days.length && !inserted; d++) {
        for (let s = 0; s < slots.length && !inserted; s++) {
          for (let r = 0; r < rooms.length && !inserted; r++) {
            const day = days[(i + d) % days.length];
            const [start, end] = slots[(i + s) % slots.length];
            const room = rooms[(i + r) % rooms.length];

            const clash = await checkRoutineClash({
              group_id,
              subject_id: subject.subject_id,
              faculty_id: facultyId,
              day_of_week: day,
              start_time: start,
              end_time: end,
              room,
            });

            if (!clash) {
              const isManagement =
                subject.subject_name.includes('Business') ||
                subject.subject_name.includes('Marketing') ||
                subject.subject_name.includes('Accounting') ||
                subject.subject_name.includes('Human') ||
                subject.subject_name.includes('Organisational') ||
                subject.subject_name.includes('Analytics');

              const modulePrefix = isManagement ? 'BM' : 'CS';
              const levelPrefix =
                String(group_id) === '1' || String(group_id) === '3'
                  ? '6'
                  : '5';

              await db.execute(
                `
                INSERT INTO class_routines
                (
                  group_id,
                  subject_id,
                  faculty_id,
                  day_of_week,
                  start_time,
                  end_time,
                  room,
                  block,
                  module_code,
                  class_type
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                  group_id,
                  subject.subject_id,
                  facultyId,
                  day,
                  start,
                  end,
                  room,
                  isManagement ? 'BBA' : ['WLV', 'ING'][i % 2],
                  `${levelPrefix}${modulePrefix}${String(
                    subject.subject_id
                  ).padStart(3, '0')}`,
                  classTypes[i % classTypes.length],
                ]
              );

              await notifyRoutineUsers({
                group_id,
                faculty_id: facultyId,
                subject_id: subject.subject_id,
                day_of_week: day,
                start_time: start,
                end_time: end,
                room,
                action: 'created',
              });

              created++;
              inserted = true;
            }
          }
        }
      }

      if (!inserted) {
        skippedSubjects.push(`${subject.subject_name}: no free slot found`);
      }
    }

    res.json({
      message:
        skippedSubjects.length > 0
          ? `${created} routine slot(s) generated. Skipped: ${skippedSubjects.join(
              ', '
            )}`
          : `${created} routine slot(s) generated successfully`,
    });
  } catch (err) {
    console.error('Generate routine error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteRoutine = async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute('DELETE FROM class_routines WHERE id = ?', [id]);

    await createNotification({
      user_id: null,
      role: 'admin',
      title: 'Routine Deleted',
      message: 'A class routine was deleted.',
      type: 'routine',
    });

    res.json({
      message: 'Routine deleted successfully',
    });
  } catch (err) {
    console.error('Delete routine error:', err);
    res.status(500).json({ message: err.message });
  }
};