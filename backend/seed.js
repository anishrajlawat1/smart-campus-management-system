const bcrypt = require('bcryptjs');
const db = require('./config/db');
require('dotenv').config();

const seed = async () => {
  try {
    const password = await bcrypt.hash('123456', 10);

    console.log('Seeding database...');

    await db.execute('SET FOREIGN_KEY_CHECKS = 0');

    await db.execute('DELETE FROM notifications');
    await db.execute('DELETE FROM events');
    await db.execute('DELETE FROM lost_found');
    await db.execute('DELETE FROM class_routines WHERE id > 0');
    await db.execute('DELETE FROM attendance');
    await db.execute('DELETE FROM subject_faculty');
    await db.execute('DELETE FROM student_groups');
    await db.execute('DELETE FROM group_subjects');
    await db.execute('DELETE FROM notices');
    await db.execute('DELETE FROM subjects');
    await db.execute('DELETE FROM groups_table');
    await db.execute('DELETE FROM course_levels');
    await db.execute('DELETE FROM courses');
    await db.execute('DELETE FROM users');

    await db.execute('SET FOREIGN_KEY_CHECKS = 1');

    /* ================= USERS ================= */

    const users = [
      [1, 'System Admin', 'admin@test.com', password, 'admin'],

      [2, 'Dr. Suman Karki', 'suman@test.com', password, 'faculty'],
      [3, 'Ms. Priya Shrestha', 'priya@test.com', password, 'faculty'],
      [4, 'Mr. Rajan Thapa', 'rajan@test.com', password, 'faculty'],
      [5, 'Dr. Nisha Adhikari', 'nisha@test.com', password, 'faculty'],
      [6, 'Mr. Bikram Gurung', 'bikram@test.com', password, 'faculty'],
      [7, 'Ms. Alina Rai', 'alina@test.com', password, 'faculty'],
      [8, 'Dr. Prakash Joshi', 'prakash@test.com', password, 'faculty'],
      [9, 'Ms. Ritu Lama', 'ritu@test.com', password, 'faculty'],
      [10, 'Mr. Sanjay Shrestha', 'sanjay@test.com', password, 'faculty'],
      [11, 'Dr. Kabita Thapa', 'kabita@test.com', password, 'faculty'],
      [12, 'Mr. Milan KC', 'milan@test.com', password, 'faculty'],
    ];

    const studentNames = [
      'Anish Rajlawat', 'Ram Sharma', 'Sita Thapa', 'Nabin Gurung', 'Mina Lama',
      'Bikash Rai', 'Aarav Karki', 'Sneha Shrestha', 'Dipesh Adhikari', 'Puja Tamang',
      'Rohan Joshi', 'Asmita Magar', 'Sagar Bhandari', 'Ritika Basnet', 'Kiran Lama',
      'Prabin Thapa', 'Manisha Gurung', 'Aayush Rai', 'Sanjana KC', 'Niraj Shahi',
      'Bina Khadka', 'Roshan Ale', 'Sabina Poudel', 'Suman Maharjan', 'Asha Dangol',
      'Krishna Kunwar', 'Sarita Bohara', 'Deepak Pandey', 'Anjali Ghimire', 'Bibek Rana',
    ];

    let userId = 13;

    const groupsData = [
      { groupId: 1, code: 'l6cg7', label: 'L6CG7' },
      { groupId: 2, code: 'l5cg6', label: 'L5CG6' },
      { groupId: 3, code: 'm6a', label: 'M6A' },
      { groupId: 4, code: 'm5a', label: 'M5A' },
    ];

    for (const group of groupsData) {
      for (let i = 0; i < 30; i++) {
        users.push([
          userId,
          `${studentNames[i]} ${group.label}`,
          `${group.code}.student${String(i + 1).padStart(2, '0')}@test.com`,
          password,
          'student',
        ]);
        userId++;
      }
    }

    for (const user of users) {
      await db.execute(
        'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
        user
      );
    }

    /* ================= COURSES + COURSE LEVELS ================= */
    /*
      These are used by your newer profile/notice/routine/student assignment logic.
      course_levels.id must match student_groups.group_id.
    */

    const courses = [
      [1, 'BSc IT'],
      [2, 'BBA Management'],
    ];

    for (const c of courses) {
      await db.execute(
        'INSERT INTO courses (id, course_name) VALUES (?, ?)',
        c
      );
    }

    const courseLevels = [
      [1, 1, 'Level 6'],
      [2, 1, 'Level 5'],
      [3, 2, 'Level 6'],
      [4, 2, 'Level 5'],
    ];

    for (const cl of courseLevels) {
      await db.execute(
        'INSERT INTO course_levels (id, course_id, level_name) VALUES (?, ?, ?)',
        cl
      );
    }

    /* ================= OLD GROUPS TABLE ================= */
    /*
      Kept because some old pages may still depend on it.
    */

    const groups = [
      [1, 'BSc IT', 'Level 6', 'L6CG7'],
      [2, 'BSc IT', 'Level 5', 'L5CG6'],
      [3, 'BBA Management', 'Level 6', 'M6A'],
      [4, 'BBA Management', 'Level 5', 'M5A'],
    ];

    for (const g of groups) {
      await db.execute(
        'INSERT INTO groups_table (id, course_name, semester, section_name) VALUES (?, ?, ?, ?)',
        g
      );
    }

    /* ================= SUBJECTS ================= */

    const subjects = [
      [1, 'Web Development'],
      [2, 'Database Systems'],
      [3, 'Artificial Intelligence'],
      [4, 'Cyber Security'],
      [5, 'Cloud Computing'],
      [6, 'Project Management'],
      [7, 'Business Strategy'],
      [8, 'Marketing Management'],
      [9, 'Financial Accounting'],
      [10, 'Human Resource Management'],
      [11, 'Organisational Behaviour'],
      [12, 'Business Analytics'],
    ];

    for (const s of subjects) {
      await db.execute(
        'INSERT INTO subjects (id, subject_name) VALUES (?, ?)',
        s
      );
    }

    /* ================= GROUP SUBJECTS ================= */

    const groupSubjects = [
      [1, 1], [1, 2], [1, 3], [1, 4], [1, 5],
      [2, 1], [2, 2], [2, 5], [2, 6],
      [3, 6], [3, 7], [3, 8], [3, 9], [3, 12],
      [4, 7], [4, 8], [4, 9], [4, 10], [4, 11],
    ];

    for (const gs of groupSubjects) {
      await db.execute(
        'INSERT INTO group_subjects (group_id, subject_id) VALUES (?, ?)',
        gs
      );
    }

    /* ================= STUDENT ASSIGNMENT ================= */

    for (let i = 13; i <= 132; i++) {
      const group = Math.floor((i - 13) / 30) + 1;
      await db.execute(
        'INSERT INTO student_groups (student_id, group_id) VALUES (?, ?)',
        [i, group]
      );
    }

    /* ================= FACULTY SUBJECT ================= */

    const facultyAssignments = [
      [2, 1, 1], [3, 2, 1], [4, 3, 1], [5, 4, 1], [6, 5, 1],
      [2, 1, 2], [3, 2, 2], [6, 5, 2], [7, 6, 2],
      [8, 6, 3], [9, 7, 3], [10, 8, 3], [11, 9, 3], [12, 12, 3],
      [9, 7, 4], [10, 8, 4], [11, 9, 4], [12, 10, 4], [8, 11, 4],
    ];

    for (const fa of facultyAssignments) {
      await db.execute(
        'INSERT INTO subject_faculty (faculty_id, subject_id, group_id) VALUES (?, ?, ?)',
        fa
      );
    }

    /* ================= ROUTINES ================= */

    const routines = [
      [1, 1, 2, 'Sunday', '07:00:00', '09:30:00', 'TR-24', 'WLV', '6CS030', 'Workshop'],
      [1, 2, 3, 'Sunday', '10:30:00', '12:30:00', 'LT-02', 'ING', '6CS020', 'Lecture'],
      [1, 3, 4, 'Monday', '10:00:00', '12:00:00', 'LT-02', 'WLV', '6CS012', 'Lecture'],
      [1, 4, 5, 'Tuesday', '12:00:00', '14:00:00', 'TR-02', 'WLV', '6CS014', 'Practical'],
      [1, 2, 3, 'Wednesday', '07:00:00', '09:00:00', 'TR-21', 'ING', '6CS020', 'Tutorial'],
      [1, 5, 6, 'Thursday', '12:30:00', '15:00:00', 'Lab-01', 'WLV', '6CS015', 'Workshop'],

      [2, 1, 2, 'Sunday', '07:00:00', '09:00:00', 'TR-20', 'WLV', '5CS010', 'Lecture'],
      [2, 2, 3, 'Monday', '09:00:00', '11:00:00', 'LT-04', 'ING', '5CS011', 'Workshop'],
      [2, 5, 6, 'Tuesday', '11:00:00', '13:00:00', 'Cloud Lab', 'WLV', '5CS020', 'Practical'],
      [2, 6, 7, 'Wednesday', '13:00:00', '15:00:00', 'MR-05', 'BBA', '5PM101', 'Tutorial'],

      [3, 6, 8, 'Sunday', '08:00:00', '10:00:00', 'MR-01', 'BBA', '6BM101', 'Lecture'],
      [3, 7, 9, 'Monday', '10:00:00', '12:00:00', 'MR-02', 'BBA', '6BM102', 'Tutorial'],
      [3, 8, 10, 'Tuesday', '12:00:00', '14:00:00', 'MR-03', 'BBA', '6BM103', 'Workshop'],
      [3, 9, 11, 'Wednesday', '09:00:00', '11:00:00', 'Finance Lab', 'BBA', '6BM104', 'Practical'],
      [3, 12, 12, 'Thursday', '11:30:00', '13:30:00', 'Analytics', 'BBA', '6BM105', 'Lecture'],

      [4, 7, 9, 'Sunday', '09:00:00', '11:00:00', 'MR-04', 'BBA', '5BM101', 'Lecture'],
      [4, 8, 10, 'Monday', '11:00:00', '13:00:00', 'MR-06', 'BBA', '5BM102', 'Workshop'],
      [4, 9, 11, 'Tuesday', '13:00:00', '15:00:00', 'Finance Lab', 'BBA', '5BM103', 'Practical'],
      [4, 10, 12, 'Wednesday', '08:00:00', '10:00:00', 'MR-07', 'BBA', '5BM104', 'Lecture'],
      [4, 11, 8, 'Thursday', '10:00:00', '12:00:00', 'MR-08', 'BBA', '5BM105', 'Tutorial'],
    ];

    for (const r of routines) {
      await db.execute(
        `INSERT INTO class_routines
        (group_id, subject_id, faculty_id, day_of_week, start_time, end_time, room, block, module_code, class_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        r
      );
    }

    /* ================= NOTICES ================= */

    const notices = [
      ['Welcome to SmartCampus', 'Welcome to the SmartCampus portal. Please check your profile, routine, attendance, events, and notices regularly.', 'all', null, null, 1, '2026-05-23'],
      ['Library Timing Update', 'The campus library will remain open from 8:00 AM to 5:00 PM from Sunday to Friday.', 'all', null, null, 1, '2026-05-24'],
      ['BSc IT Level 6 Practical Reminder', 'Level 6 students must bring laptops for the Web Development practical session.', 'group', 1, null, 1, '2026-05-25'],
      ['BSc IT Level 5 Assignment Notice', 'Level 5 students must submit the Database Systems assignment by Friday.', 'group', 2, null, 1, '2026-05-26'],
      ['BBA Level 6 Presentation Notice', 'BBA Management Level 6 students have a Business Strategy presentation this week.', 'group', 3, null, 1, '2026-05-27'],
      ['BBA Level 5 Workshop Notice', 'BBA Management Level 5 students are requested to attend the Marketing workshop.', 'group', 4, null, 1, '2026-05-28'],
    ];

    for (const n of notices) {
      await db.execute(
        `INSERT INTO notices
        (title, message, audience_type, group_id, subject_id, created_by, publish_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        n
      );
    }

    /* ================= EVENTS ================= */

    const events = [
      ['SmartCampus Orientation', 'Introduction to the SmartCampus system and academic portal usage.', 'Orientation', 'Main Auditorium', 1, '2026-05-24T09:00:00', '2026-05-24T10:30:00', 'all'],
      ['Web Development Workshop', 'Hands-on workshop for HTML, CSS, React, and frontend development workflow.', 'Workshop', 'Lab 2', 2, '2026-05-25T07:00:00', '2026-05-25T09:00:00', 'students'],
      ['Faculty Coordination Meeting', 'Monthly academic coordination meeting for all faculty members.', 'Meeting', 'Conference Room', 1, '2026-05-25T11:00:00', '2026-05-25T12:00:00', 'faculty'],
      ['Database Systems Seminar', 'Seminar on SQL design, normalization, indexing, and database performance.', 'Seminar', 'Hall A', 3, '2026-05-26T10:00:00', '2026-05-26T12:00:00', 'students'],
      ['Cyber Security Awareness', 'Awareness session about phishing, password safety, and online security.', 'Awareness', 'Main Auditorium', 5, '2026-05-26T13:00:00', '2026-05-26T15:00:00', 'all'],
      ['Business Strategy Guest Talk', 'Guest talk on modern business strategy and leadership skills.', 'Guest Talk', 'Seminar Hall', 9, '2026-05-27T09:00:00', '2026-05-27T10:30:00', 'students'],
      ['AI in Education Session', 'Discussion on the role of artificial intelligence in modern education.', 'Seminar', 'Hall B', 4, '2026-05-27T12:00:00', '2026-05-27T14:00:00', 'all'],
      ['Cloud Computing Bootcamp', 'A practical session on cloud platforms, deployment, and DevOps basics.', 'Bootcamp', 'Cloud Lab', 6, '2026-05-28T08:00:00', '2026-05-28T11:00:00', 'students'],
      ['HR Policy Briefing', 'Briefing for faculty members on updated HR and academic conduct policies.', 'Briefing', 'Conference Room', 11, '2026-05-28T14:00:00', '2026-05-28T15:00:00', 'faculty'],
      ['Campus Innovation Fair', 'Students and faculty showcase projects, prototypes, and innovative ideas.', 'Fair', 'Main Ground', 1, '2026-05-29T10:00:00', '2026-05-29T15:00:00', 'all'],
      ['Marketing Management Talk', 'Industry-led session on branding, market research, and consumer behavior.', 'Guest Talk', 'Seminar Hall', 10, '2026-05-30T09:00:00', '2026-05-30T11:00:00', 'students'],
      ['Academic Review Meeting', 'Review meeting for faculty about current semester progress.', 'Meeting', 'Conference Room', 1, '2026-05-30T13:00:00', '2026-05-30T14:30:00', 'faculty'],
    ];

    for (const e of events) {
      await db.execute(
        `INSERT INTO events
        (title, description, event_type, venue, organizer_id, start_datetime, end_datetime, audience_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        e
      );
    }

    /* ================= LOST & FOUND ================= */
    /*
      If your lost_found table columns are different, comment this section.
    */

    const lostFoundItems = [
      ['Lost', 'Black Laptop Charger', 'A black Dell laptop charger was lost near Lab 2.', 'Lab 2', 13, 'pending'],
      ['Found', 'Blue Water Bottle', 'A blue water bottle was found near the library.', 'Library', 1, 'approved'],
      ['Lost', 'Student ID Card', 'Student ID card lost around the main gate.', 'Main Gate', 14, 'pending'],
      ['Found', 'Notebook', 'A notebook with class notes was found in Hall A.', 'Hall A', 1, 'approved'],
    ];

    for (const item of lostFoundItems) {
      try {
        await db.execute(
          `INSERT INTO lost_found
          (type, item_name, description, location, user_id, status)
          VALUES (?, ?, ?, ?, ?, ?)`,
          item
        );
      } catch (error) {
        console.log('Skipping lost_found seed because table columns may differ:', error.message);
        break;
      }
    }

    /* ================= NOTIFICATIONS ================= */

    const notifications = [
      [null, 'student', 'Welcome to SmartCampus', 'Check your dashboard for routines, notices, events, and attendance updates.', 'system'],
      [null, 'faculty', 'Faculty Portal Ready', 'You can manage classes, attendance, reports, and notices from your dashboard.', 'system'],
      [null, 'admin', 'Demo Data Seeded', 'The system has been seeded with users, routines, notices, and events.', 'system'],
      [13, 'student', 'New Group Notice', 'BSc IT Level 6 Practical Reminder', 'notice'],
      [13, 'student', 'New Campus Event', 'SmartCampus Orientation has been scheduled at Main Auditorium.', 'event'],
    ];

    for (const nt of notifications) {
      await db.execute(
        `INSERT INTO notifications
        (user_id, role, title, message, type)
        VALUES (?, ?, ?, ?, ?)`,
        nt
      );
    }

    console.log('Seed completed successfully!');
    console.log('Admin: admin@test.com');
    console.log('Faculty: suman@test.com');
    console.log('Student: l6cg7.student01@test.com');
    console.log('Password: 123456');

    process.exit();
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

seed();