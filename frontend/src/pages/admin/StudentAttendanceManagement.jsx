import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  Plus,
  Trash2,
  Users,
  BookOpen,
  Layers3,
} from 'lucide-react';
import api from '../../api';
import AdminLayout from './AdminLayout';

const StudentAttendanceManagement = () => {
  const [groups, setGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [allFaculty, setAllFaculty] = useState([]);

  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [groupForm, setGroupForm] = useState({
    course_name: '',
    semester: '',
    section_name: '',
  });

  const [subjectForm, setSubjectForm] = useState({
    subject_name: '',
    group_id: '',
    faculty_ids: [],
  });

  const [assignForm, setAssignForm] = useState({
    student_id: '',
    group_id: '',
  });

  const fetchGroups = async () => {
    try {
      const res = await api.get('/student-attendance/groups');
      setGroups(res.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to fetch groups');
    }
  };

  const fetchSubjects = async (groupId = '') => {
    try {
      const res = await api.get('/student-attendance/subjects', {
        params: groupId ? { group_id: groupId } : {},
      });
      setSubjects(res.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to fetch subjects');
    }
  };

  const fetchStudentsByGroup = async (groupId) => {
    try {
      if (!groupId) {
        setStudents([]);
        return;
      }

      const res = await api.get(`/student-attendance/groups/${groupId}/students`);
      setStudents(res.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to fetch students');
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
      setAttendance(res.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to fetch attendance');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setAllStudents(res.data.filter((u) => u.role === 'student'));
      setAllFaculty(res.data.filter((u) => u.role === 'faculty'));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to fetch users');
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchSubjects();
    fetchAttendance();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchStudentsByGroup(selectedGroup);
      fetchSubjects(selectedGroup);
    } else {
      setStudents([]);
      fetchSubjects();
    }
  }, [selectedGroup]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    try {
      await api.post('/student-attendance/groups', groupForm);
      setGroupForm({
        course_name: '',
        semester: '',
        section_name: '',
      });
      fetchGroups();
      alert('Group created successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create group');
    }
  };

  const handleFacultyMultiSelect = (e) => {
    const values = Array.from(e.target.selectedOptions, (option) => Number(option.value));
    setSubjectForm({ ...subjectForm, faculty_ids: values });
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();

    try {
      await api.post('/student-attendance/subjects', subjectForm);
      setSubjectForm({
        subject_name: '',
        group_id: '',
        faculty_ids: [],
      });
      fetchSubjects(selectedGroup);
      alert('Subject created successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create subject');
    }
  };

  const handleAssignStudent = async (e) => {
    e.preventDefault();

    try {
      await api.post('/student-attendance/assign-student', assignForm);
      setAssignForm({
        student_id: '',
        group_id: '',
      });

      if (selectedGroup) {
        fetchStudentsByGroup(selectedGroup);
      }

      alert('Student assigned successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to assign student');
    }
  };

  const handleMarkAttendance = async (studentId, status) => {
    if (!selectedSubject) {
      alert('Please select a subject first');
      return;
    }

    try {
      await api.post('/student-attendance', {
        student_id: studentId,
        subject_id: selectedSubject,
        faculty_id: null,
        date: selectedDate,
        status,
      });

      fetchAttendance();
      alert('Attendance saved successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const handleDeleteAttendance = async (id) => {
    const confirmDelete = window.confirm('Delete this attendance record?');
    if (!confirmDelete) return;

    try {
      await api.delete(`/student-attendance/${id}`);
      fetchAttendance();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete attendance');
    }
  };

  const summaryCards = [
    {
      label: 'Total Groups',
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
      label: 'Assigned Students',
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
      subtitle="Organize classes, subjects, student groups, and daily attendance records."
    >
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
          >
            <div className={`w-14 h-14 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center mb-5`}>
              <card.icon size={24} />
            </div>
            <p className="text-slate-500 text-sm font-bold">{card.label}</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1">{card.value}</h3>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-800 mb-4">Create Group</h2>
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <input
              type="text"
              placeholder="Course Name (e.g. BSc CS)"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              value={groupForm.course_name}
              onChange={(e) =>
                setGroupForm({ ...groupForm, course_name: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Semester (e.g. Semester 5)"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              value={groupForm.semester}
              onChange={(e) =>
                setGroupForm({ ...groupForm, semester: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Section (e.g. A)"
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
              Create Group
            </button>
          </form>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-800 mb-4">Create Subject</h2>
          <form onSubmit={handleCreateSubject} className="space-y-4">
            <input
              type="text"
              placeholder="Subject Name"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              value={subjectForm.subject_name}
              onChange={(e) =>
                setSubjectForm({ ...subjectForm, subject_name: e.target.value })
              }
              required
            />

            <select
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              value={subjectForm.group_id}
              onChange={(e) =>
                setSubjectForm({ ...subjectForm, group_id: e.target.value })
              }
              required
            >
              <option value="">Select Group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.course_name} - {g.semester} - Section {g.section_name}
                </option>
              ))}
            </select>

            <select
              multiple
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 min-h-35"
              value={subjectForm.faculty_ids.map(String)}
              onChange={handleFacultyMultiSelect}
            >
              {allFaculty.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>

            <p className="text-xs text-slate-400 font-medium">
              Hold Ctrl (Windows) or Cmd (Mac) to select multiple faculty members.
            </p>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Create Subject
            </button>
          </form>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-800 mb-4">Assign Student</h2>
          <form onSubmit={handleAssignStudent} className="space-y-4">
            <select
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              value={assignForm.student_id}
              onChange={(e) =>
                setAssignForm({ ...assignForm, student_id: e.target.value })
              }
              required
            >
              <option value="">Select Student</option>
              {allStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </select>

            <select
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              value={assignForm.group_id}
              onChange={(e) =>
                setAssignForm({ ...assignForm, group_id: e.target.value })
              }
              required
            >
              <option value="">Select Group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.course_name} - {g.semester} - Section {g.section_name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Assign Student
            </button>
          </form>
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedGroup}
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              setSelectedSubject('');
            }}
          >
            <option value="">Select Group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.course_name} - {g.semester} - Section {g.section_name}
              </option>
            ))}
          </select>

          <select
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">Select Subject</option>
            {subjects
              .filter((s) => !selectedGroup || String(s.group_id) === String(selectedGroup))
              .map((s) => (
                <option key={s.id} value={s.id}>
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

        <div className="mt-4">
          <button
            onClick={fetchAttendance}
            className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all"
          >
            Filter Attendance
          </button>
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-8">
        <h2 className="text-xl font-black text-slate-800 mb-4">Mark Attendance</h2>

        {!selectedGroup ? (
          <p className="text-slate-500 font-medium">
            Select a group first to load students.
          </p>
        ) : students.length === 0 ? (
          <p className="text-slate-500 font-medium">
            No students assigned to this group yet.
          </p>
        ) : (
          <div className="space-y-4">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100"
              >
                <div>
                  <p className="font-bold text-slate-800">{student.name}</p>
                  <p className="text-sm text-slate-500">{student.email}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleMarkAttendance(student.id, 'present')}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600"
                  >
                    Present
                  </button>
                  <button
                    onClick={() => handleMarkAttendance(student.id, 'late')}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600"
                  >
                    Late
                  </button>
                  <button
                    onClick={() => handleMarkAttendance(student.id, 'absent')}
                    className="px-4 py-2 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600"
                  >
                    Absent
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-800">Attendance Records</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            View attendance by course, section, subject, and date
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-250">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Student
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Email
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Course
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Subject
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Date
                </th>
                <th className="text-right px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {attendance.map((a, index) => (
                <tr
                  key={a.id}
                  className={`border-t border-slate-100 hover:bg-slate-50 ${
                    index === 0 ? 'border-t-0' : ''
                  }`}
                >
                  <td className="px-6 py-5 font-bold text-slate-800">{a.student_name}</td>
                  <td className="px-6 py-5 text-slate-500 font-medium">{a.student_email}</td>
                  <td className="px-6 py-5 text-slate-700 font-medium">
                    {a.course_name} - {a.semester} - {a.section_name}
                  </td>
                  <td className="px-6 py-5 text-slate-700 font-medium">{a.subject_name}</td>
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex px-3 py-2 rounded-2xl text-sm font-bold capitalize ${
                        a.status === 'present'
                          ? 'bg-emerald-100 text-emerald-600'
                          : a.status === 'late'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-rose-100 text-rose-600'
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-slate-500 font-medium">
                    {new Date(a.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button
                      onClick={() => handleDeleteAttendance(a.id)}
                      className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all inline-flex items-center justify-center"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {attendance.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-10 text-center text-slate-500 font-medium"
                  >
                    No attendance records found.
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