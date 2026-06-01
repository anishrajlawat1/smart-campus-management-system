const db = require('../config/db');

const {
  createNotification,
} = require('../utils/notificationHelper');

/* =========================
   COURSES
========================= */

exports.getCourses = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT * FROM courses ORDER BY course_name
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createCourse = async (req, res) => {
  const { course_name } = req.body;

  try {
    if (!course_name) {
      return res.status(400).json({ message: 'Course name is required' });
    }

    await db.execute(`INSERT INTO courses (course_name) VALUES (?)`, [
      course_name,
    ]);

    res.json({ message: 'Course created successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Course already exists' });
    }

    res.status(500).json({ message: err.message });
  }
};

exports.deleteCourse = async (req, res) => {
  const { id } = req.params;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [courseRows] = await connection.execute(
      `SELECT course_name FROM courses WHERE id = ?`,
      [id]
    );

    if (courseRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Course not found' });
    }

    const courseName = courseRows[0].course_name;

    const [groupRows] = await connection.execute(
      `SELECT id FROM groups_table WHERE course_name = ?`,
      [courseName]
    );

    const groupIds = groupRows.map((g) => g.id);

    const [subjectRows] = await connection.execute(
      `SELECT id FROM subjects WHERE course_name = ?`,
      [courseName]
    );

    const subjectIds = subjectRows.map((s) => s.id);

    if (groupIds.length > 0) {
      await connection.query(`DELETE FROM attendance WHERE group_id IN (?)`, [groupIds]);
      await connection.query(`DELETE FROM class_routines WHERE group_id IN (?)`, [groupIds]);
      await connection.query(`DELETE FROM student_groups WHERE group_id IN (?)`, [groupIds]);
      await connection.query(`DELETE FROM group_subjects WHERE group_id IN (?)`, [groupIds]);
      await connection.query(`DELETE FROM subject_faculty WHERE group_id IN (?)`, [groupIds]);
    }

    if (subjectIds.length > 0) {
      await connection.query(`DELETE FROM attendance WHERE subject_id IN (?)`, [subjectIds]);
      await connection.query(`DELETE FROM class_routines WHERE subject_id IN (?)`, [subjectIds]);
      await connection.query(`DELETE FROM group_subjects WHERE subject_id IN (?)`, [subjectIds]);
      await connection.query(`DELETE FROM subject_faculty WHERE subject_id IN (?)`, [subjectIds]);
      await connection.query(`DELETE FROM subjects WHERE id IN (?)`, [subjectIds]);
    }

    await connection.execute(`DELETE FROM groups_table WHERE course_name = ?`, [courseName]);
    await connection.execute(`DELETE FROM course_levels WHERE course_id = ?`, [id]);
    await connection.execute(`DELETE FROM courses WHERE id = ?`, [id]);

    await connection.commit();

    res.json({
      message:
        'Course and all related levels, sections, subjects, assignments, routines, and attendance deleted successfully',
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    connection.release();
  }
};

/* =========================
   LEVELS
========================= */

exports.getLevels = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        cl.id,
        cl.course_id,
        cl.level_name,
        c.course_name
      FROM course_levels cl
      JOIN courses c ON cl.course_id = c.id
      ORDER BY c.course_name, cl.level_name
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLevelsByCourse = async (req, res) => {
  const { courseId } = req.params;

  try {
    const [rows] = await db.execute(
      `
      SELECT * FROM course_levels
      WHERE course_id = ?
      ORDER BY level_name
      `,
      [courseId]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createLevel = async (req, res) => {
  const { course_id, level_name } = req.body;

  try {
    if (!course_id || !level_name) {
      return res.status(400).json({
        message: 'Course and level are required',
      });
    }

    await db.execute(
      `
      INSERT INTO course_levels (course_id, level_name)
      VALUES (?, ?)
      `,
      [course_id, level_name]
    );

    res.json({ message: 'Level created successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        message: 'Level already exists for this course',
      });
    }

    res.status(500).json({ message: err.message });
  }
};

exports.deleteLevel = async (req, res) => {
  const { id } = req.params;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [levelRows] = await connection.execute(
      `
      SELECT cl.level_name, c.course_name
      FROM course_levels cl
      JOIN courses c ON cl.course_id = c.id
      WHERE cl.id = ?
      `,
      [id]
    );

    if (levelRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Level not found' });
    }

    const { level_name, course_name } = levelRows[0];

    const [groupRows] = await connection.execute(
      `
      SELECT id FROM groups_table
      WHERE course_name = ? AND semester = ?
      `,
      [course_name, level_name]
    );

    const groupIds = groupRows.map((g) => g.id);

    const [subjectRows] = await connection.execute(
      `
      SELECT id FROM subjects
      WHERE course_name = ? AND semester = ?
      `,
      [course_name, level_name]
    );

    const subjectIds = subjectRows.map((s) => s.id);

    if (groupIds.length > 0) {
      await connection.query(`DELETE FROM attendance WHERE group_id IN (?)`, [groupIds]);
      await connection.query(`DELETE FROM class_routines WHERE group_id IN (?)`, [groupIds]);
      await connection.query(`DELETE FROM student_groups WHERE group_id IN (?)`, [groupIds]);
      await connection.query(`DELETE FROM group_subjects WHERE group_id IN (?)`, [groupIds]);
      await connection.query(`DELETE FROM subject_faculty WHERE group_id IN (?)`, [groupIds]);
    }

    if (subjectIds.length > 0) {
      await connection.query(`DELETE FROM attendance WHERE subject_id IN (?)`, [subjectIds]);
      await connection.query(`DELETE FROM class_routines WHERE subject_id IN (?)`, [subjectIds]);
      await connection.query(`DELETE FROM group_subjects WHERE subject_id IN (?)`, [subjectIds]);
      await connection.query(`DELETE FROM subject_faculty WHERE subject_id IN (?)`, [subjectIds]);
      await connection.query(`DELETE FROM subjects WHERE id IN (?)`, [subjectIds]);
    }

    await connection.execute(
      `
      DELETE FROM groups_table
      WHERE course_name = ? AND semester = ?
      `,
      [course_name, level_name]
    );

    await connection.execute(`DELETE FROM course_levels WHERE id = ?`, [id]);

    await connection.commit();

    res.json({
      message:
        'Level and related sections, subjects, routines, and attendance deleted successfully',
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    connection.release();
  }
};

/* =========================
   GROUPS / SECTIONS
========================= */

exports.getGroups = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        g.*
      FROM groups_table g
      JOIN courses c 
        ON c.course_name = g.course_name
      JOIN course_levels cl
        ON cl.course_id = c.id
       AND cl.level_name = g.semester
      ORDER BY g.course_name, g.semester, g.section_name
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/*
  New section does NOT create students automatically.
  Students must be assigned manually from Student Assignment module.
*/
exports.createGroup = async (req, res) => {
  const { course_name, semester, section_name } = req.body;

  try {
    if (!course_name || !semester || !section_name) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const [courseRows] = await db.execute(
      `SELECT id FROM courses WHERE course_name = ?`,
      [course_name]
    );

    if (courseRows.length === 0) {
      return res.status(400).json({ message: 'Selected course does not exist' });
    }

    const [levelRows] = await db.execute(
      `
      SELECT id FROM course_levels
      WHERE course_id = ? AND level_name = ?
      `,
      [courseRows[0].id, semester]
    );

    if (levelRows.length === 0) {
      return res.status(400).json({ message: 'Selected level does not exist for this course' });
    }

    const [existing] = await db.execute(
      `
      SELECT id FROM groups_table
      WHERE course_name = ? AND semester = ? AND section_name = ?
      `,
      [course_name, semester, section_name]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'This section already exists' });
    }

    const [result] = await db.execute(
      `
      INSERT INTO groups_table (course_name, semester, section_name)
      VALUES (?, ?, ?)
      `,
      [course_name, semester, section_name]
    );

    const groupId = result.insertId;

    const [matchedSubjects] = await db.execute(
      `
      SELECT s.id
      FROM subjects s
      JOIN courses c
        ON c.course_name = s.course_name
      JOIN course_levels cl
        ON cl.course_id = c.id
       AND cl.level_name = s.semester
      WHERE s.course_name = ?
        AND s.semester = ?
      `,
      [course_name, semester]
    );

    for (const subject of matchedSubjects) {
      await db.execute(
        `
        INSERT IGNORE INTO group_subjects (group_id, subject_id)
        VALUES (?, ?)
        `,
        [groupId, subject.id]
      );
    }

    res.json({
      message: 'Section created successfully. Students must be assigned manually.',
      group_id: groupId,
      assigned_subjects: matchedSubjects.length,
      added_students: 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteGroup = async (req, res) => {
  const { id } = req.params;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute(`DELETE FROM attendance WHERE group_id = ?`, [id]);
    await connection.execute(`DELETE FROM class_routines WHERE group_id = ?`, [id]);
    await connection.execute(`DELETE FROM student_groups WHERE group_id = ?`, [id]);
    await connection.execute(`DELETE FROM group_subjects WHERE group_id = ?`, [id]);
    await connection.execute(`DELETE FROM subject_faculty WHERE group_id = ?`, [id]);
    await connection.execute(`DELETE FROM groups_table WHERE id = ?`, [id]);

    await connection.commit();

    res.json({ message: 'Section and related records deleted successfully' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    connection.release();
  }
};

/* =========================
   SUBJECTS
========================= */

exports.getSubjects = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        s.*
      FROM subjects s
      JOIN courses c
        ON c.course_name = s.course_name
      JOIN course_levels cl
        ON cl.course_id = c.id
       AND cl.level_name = s.semester
      ORDER BY s.course_name, s.semester, s.subject_name
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/*
  When new subject is created, it is automatically linked
  to all existing matching sections/groups.
*/
exports.createSubject = async (req, res) => {
  const { subject_name, course_name, semester } = req.body;

  try {
    if (!subject_name || !course_name || !semester) {
      return res.status(400).json({
        message: 'Subject name, course and level are required',
      });
    }

    const [courseRows] = await db.execute(
      `SELECT id FROM courses WHERE course_name = ?`,
      [course_name]
    );

    if (courseRows.length === 0) {
      return res.status(400).json({ message: 'Selected course does not exist' });
    }

    const [levelRows] = await db.execute(
      `
      SELECT id FROM course_levels
      WHERE course_id = ? AND level_name = ?
      `,
      [courseRows[0].id, semester]
    );

    if (levelRows.length === 0) {
      return res.status(400).json({ message: 'Selected level does not exist for this course' });
    }

    const [existing] = await db.execute(
      `
      SELECT id FROM subjects
      WHERE subject_name = ? AND course_name = ? AND semester = ?
      `,
      [subject_name, course_name, semester]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: 'This subject already exists for this course and level',
      });
    }

    const [subjectResult] = await db.execute(
      `
      INSERT INTO subjects (subject_name, course_name, semester)
      VALUES (?, ?, ?)
      `,
      [subject_name, course_name, semester]
    );

    const subjectId = subjectResult.insertId;

    const [matchingGroups] = await db.execute(
      `
      SELECT g.id
      FROM groups_table g
      JOIN courses c
        ON c.course_name = g.course_name
      JOIN course_levels cl
        ON cl.course_id = c.id
       AND cl.level_name = g.semester
      WHERE g.course_name = ?
        AND g.semester = ?
      `,
      [course_name, semester]
    );

    for (const group of matchingGroups) {
      await db.execute(
        `
        INSERT IGNORE INTO group_subjects (group_id, subject_id)
        VALUES (?, ?)
        `,
        [group.id, subjectId]
      );
    }

    res.json({
      message: 'Subject created and assigned to matching sections successfully',
      subject_id: subjectId,
      assigned_groups: matchingGroups.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteSubject = async (req, res) => {
  const { id } = req.params;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute(`DELETE FROM group_subjects WHERE subject_id = ?`, [id]);
    await connection.execute(`DELETE FROM subject_faculty WHERE subject_id = ?`, [id]);
    await connection.execute(`DELETE FROM attendance WHERE subject_id = ?`, [id]);
    await connection.execute(`DELETE FROM class_routines WHERE subject_id = ?`, [id]);
    await connection.execute(`DELETE FROM subjects WHERE id = ?`, [id]);

    await connection.commit();

    res.json({ message: 'Subject deleted successfully' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    connection.release();
  }
};

/* =========================
   GROUP SUBJECTS
========================= */

exports.assignSubjectToGroup = async (req, res) => {
  const { group_id, subject_id } = req.body;

  try {
    if (!group_id || !subject_id) {
      return res.status(400).json({ message: 'Group and subject are required' });
    }

    const [validRows] = await db.execute(
      `
      SELECT 
        g.id AS group_id,
        s.id AS subject_id
      FROM groups_table g
      JOIN subjects s
        ON s.course_name = g.course_name
       AND s.semester = g.semester
      JOIN courses c
        ON c.course_name = g.course_name
       AND c.course_name = s.course_name
      JOIN course_levels cl
        ON cl.course_id = c.id
       AND cl.level_name = g.semester
       AND cl.level_name = s.semester
      WHERE g.id = ?
        AND s.id = ?
      `,
      [group_id, subject_id]
    );

    if (validRows.length === 0) {
      return res.status(400).json({
        message: 'Invalid group or subject. Course/level may have been deleted.',
      });
    }

    await db.execute(
      `
      INSERT IGNORE INTO group_subjects (group_id, subject_id)
      VALUES (?, ?)
      `,
      [group_id, subject_id]
    );

    res.json({ message: 'Subject assigned to group successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getGroupSubjects = async (req, res) => {
  const { group_id } = req.query;

  try {
    let query = `
      SELECT 
        gs.id,
        g.id AS group_id,
        g.course_name,
        g.semester,
        g.section_name,
        s.id AS subject_id,
        s.subject_name
      FROM group_subjects gs
      JOIN groups_table g 
        ON gs.group_id = g.id
      JOIN subjects s 
        ON gs.subject_id = s.id
      JOIN courses c
        ON c.course_name = g.course_name
       AND c.course_name = s.course_name
      JOIN course_levels cl
        ON cl.course_id = c.id
       AND cl.level_name = g.semester
       AND cl.level_name = s.semester
      WHERE 1=1
    `;

    const params = [];

    if (group_id) {
      query += ' AND gs.group_id = ?';
      params.push(group_id);
    }

    query += ' ORDER BY g.course_name, g.semester, g.section_name, s.subject_name';

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteGroupSubject = async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute('DELETE FROM group_subjects WHERE id = ?', [id]);
    res.json({ message: 'Group subject removed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   STUDENTS
========================= */

exports.getStudentsByGroup = async (req, res) => {
  const { groupId } = req.params;

  try {
    const [rows] = await db.execute(
      `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.profile_image
      FROM student_groups sg
      JOIN users u ON sg.student_id = u.id
      JOIN groups_table g ON sg.group_id = g.id
      JOIN courses c ON c.course_name = g.course_name
      JOIN course_levels cl
        ON cl.course_id = c.id
       AND cl.level_name = g.semester
      WHERE sg.group_id = ?
        AND u.role = 'student'
      ORDER BY u.name ASC
      `,
      [groupId]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.assignStudentToGroup = async (req, res) => {
  const { student_id, group_id } = req.body;

  try {
    if (!student_id || !group_id) {
      return res.status(400).json({ message: 'Student and group are required' });
    }

    const [validGroup] = await db.execute(
      `
      SELECT g.id
      FROM groups_table g
      JOIN courses c
        ON c.course_name = g.course_name
      JOIN course_levels cl
        ON cl.course_id = c.id
       AND cl.level_name = g.semester
      WHERE g.id = ?
      `,
      [group_id]
    );

    if (validGroup.length === 0) {
      return res.status(400).json({
        message: 'Invalid section. Course/level may have been deleted.',
      });
    }

    const [validStudent] = await db.execute(
      `
      SELECT id FROM users
      WHERE id = ? AND role = 'student'
      `,
      [student_id]
    );

    if (validStudent.length === 0) {
      return res.status(400).json({ message: 'Invalid student selected' });
    }

    await db.execute(
      `
      INSERT INTO student_groups (student_id, group_id)
      VALUES (?, ?)
      `,
      [student_id, group_id]
    );

    res.json({ message: 'Student assigned successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        message: 'Student already assigned to this group',
      });
    }

    res.status(500).json({ message: err.message });
  }
};

exports.getAssignedStudents = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        sg.id,
        u.id AS student_id,
        u.name AS student_name,
        u.email AS student_email,
        u.profile_image,
        g.id AS group_id,
        g.course_name,
        g.semester,
        g.section_name
      FROM student_groups sg
      JOIN users u 
        ON sg.student_id = u.id
      JOIN groups_table g 
        ON sg.group_id = g.id
      JOIN courses c
        ON c.course_name = g.course_name
      JOIN course_levels cl
        ON cl.course_id = c.id
       AND cl.level_name = g.semester
      WHERE u.role = 'student'
      ORDER BY g.course_name, g.section_name, u.name ASC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteAssignedStudent = async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute('DELETE FROM student_groups WHERE id = ?', [id]);
    res.json({ message: 'Student assignment removed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   FACULTY SUBJECTS
========================= */

exports.getFacultySubjects = async (req, res) => {
  const { faculty_id } = req.query;

  try {
    let query = `
      SELECT 
        sf.id,
        u.id AS faculty_id,
        u.name AS faculty_name,
        u.email AS faculty_email,
        s.id AS subject_id,
        s.subject_name,
        g.id AS group_id,
        g.course_name,
        g.semester,
        g.section_name
      FROM subject_faculty sf
      JOIN users u 
        ON sf.faculty_id = u.id
      JOIN subjects s 
        ON sf.subject_id = s.id
      JOIN groups_table g 
        ON sf.group_id = g.id
      JOIN courses c
        ON c.course_name = g.course_name
       AND c.course_name = s.course_name
      JOIN course_levels cl
        ON cl.course_id = c.id
       AND cl.level_name = g.semester
       AND cl.level_name = s.semester
      WHERE 1=1
    `;

    const params = [];

    if (faculty_id) {
      query += ' AND sf.faculty_id = ?';
      params.push(faculty_id);
    }

    query += ' ORDER BY u.name, g.course_name, g.section_name, s.subject_name';

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.assignFacultyToSubject = async (req, res) => {
  const { faculty_id, subject_id, group_id } = req.body;

  try {
    if (!faculty_id || !subject_id || !group_id) {
      return res.status(400).json({
        message: 'Faculty, subject and group are required',
      });
    }

    const [validRows] = await db.execute(
      `
      SELECT 
        g.id AS group_id,
        s.id AS subject_id
      FROM groups_table g
      JOIN subjects s
        ON s.course_name = g.course_name
       AND s.semester = g.semester
      JOIN courses c
        ON c.course_name = g.course_name
       AND c.course_name = s.course_name
      JOIN course_levels cl
        ON cl.course_id = c.id
       AND cl.level_name = g.semester
       AND cl.level_name = s.semester
      WHERE g.id = ?
        AND s.id = ?
      `,
      [group_id, subject_id]
    );

    if (validRows.length === 0) {
      return res.status(400).json({
        message: 'Invalid subject or section. Course/level may have been deleted.',
      });
    }

    await db.execute(
      `
      INSERT IGNORE INTO group_subjects (group_id, subject_id)
      VALUES (?, ?)
      `,
      [group_id, subject_id]
    );

    await db.execute(
      `
      INSERT INTO subject_faculty (faculty_id, subject_id, group_id)
      VALUES (?, ?, ?)
      `,
      [faculty_id, subject_id, group_id]
    );

    res.json({ message: 'Faculty assigned successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        message: 'Faculty already assigned to this subject and group',
      });
    }

    res.status(500).json({ message: err.message });
  }
};

exports.deleteFacultySubject = async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute('DELETE FROM subject_faculty WHERE id = ?', [id]);
    res.json({ message: 'Faculty assignment removed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   ATTENDANCE
========================= */

exports.getAttendance = async (req, res) => {
  const { group_id, subject_id, date } = req.query;

  try {
    let query = `
      SELECT 
        a.id,
        a.student_id,
        u.name AS student_name,
        u.email AS student_email,
        u.profile_image,
        a.subject_id,
        s.subject_name,
        a.group_id,
        g.course_name,
        g.semester,
        g.section_name,
        a.faculty_id,
        f.name AS faculty_name,
        a.status,
        a.date
      FROM attendance a
      JOIN users u ON a.student_id = u.id
      JOIN subjects s ON a.subject_id = s.id
      JOIN groups_table g ON a.group_id = g.id
      JOIN courses c
        ON c.course_name = g.course_name
       AND c.course_name = s.course_name
      JOIN course_levels cl
        ON cl.course_id = c.id
       AND cl.level_name = g.semester
       AND cl.level_name = s.semester
      LEFT JOIN users f ON a.faculty_id = f.id
      WHERE 1=1
    `;

    const params = [];

    if (group_id) {
      query += ' AND a.group_id = ?';
      params.push(group_id);
    }

    if (subject_id) {
      query += ' AND a.subject_id = ?';
      params.push(subject_id);
    }

    if (date) {
      query += ' AND DATE(a.date) = ?';
      params.push(date);
    }

    query +=
      ' ORDER BY g.course_name, g.section_name, s.subject_name, u.name ASC';

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const checkAndNotifyLowAttendance = async ({
  student_id,
  subject_id,
  group_id,
  faculty_id = null,
}) => {
  try {
    const [[summary]] = await db.execute(
      `
      SELECT
        COUNT(id) AS total_classes,
        SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END) AS attended_classes,
        ROUND(
          (
            SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END)
            / COUNT(id)
          ) * 100,
          2
        ) AS attendance_percentage
      FROM attendance
      WHERE student_id = ?
        AND subject_id = ?
        AND group_id = ?
      `,
      [student_id, subject_id, group_id]
    );

    if (!summary || Number(summary.total_classes || 0) < 3) {
      return;
    }

    const percentage = Number(summary.attendance_percentage || 0);

    if (percentage >= 75) {
      await db.execute(
        `
        DELETE FROM notifications
        WHERE type = 'low_attendance'
          AND user_id = ?
        `,
        [student_id]
      );

      return;
    }

    const [[student]] = await db.execute(
      `
      SELECT name
      FROM users
      WHERE id = ?
      `,
      [student_id]
    );

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

    const subjectName = subject?.subject_name || 'this subject';

    const message = `${student?.name || 'Student'} is at ${percentage}% attendance in ${subjectName} for ${
      group?.course_name || ''
    } ${group?.semester || ''} ${group?.section_name || ''}.`;

    await db.execute(
      `
      DELETE FROM notifications
      WHERE type = 'low_attendance'
        AND user_id = ?
        AND message LIKE ?
      `,
      [student_id, `%${subjectName}%`]
    );

    await createNotification({
      user_id: student_id,
      role: 'student',
      title: 'Low Attendance Warning',
      message: `Your attendance is ${percentage}% in ${subjectName}, below the required 75% threshold.`,
      type: 'low_attendance',
    });

    if (faculty_id) {
      await createNotification({
        user_id: faculty_id,
        role: 'faculty',
        title: 'Student Attendance Risk',
        message,
        type: 'low_attendance',
      });
    }

    await createNotification({
      user_id: null,
      role: 'admin',
      title: 'Low Attendance Risk Detected',
      message,
      type: 'low_attendance',
    });
  } catch (error) {
    console.error('Low attendance notification error:', error.message);
  }
};

exports.markAttendance = async (req, res) => {
  const { student_id, subject_id, group_id, faculty_id, date, status } = req.body;

  try {
    if (!student_id || !subject_id || !group_id || !date || !status) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    if (!['present', 'absent', 'late'].includes(status)) {
      return res.status(400).json({ message: 'Invalid attendance status' });
    }

    const [validRows] = await db.execute(
      `
      SELECT 
        sg.student_id,
        gs.subject_id,
        g.id AS group_id
      FROM student_groups sg
      JOIN groups_table g
        ON g.id = sg.group_id
      JOIN group_subjects gs
        ON gs.group_id = g.id
      JOIN subjects s
        ON s.id = gs.subject_id
      JOIN courses c
        ON c.course_name = g.course_name
       AND c.course_name = s.course_name
      JOIN course_levels cl
        ON cl.course_id = c.id
       AND cl.level_name = g.semester
       AND cl.level_name = s.semester
      WHERE sg.student_id = ?
        AND g.id = ?
        AND gs.subject_id = ?
      `,
      [student_id, group_id, subject_id]
    );

    if (validRows.length === 0) {
      return res.status(400).json({
        message: 'Invalid attendance data. Student, subject, or section is not properly assigned.',
      });
    }

    const [existing] = await db.execute(
      `
      SELECT id FROM attendance
      WHERE student_id = ? AND subject_id = ? AND group_id = ? AND date = ?
      `,
      [student_id, subject_id, group_id, date]
    );

    if (existing.length > 0) {
      await db.execute(
        `
        UPDATE attendance
        SET status = ?, faculty_id = ?
        WHERE id = ?
        `,
        [status, faculty_id || null, existing[0].id]
      );
    } else {
      await db.execute(
        `
        INSERT INTO attendance 
        (student_id, subject_id, group_id, faculty_id, date, status)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [student_id, subject_id, group_id, faculty_id || null, date, status]
      );
    }

    await checkAndNotifyLowAttendance({
      student_id,
      subject_id,
      group_id,
      faculty_id,
    });

    res.json({ message: 'Attendance saved successfully' });
  } catch (err) {
    console.error('Mark attendance error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteAttendance = async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute('DELETE FROM attendance WHERE id = ?', [id]);
    res.json({ message: 'Attendance deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAttendanceReport = async (req, res) => {
  const { group_id, subject_id, date_from, date_to } = req.query;

  try {
    if (!group_id || !subject_id || !date_from || !date_to) {
      return res.status(400).json({
        message: 'Group, subject, start date and end date are required',
      });
    }

    const [rows] = await db.execute(
      `
      SELECT 
        u.id AS student_id,
        u.name AS student_name,
        u.email AS student_email,
        COUNT(a.id) AS total_classes,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) AS late_count,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent_count,
        ROUND(
          (SUM(CASE WHEN a.status IN ('present', 'late') THEN 1 ELSE 0 END) / COUNT(a.id)) * 100,
          2
        ) AS attendance_percentage
      FROM attendance a
      JOIN users u ON a.student_id = u.id
      JOIN subjects s ON a.subject_id = s.id
      JOIN groups_table g ON a.group_id = g.id
      JOIN courses c
        ON c.course_name = g.course_name
       AND c.course_name = s.course_name
      JOIN course_levels cl
        ON cl.course_id = c.id
       AND cl.level_name = g.semester
       AND cl.level_name = s.semester
      WHERE a.group_id = ?
        AND a.subject_id = ?
        AND a.date BETWEEN ? AND ?
      GROUP BY u.id, u.name, u.email
      ORDER BY u.name ASC
      `,
      [group_id, subject_id, date_from, date_to]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStudentDashboardSummary = async (req, res) => {
  try {
    const { studentId } = req.params;

    const [groupRows] = await db.execute(
      `
      SELECT 
        sg.group_id,
        g.course_name,
        g.semester,
        g.section_name
      FROM student_groups sg
      JOIN groups_table g ON sg.group_id = g.id
      JOIN courses c ON c.course_name = g.course_name
      JOIN course_levels cl
        ON cl.course_id = c.id
       AND cl.level_name = g.semester
      WHERE sg.student_id = ?
      LIMIT 1
      `,
      [studentId]
    );

    const group = groupRows[0] || null;

    const [attendanceRows] = await db.execute(
      `
      SELECT
        COUNT(*) AS total_classes,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) AS late_count,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) AS absent_count
      FROM attendance
      WHERE student_id = ?
      `,
      [studentId]
    );

    const stats = attendanceRows[0] || {};
    const total = Number(stats.total_classes || 0);
    const present = Number(stats.present_count || 0);
    const late = Number(stats.late_count || 0);
    const absent = Number(stats.absent_count || 0);

    const attendancePercentage =
      total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    let routines = [];

    if (group?.group_id) {
      const [routineRows] = await db.execute(
        `
        SELECT 
          cr.*,
          s.subject_name,
          u.name AS faculty_name,
          g.course_name,
          g.semester,
          g.section_name
        FROM class_routines cr
        JOIN subjects s ON cr.subject_id = s.id
        JOIN users u ON cr.faculty_id = u.id
        JOIN groups_table g ON cr.group_id = g.id
        JOIN courses c
          ON c.course_name = g.course_name
         AND c.course_name = s.course_name
        JOIN course_levels cl
          ON cl.course_id = c.id
         AND cl.level_name = g.semester
         AND cl.level_name = s.semester
        WHERE cr.group_id = ?
        ORDER BY FIELD(cr.day_of_week, 'Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'),
        cr.start_time ASC
        `,
        [group.group_id]
      );

      routines = routineRows;
    }

    res.json({
      group,
      attendance: {
        total_classes: total,
        present_count: present,
        late_count: late,
        absent_count: absent,
        attendance_percentage: attendancePercentage,
      },
      routines,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStudentSubjectAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;

    const [rows] = await db.execute(
      `
      SELECT 
        s.id AS subject_id,
        s.subject_name,
        COUNT(a.id) AS total_classes,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) AS late_count,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent_count,
        ROUND(
          (SUM(CASE WHEN a.status IN ('present', 'late') THEN 1 ELSE 0 END) / COUNT(a.id)) * 100,
          2
        ) AS attendance_percentage
      FROM attendance a
      JOIN subjects s ON a.subject_id = s.id
      JOIN groups_table g ON a.group_id = g.id
      JOIN courses c
        ON c.course_name = g.course_name
       AND c.course_name = s.course_name
      JOIN course_levels cl
        ON cl.course_id = c.id
       AND cl.level_name = g.semester
       AND cl.level_name = s.semester
      WHERE a.student_id = ?
      GROUP BY s.id, s.subject_name
      ORDER BY s.subject_name ASC
      `,
      [studentId]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFacultyLowAttendanceRisk = async (req, res) => {
  try {
    const { facultyId } = req.params;

    const [rows] = await db.execute(
      `
      SELECT
        u.id AS student_id,
        u.name AS student_name,
        u.email AS student_email,
        s.id AS subject_id,
        s.subject_name,
        gt.id AS group_id,
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
      FROM subject_faculty sf
      JOIN subjects s
        ON s.id = sf.subject_id
      JOIN groups_table gt
        ON gt.id = sf.group_id
      JOIN attendance a
        ON a.subject_id = sf.subject_id
       AND a.group_id = sf.group_id
      JOIN users u
        ON u.id = a.student_id
      JOIN courses c
        ON c.course_name = gt.course_name
       AND c.course_name = s.course_name
      JOIN course_levels cl
        ON cl.course_id = c.id
       AND cl.level_name = gt.semester
       AND cl.level_name = s.semester
      WHERE sf.faculty_id = ?
        AND u.role = 'student'
      GROUP BY
        u.id,
        u.name,
        u.email,
        s.id,
        s.subject_name,
        gt.id,
        gt.course_name,
        gt.semester,
        gt.section_name
      HAVING attendance_percentage < 75
      ORDER BY attendance_percentage ASC, absent_classes DESC
      LIMIT 20
      `,
      [facultyId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Faculty low attendance risk error:', err);
    res.status(500).json({ message: err.message });
  }
};