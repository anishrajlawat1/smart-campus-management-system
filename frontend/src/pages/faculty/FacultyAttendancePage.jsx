import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  BookOpen,
  CalendarDays,
  Users,
  Bell,
  LogOut,
  ArrowUpRight,
  ClipboardList,
} from 'lucide-react';
import api from '../../api';

const facultyModules = [
  {
    title: 'Mark Attendance',
    icon: CheckSquare,
    path: '/faculty/attendance',
  },
  {
    title: 'My Classes',
    icon: BookOpen,
    path: '/faculty/classes',
  },
  {
    title: 'Create Notice',
    icon: Bell,
    path: '/faculty/notices',
  },
  {
    title: 'Reports',
    icon: ClipboardList,
    path: '/faculty/reports',
  },
];

const FacultyLayout = ({
  pageLabel = 'Faculty Module',
  title = 'Faculty Page',
  subtitle = 'Manage your academic tasks.',
  children,
}) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const currentPath = window.location.pathname;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex">
      <aside className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col">
        <div className="p-8 border-b border-slate-100">
          <h2 className="text-2xl font-black text-indigo-600 tracking-tighter italic">
            SmartCampus
          </h2>
          <p className="text-xs text-slate-400 font-bold tracking-[0.2em] uppercase mt-2">
            Faculty Panel
          </p>
        </div>

        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">
            Main
          </p>

          <div className="space-y-2">
            {facultyModules.map((m) => {
              const isActive = currentPath === m.path;

              return (
                <div
                  key={m.title}
                  onClick={() => navigate(m.path)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all group ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <m.icon size={20} />
                    <span className="font-semibold">{m.title}</span>
                  </div>

                  <ArrowUpRight
                    size={16}
                    className={`transition-opacity ${
                      isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-4 mb-3">
            <p className="text-sm font-bold text-slate-800">{user?.name || 'Faculty User'}</p>
            <p className="text-xs text-slate-500 mt-1">Faculty Member</p>
          </div>

          <div
            onClick={handleLogout}
            className="flex items-center space-x-3 p-3.5 text-rose-500 hover:bg-rose-50 rounded-2xl cursor-pointer font-bold transition-all"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-start mb-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">
              {pageLabel}
            </p>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">
              {title}
            </h1>
            <p className="text-slate-500 font-medium mt-2">{subtitle}</p>
          </div>

          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
            <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200">
              {user?.name?.charAt(0)?.toUpperCase() || 'F'}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-slate-800">{user?.name || 'Faculty'}</p>
              <p className="text-xs text-slate-500">Faculty Dashboard</p>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
};

const FacultyAttendancePage = () => {
  const user = JSON.parse(localStorage.getItem('user'));

  const [groups, setGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const fetchGroups = async () => {
    try {
      const res = await api.get('/student-attendance/groups', {
        params: { faculty_id: user?.id },
      });
      setGroups(res.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to fetch groups');
    }
  };

  const fetchSubjects = async (groupId = '') => {
    try {
      const params = {
        faculty_id: user?.id,
      };

      if (groupId) params.group_id = groupId;

      const res = await api.get('/student-attendance/subjects', { params });
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

  useEffect(() => {
    fetchGroups();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchStudentsByGroup(selectedGroup);
      fetchSubjects(selectedGroup);
    } else {
      setStudents([]);
      setSubjects([]);
      setSelectedSubject('');
    }
  }, [selectedGroup]);

  useEffect(() => {
    if (selectedSubject && selectedDate) {
      fetchAttendance();
    } else {
      setAttendance([]);
    }
  }, [selectedSubject, selectedDate, selectedGroup]);

  const markAttendance = async (studentId, status) => {
    if (!selectedSubject) {
      alert('Please select a subject first');
      return;
    }

    try {
      await api.post('/student-attendance', {
        student_id: studentId,
        subject_id: selectedSubject,
        faculty_id: user?.id,
        date: selectedDate,
        status,
      });

      fetchAttendance();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save attendance');
    }
  };

  const getStudentAttendanceStatus = (studentId) => {
    return attendance.find(
      (record) =>
        String(record.student_id) === String(studentId) &&
        String(record.subject_id) === String(selectedSubject)
    );
  };

  const totalStudents = students.length;
  const markedCount = attendance.length;
  const presentCount = attendance.filter((a) => a.status === 'present').length;
  const absentCount = attendance.filter((a) => a.status === 'absent').length;
  const lateCount = attendance.filter((a) => a.status === 'late').length;

  const summaryCards = [
    {
      label: 'Students in Group',
      value: totalStudents,
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
    },
    {
      label: 'Marked Records',
      value: markedCount,
      icon: CheckSquare,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      label: 'Present',
      value: presentCount,
      icon: CheckSquare,
      color: 'text-sky-600',
      bg: 'bg-sky-100',
    },
    {
      label: 'Late / Absent',
      value: lateCount + absentCount,
      icon: ClipboardList,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
  ];

  return (
    <FacultyLayout
      pageLabel="Faculty Module"
      title="Mark Student Attendance"
      subtitle="Select your class and record attendance for students."
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
            <h3 className="text-3xl font-black text-slate-800 mt-1">{card.value}</h3>
          </div>
        ))}
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-8">
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-800">Attendance Controls</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Select your assigned group, subject, and date.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedGroup}
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              setSelectedSubject('');
              setAttendance([]);
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
            className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={!selectedGroup}
          >
            <option value="">Select Subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.subject_name}
              </option>
            ))}
          </select>

          <div className="relative">
            <CalendarDays
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="date"
              className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={fetchAttendance}
            className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all"
          >
            Load Attendance
          </button>
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-8">
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-800">Student List</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Existing attendance from admin or faculty will appear here automatically.
          </p>
        </div>

        {!selectedGroup ? (
          <div className="text-slate-500 font-medium">Please select a group first.</div>
        ) : students.length === 0 ? (
          <div className="text-slate-500 font-medium">No students found for this group.</div>
        ) : (
          <div className="space-y-4">
            {students.map((student) => {
              const existingAttendance = getStudentAttendanceStatus(student.id);

              return (
                <div
                  key={student.id}
                  className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100"
                >
                  <div>
                    <p className="font-bold text-slate-800">{student.name}</p>
                    <p className="text-sm text-slate-500 font-medium">{student.email}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Current Status:{' '}
                      <span
                        className={`font-bold capitalize ${
                          existingAttendance?.status === 'present'
                            ? 'text-emerald-600'
                            : existingAttendance?.status === 'late'
                            ? 'text-amber-600'
                            : existingAttendance?.status === 'absent'
                            ? 'text-rose-600'
                            : 'text-slate-600'
                        }`}
                      >
                        {existingAttendance ? existingAttendance.status : 'Not marked'}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => markAttendance(student.id, 'present')}
                      className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600"
                    >
                      Present
                    </button>

                    <button
                      onClick={() => markAttendance(student.id, 'late')}
                      className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600"
                    >
                      Late
                    </button>

                    <button
                      onClick={() => markAttendance(student.id, 'absent')}
                      className="px-4 py-2 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600"
                    >
                      Absent
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black text-slate-800">Attendance Records</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Records for the selected subject and date
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-237.5">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Student
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Email
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
              </tr>
            </thead>

            <tbody>
              {attendance.map((record, index) => (
                <tr
                  key={record.id}
                  className={`border-t border-slate-100 hover:bg-slate-50 transition-all ${
                    index === 0 ? 'border-t-0' : ''
                  }`}
                >
                  <td className="px-6 py-5 font-bold text-slate-800">
                    {record.student_name}
                  </td>
                  <td className="px-6 py-5 text-slate-500 font-medium">
                    {record.student_email}
                  </td>
                  <td className="px-6 py-5 text-slate-700 font-medium">
                    {record.subject_name}
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex px-3 py-2 rounded-2xl text-sm font-bold capitalize ${
                        record.status === 'present'
                          ? 'bg-emerald-100 text-emerald-600'
                          : record.status === 'late'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-rose-100 text-rose-600'
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-slate-500 font-medium">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                </tr>
              ))}

              {attendance.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
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
    </FacultyLayout>
  );
};

export default FacultyAttendancePage;