import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Plus,
  Trash2,
  Users,
  BookOpen,
  Layers3,
  CheckCircle,
  Search,
  X,
} from 'lucide-react';
import api from '../../api';
import AdminLayout from './AdminLayout';

const StudentAttendanceManagement = () => {
  const [courses, setCourses] = useState([]);
  const [levels, setLevels] = useState([]);
  const [groups, setGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [groupSubjects, setGroupSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [studentSearch, setStudentSearch] = useState('');
  const [markFilter, setMarkFilter] = useState('all');

  const [courseForm, setCourseForm] = useState({ course_name: '' });

  const [levelForm, setLevelForm] = useState({
    course_id: '',
    level_name: '',
  });

  const [groupForm, setGroupForm] = useState({
    course_name: '',
    semester: '',
    section_name: '',
  });

  const [subjectForm, setSubjectForm] = useState({
    subject_name: '',
    course_name: '',
    semester: '',
  });

  const getFallbackImage = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name || 'Student'
    )}&background=4f46e5&color=ffffff&size=256`;

  const fetchCourses = async () => {
    try {
      const res = await api.get('/student-attendance/courses');
      setCourses(Array.isArray(res.data) ? res.data : []);
    } catch {
      setCourses([]);
    }
  };

  const fetchLevels = async () => {
    try {
      const res = await api.get('/student-attendance/levels');
      setLevels(Array.isArray(res.data) ? res.data : []);
    } catch {
      setLevels([]);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get('/student-attendance/groups');
      setGroups(Array.isArray(res.data) ? res.data : []);
    } catch {
      setGroups([]);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/student-attendance/subjects');
      setSubjects(Array.isArray(res.data) ? res.data : []);
    } catch {
      setSubjects([]);
    }
  };

  const fetchGroupSubjects = async (groupId = '') => {
    try {
      const res = await api.get('/student-attendance/group-subjects', {
        params: groupId ? { group_id: groupId } : {},
      });

      setGroupSubjects(Array.isArray(res.data) ? res.data : []);
    } catch {
      setGroupSubjects([]);
    }
  };

  const fetchStudentsByGroup = async (groupId) => {
    if (!groupId) {
      setStudents([]);
      return;
    }

    try {
      const res = await api.get(
        `/student-attendance/groups/${groupId}/students`
      );

      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch {
      setStudents([]);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await api.get('/student-attendance', {
        params: {
          date: selectedDate,
          group_id: selectedGroup || undefined,
          subject_id: selectedSubject || undefined,
        },
      });

      setAttendance(Array.isArray(res.data) ? res.data : []);
    } catch {
      setAttendance([]);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchLevels();
    fetchGroups();
    fetchSubjects();
    fetchGroupSubjects();
    fetchAttendance();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchStudentsByGroup(selectedGroup);
      fetchGroupSubjects(selectedGroup);
      setSelectedSubject('');
      setStudentSearch('');
      setMarkFilter('all');
    } else {
      setStudents([]);
      fetchGroupSubjects();
      setSelectedSubject('');
      setStudentSearch('');
      setMarkFilter('all');
    }
  }, [selectedGroup]);

  useEffect(() => {
    fetchAttendance();
  }, [selectedGroup, selectedSubject, selectedDate]);

  const levelsForCourseName = (courseName) => {
    const course = courses.find((c) => c.course_name === courseName);

    if (!course) return [];

    return levels.filter((l) => Number(l.course_id) === Number(course.id));
  };

  const filteredGroups = selectedCourse
    ? groups.filter((g) => g.course_name === selectedCourse)
    : [];

  const subjectsForSelectedGroup = selectedGroup
    ? groupSubjects.filter((gs) => String(gs.group_id) === String(selectedGroup))
    : [];

  const selectedSubjectName =
    subjectsForSelectedGroup.find(
      (subject) => String(subject.subject_id) === String(selectedSubject)
    )?.subject_name || 'Selected Subject';

  const attendanceMap = useMemo(() => {
    const map = {};

    attendance.forEach((record) => {
      map[String(record.student_id)] = record;
    });

    return map;
  }, [attendance]);

  const filteredStudents = useMemo(() => {
    const query = studentSearch.toLowerCase().trim();

    return students.filter((student) => {
      const record = attendanceMap[String(student.id)];

      const searchableText = `
        ${student.name || ''}
        ${student.email || ''}
      `.toLowerCase();

      const matchesSearch = searchableText.includes(query);

      let matchesMark = true;

      if (markFilter === 'marked') {
        matchesMark = Boolean(record);
      } else if (markFilter === 'unmarked') {
        matchesMark = !record;
      } else if (['present', 'late', 'absent'].includes(markFilter)) {
        matchesMark = record?.status === markFilter;
      }

      return matchesSearch && matchesMark;
    });
  }, [students, attendanceMap, studentSearch, markFilter]);

  const markedCount = students.filter(
    (student) => attendanceMap[String(student.id)]
  ).length;

  const unmarkedCount = Math.max(students.length - markedCount, 0);

  const presentCount = attendance.filter((a) => a.status === 'present').length;
  const lateCount = attendance.filter((a) => a.status === 'late').length;
  const absentCount = attendance.filter((a) => a.status === 'absent').length;

  const hasStudentFilters = studentSearch || markFilter !== 'all';

  const resetStudentFilters = () => {
    setStudentSearch('');
    setMarkFilter('all');
  };

  const refreshSetupData = async () => {
    await fetchCourses();
    await fetchLevels();
    await fetchGroups();
    await fetchSubjects();
    await fetchGroupSubjects();
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();

    try {
      await api.post('/student-attendance/courses', courseForm);
      setCourseForm({ course_name: '' });
      await refreshSetupData();
      alert('Course created successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create course');
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Delete this course? Its levels will also be deleted.')) {
      return;
    }

    try {
      await api.delete(`/student-attendance/courses/${id}`);
      await refreshSetupData();
      alert('Course deleted successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete course');
    }
  };

  const handleCreateLevel = async (e) => {
    e.preventDefault();

    try {
      await api.post('/student-attendance/levels', levelForm);
      setLevelForm({ course_id: '', level_name: '' });
      await refreshSetupData();
      alert('Level created successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create level');
    }
  };

  const handleDeleteLevel = async (id) => {
    if (!window.confirm('Delete this level?')) return;

    try {
      await api.delete(`/student-attendance/levels/${id}`);
      await refreshSetupData();
      alert('Level deleted successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete level');
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    try {
      await api.post('/student-attendance/groups', groupForm);

      setGroupForm({
        course_name: '',
        semester: '',
        section_name: '',
      });

      await refreshSetupData();
      alert('Section created successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create section');
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();

    try {
      await api.post('/student-attendance/subjects', subjectForm);

      setSubjectForm({
        subject_name: '',
        course_name: '',
        semester: '',
      });

      await refreshSetupData();
      alert('Subject created successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create subject');
    }
  };

  const handleDeleteSubject = async (id) => {
    if (
      !window.confirm(
        'Delete this subject? Related assignments/attendance may be removed.'
      )
    ) {
      return;
    }

    try {
      await api.delete(`/student-attendance/subjects/${id}`);
      await refreshSetupData();
      alert('Subject deleted successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete subject');
    }
  };

  const handleMarkAttendance = async (studentId, status) => {
    if (!selectedCourse || !selectedGroup || !selectedSubject) {
      alert('Please select course, section and subject first');
      return;
    }

    if (!status) return;

    try {
      await api.post('/student-attendance', {
        student_id: Number(studentId),
        subject_id: Number(selectedSubject),
        group_id: Number(selectedGroup),
        faculty_id: null,
        date: selectedDate,
        status,
      });

      fetchAttendance();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const handleMarkAllPresent = async () => {
    if (!selectedCourse || !selectedGroup || !selectedSubject) {
      alert('Please select course, section and subject first');
      return;
    }

    if (students.length === 0) {
      alert('No students found in this section');
      return;
    }

    try {
      for (const student of students) {
        await api.post('/student-attendance', {
          student_id: Number(student.id),
          subject_id: Number(selectedSubject),
          group_id: Number(selectedGroup),
          faculty_id: null,
          date: selectedDate,
          status: 'present',
        });
      }

      await fetchAttendance();
      alert('All students marked present');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to mark all present');
    }
  };

  const handleDeleteAttendance = async (id) => {
    if (!window.confirm('Delete this attendance record?')) return;

    try {
      await api.delete(`/student-attendance/${id}`);
      fetchAttendance();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete attendance');
    }
  };

  const getStatusClass = (status) => {
    if (status === 'present') return 'bg-emerald-100 text-emerald-600';
    if (status === 'late') return 'bg-amber-100 text-amber-600';
    if (status === 'absent') return 'bg-rose-100 text-rose-600';

    return 'bg-slate-100 text-slate-500';
  };

  const getAttendanceDropdownClass = (status) => {
    if (status === 'present') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500';
    }

    if (status === 'late') {
      return 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-500';
    }

    if (status === 'absent') {
      return 'bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-500';
    }

    return 'bg-slate-50 text-slate-600 border-slate-200 focus:ring-indigo-500';
  };

  const formatDateOnly = (value) => {
    if (!value) return '';

    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value).slice(0, 10);
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const summaryCards = [
    {
      label: 'Total Sections',
      value: groups.length,
      icon: Layers3,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
    },
    {
      label: 'Subjects',
      value: subjects.length,
      icon: BookOpen,
      color: 'text-violet-600',
      bg: 'bg-violet-100',
    },
    {
      label: 'Loaded Students',
      value: students.length,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      label: 'Attendance Records',
      value: attendance.length,
      icon: CalendarDays,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
  ];

  return (
    <AdminLayout
      pageLabel="Admin Module"
      title="Attendance Management"
      subtitle="Create courses, levels, subjects, sections, and manage student attendance."
    >
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
          >
            <div
              className={`w-14 h-14 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center mb-5`}
            >
              <card.icon size={24} />
            </div>

            <p className="text-slate-500 text-sm font-bold">{card.label}</p>

            <h3 className="text-3xl font-black text-slate-800 mt-1">
              {card.value}
            </h3>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-800 mb-2">
            Create Course
          </h2>

          <p className="text-sm text-slate-500 font-medium mb-5">
            Add new courses such as BSc Computing or BBA Management.
          </p>

          <form onSubmit={handleCreateCourse} className="space-y-4">
            <input
              type="text"
              placeholder="Course e.g. BSc Computing"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              value={courseForm.course_name}
              onChange={(e) => setCourseForm({ course_name: e.target.value })}
              required
            />

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Create Course
            </button>
          </form>

          <div className="mt-5 space-y-2">
            {courses.map((course) => (
              <div
                key={course.id}
                className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3"
              >
                <span className="font-bold text-slate-700">
                  {course.course_name}
                </span>

                <button
                  onClick={() => handleDeleteCourse(course.id)}
                  className="text-rose-500 hover:bg-rose-50 p-2 rounded-xl"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-800 mb-2">
            Create Level
          </h2>

          <p className="text-sm text-slate-500 font-medium mb-5">
            Add levels under each course, such as Level 4, Level 5, or Level 6.
          </p>

          <form onSubmit={handleCreateLevel} className="space-y-4">
            <select
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              value={levelForm.course_id}
              onChange={(e) =>
                setLevelForm({ ...levelForm, course_id: e.target.value })
              }
              required
            >
              <option value="">Select Course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.course_name}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Level e.g. Level 6"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              value={levelForm.level_name}
              onChange={(e) =>
                setLevelForm({ ...levelForm, level_name: e.target.value })
              }
              required
            />

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Create Level
            </button>
          </form>

          <div className="mt-5 space-y-2 max-h-56 overflow-y-auto">
            {levels.map((level) => (
              <div
                key={level.id}
                className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3"
              >
                <span className="font-bold text-slate-700">
                  {level.course_name} - {level.level_name}
                </span>

                <button
                  onClick={() => handleDeleteLevel(level.id)}
                  className="text-rose-500 hover:bg-rose-50 p-2 rounded-xl"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-800 mb-2">
            Create Section
          </h2>

          <p className="text-sm text-slate-500 font-medium mb-5">
            Matching subjects and demo students will be attached automatically.
          </p>

          <form onSubmit={handleCreateGroup} className="space-y-4">
            <select
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              value={groupForm.course_name}
              onChange={(e) =>
                setGroupForm({
                  ...groupForm,
                  course_name: e.target.value,
                  semester: '',
                })
              }
              required
            >
              <option value="">Select Course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.course_name}>
                  {course.course_name}
                </option>
              ))}
            </select>

            <select
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              value={groupForm.semester}
              onChange={(e) =>
                setGroupForm({ ...groupForm, semester: e.target.value })
              }
              required
              disabled={!groupForm.course_name}
            >
              <option value="">Select Level/Semester</option>
              {levelsForCourseName(groupForm.course_name).map((level) => (
                <option key={level.id} value={level.level_name}>
                  {level.level_name}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Section e.g. L6CG7"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              value={groupForm.section_name}
              onChange={(e) =>
                setGroupForm({ ...groupForm, section_name: e.target.value })
              }
              required
            />

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Create Section
            </button>
          </form>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-800 mb-2">
            Create Subject
          </h2>

          <p className="text-sm text-slate-500 font-medium mb-5">
            Create a subject for a specific course and level.
          </p>

          <form onSubmit={handleCreateSubject} className="space-y-4">
            <input
              type="text"
              placeholder="Subject Name e.g. Web Development"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              value={subjectForm.subject_name}
              onChange={(e) =>
                setSubjectForm({ ...subjectForm, subject_name: e.target.value })
              }
              required
            />

            <select
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              value={subjectForm.course_name}
              onChange={(e) =>
                setSubjectForm({
                  ...subjectForm,
                  course_name: e.target.value,
                  semester: '',
                })
              }
              required
            >
              <option value="">Select Course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.course_name}>
                  {course.course_name}
                </option>
              ))}
            </select>

            <select
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              value={subjectForm.semester}
              onChange={(e) =>
                setSubjectForm({ ...subjectForm, semester: e.target.value })
              }
              required
              disabled={!subjectForm.course_name}
            >
              <option value="">Select Level/Semester</option>
              {levelsForCourseName(subjectForm.course_name).map((level) => (
                <option key={level.id} value={level.level_name}>
                  {level.level_name}
                </option>
              ))}
            </select>

            <div className="px-4 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 font-medium">
              This subject will auto-attach when creating a matching course and level section.
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Create Subject
            </button>
          </form>

          <div className="mt-5 space-y-2 max-h-56 overflow-y-auto">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3"
              >
                <span className="font-bold text-slate-700">
                  {subject.subject_name} - {subject.course_name} -{' '}
                  {subject.semester}
                </span>

                <button
                  onClick={() => handleDeleteSubject(subject.id)}
                  className="text-rose-500 hover:bg-rose-50 p-2 rounded-xl"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-8">
        <h2 className="text-xl font-black text-slate-800 mb-5">
          Attendance Controls
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setSelectedGroup('');
              setSelectedSubject('');
              setStudents([]);
              setAttendance([]);
              setStudentSearch('');
              setMarkFilter('all');
            }}
          >
            <option value="">Select Course</option>

            {courses.map((course) => (
              <option key={course.id} value={course.course_name}>
                {course.course_name}
              </option>
            ))}
          </select>

          <select
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedGroup}
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              setSelectedSubject('');
              setAttendance([]);
              setStudentSearch('');
              setMarkFilter('all');
            }}
            disabled={!selectedCourse}
          >
            <option value="">Select Section</option>

            {filteredGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.semester} - {g.section_name}
              </option>
            ))}
          </select>

          <select
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setStudentSearch('');
              setMarkFilter('all');
            }}
            disabled={!selectedGroup}
          >
            <option value="">Select Subject</option>

            {subjectsForSelectedGroup.map((s) => (
              <option key={s.subject_id} value={s.subject_id}>
                {s.subject_name}
              </option>
            ))}
          </select>

          <input
            type="date"
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={fetchAttendance}
            className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all"
          >
            Filter Attendance Records
          </button>

          <button
            onClick={handleMarkAllPresent}
            disabled={!selectedGroup || !selectedSubject || students.length === 0}
            className="px-5 py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <CheckCircle size={18} />
            Mark All Present
          </button>
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-8">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-black text-slate-800">
              Smart Student Filters
            </h2>

            <p className="text-sm text-slate-500 font-medium mt-1">
              {filteredStudents.length} of {students.length} student
              {students.length !== 1 ? 's' : ''} shown
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 w-full xl:w-auto">
            <div className="relative xl:col-span-2">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search student name/email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />

              {studentSearch && (
                <button
                  type="button"
                  onClick={() => setStudentSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 font-black"
                >
                  ×
                </button>
              )}
            </div>

            <select
              value={markFilter}
              onChange={(e) => setMarkFilter(e.target.value)}
              className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">All Students</option>
              <option value="marked">Marked Only</option>
              <option value="unmarked">Unmarked Only</option>
              <option value="present">Present Only</option>
              <option value="late">Late Only</option>
              <option value="absent">Absent Only</option>
            </select>
          </div>
        </div>

        {selectedGroup && selectedSubject && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
            <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600">
              <p className="text-xs font-black uppercase">Students</p>
              <h3 className="text-2xl font-black mt-1">{students.length}</h3>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600">
              <p className="text-xs font-black uppercase">Present</p>
              <h3 className="text-2xl font-black mt-1">{presentCount}</h3>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 text-amber-600">
              <p className="text-xs font-black uppercase">Late</p>
              <h3 className="text-2xl font-black mt-1">{lateCount}</h3>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 text-rose-600">
              <p className="text-xs font-black uppercase">Absent</p>
              <h3 className="text-2xl font-black mt-1">{absentCount}</h3>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 text-slate-600">
              <p className="text-xs font-black uppercase">Unmarked</p>
              <h3 className="text-2xl font-black mt-1">{unmarkedCount}</h3>
            </div>
          </div>
        )}

        {hasStudentFilters && (
          <button
            type="button"
            onClick={resetStudentFilters}
            className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-600 text-sm font-black hover:bg-slate-200 flex items-center gap-2"
          >
            <X size={15} />
            Clear Student Filters
          </button>
        )}
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Users className="text-indigo-600" size={24} />

              <div>
                <h2 className="text-xl font-black text-slate-800">
                  Students in Selected Section
                </h2>

                <p className="text-sm text-slate-500 font-medium mt-1">
                  Update attendance using dropdown. Present, Late and Absent are
                  saved instantly.
                </p>
              </div>
            </div>

            {selectedGroup && (
              <span className="px-4 py-2 rounded-2xl bg-indigo-50 text-indigo-600 font-bold text-sm">
                Showing: {filteredStudents.length}/{students.length}
              </span>
            )}
          </div>
        </div>

        {!selectedCourse ? (
          <div className="p-10 text-center text-slate-500 font-medium">
            Select course first.
          </div>
        ) : !selectedGroup ? (
          <div className="p-10 text-center text-slate-500 font-medium">
            Select section to load students.
          </div>
        ) : !selectedSubject ? (
          <div className="p-10 text-center text-slate-500 font-medium">
            Select subject to mark attendance.
          </div>
        ) : students.length === 0 ? (
          <div className="p-10 text-center text-slate-500 font-medium">
            No students assigned to this section.
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-10 text-center text-slate-500 font-medium">
            No students match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-262.5">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                    Student
                  </th>

                  <th className="px-4 py-4 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                    Email
                  </th>

                  <th className="px-4 py-4 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                    Subject
                  </th>

                  <th className="px-4 py-4 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                    Date
                  </th>

                  <th className="px-4 py-4 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                    Current Status
                  </th>

                  <th className="px-4 py-4 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                    Update
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((student) => {
                  const record = attendanceMap[String(student.id)];
                  const currentStatus = record?.status || 'unmarked';

                  return (
                    <tr
                      key={student.id}
                      className="border-t border-slate-100 hover:bg-slate-50 transition-all"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              student.profile_image ||
                              getFallbackImage(student.name)
                            }
                            alt={student.name}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200 bg-slate-100"
                            onError={(e) => {
                              e.currentTarget.src = getFallbackImage(
                                student.name
                              );
                            }}
                          />

                          <p className="font-bold text-slate-800">
                            {student.name}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-500 font-medium">
                        {student.email}
                      </td>

                      <td className="px-4 py-4 text-slate-700 font-medium">
                        {selectedSubjectName}
                      </td>

                      <td className="px-4 py-4 text-slate-500 font-medium">
                        {selectedDate}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex px-3 py-2 rounded-2xl text-xs font-black uppercase ${getStatusClass(
                            currentStatus
                          )}`}
                        >
                          {currentStatus}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <select
                          value={
                            currentStatus === 'unmarked' ? '' : currentStatus
                          }
                          onChange={(e) =>
                            handleMarkAttendance(student.id, e.target.value)
                          }
                          className={`px-4 py-3 rounded-2xl border outline-none focus:ring-2 font-bold min-w-40 capitalize ${getAttendanceDropdownClass(
                            currentStatus
                          )}`}
                        >
                          <option value="">Select Status</option>
                          <option value="present">Present</option>
                          <option value="late">Late</option>
                          <option value="absent">Absent</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-800">
            Saved Attendance History
          </h2>

          <p className="text-sm text-slate-500 font-medium mt-1">
            Review saved attendance records or delete incorrect entries.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-250">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-black uppercase text-slate-400">
                  Student
                </th>

                <th className="px-4 py-4 text-left text-xs font-black uppercase text-slate-400">
                  Course / Section
                </th>

                <th className="px-4 py-4 text-left text-xs font-black uppercase text-slate-400">
                  Subject
                </th>

                <th className="px-4 py-4 text-left text-xs font-black uppercase text-slate-400">
                  Date
                </th>

                <th className="px-4 py-4 text-left text-xs font-black uppercase text-slate-400">
                  Status
                </th>

                <th className="px-4 py-4 text-right text-xs font-black uppercase text-slate-400">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {attendance.length > 0 ? (
                attendance.map((record) => (
                  <tr
                    key={record.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-800">
                        {record.student_name}
                      </p>

                      <p className="text-sm text-slate-500">
                        {record.student_email}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-slate-600 font-medium">
                      {record.course_name} / {record.semester} /{' '}
                      {record.section_name}
                    </td>

                    <td className="px-4 py-4 text-slate-600 font-medium">
                      {record.subject_name}
                    </td>

                    <td className="px-4 py-4 text-slate-600 font-medium">
                      {formatDateOnly(record.date)}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase ${getStatusClass(
                          record.status
                        )}`}
                      >
                        {record.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => handleDeleteAttendance(record.id)}
                        className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 inline-flex items-center justify-center"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-10 text-center text-slate-500 font-medium"
                  >
                    No attendance records found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  );
};

export default StudentAttendanceManagement;