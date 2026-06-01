import React, { useEffect, useState } from 'react';
import { Users, CheckCircle, XCircle, Clock, CalendarDays } from 'lucide-react';
import AdminLayout from './AdminLayout';
import api from '../../api';

const FacultyAttendanceManagement = () => {
  const [faculty, setFaculty] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedCourse, setSelectedCourse] = useState('');

  const fetchFaculty = async () => {
    try {
      const res = await api.get('/faculty-attendance/faculty');
      setFaculty(Array.isArray(res.data) ? res.data : []);
    } catch {
      alert('Failed to load faculty');
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/student-attendance/faculty-subjects');
      setAssignments(Array.isArray(res.data) ? res.data : []);
    } catch {
      setAssignments([]);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await api.get('/faculty-attendance', {
        params: { date: selectedDate },
      });

      const map = {};
      res.data.forEach((item) => {
        map[item.faculty_id] = item.status;
      });

      setAttendance(map);
    } catch {
      setAttendance({});
    }
  };

  useEffect(() => {
    fetchFaculty();
    fetchAssignments();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const courses = [
    ...new Set(assignments.map((a) => a.course_name).filter(Boolean)),
  ];

  const getFacultyCourses = (facultyId) => {
    return [
      ...new Set(
        assignments
          .filter((a) => Number(a.faculty_id) === Number(facultyId))
          .map((a) => a.course_name)
          .filter(Boolean)
      ),
    ];
  };

  const getFacultySubjects = (facultyId) => {
    return [
      ...new Set(
        assignments
          .filter((a) => Number(a.faculty_id) === Number(facultyId))
          .map((a) => a.subject_name)
          .filter(Boolean)
      ),
    ];
  };

  const filteredFaculty = selectedCourse
    ? faculty.filter((f) => getFacultyCourses(f.id).includes(selectedCourse))
    : faculty;

  const markAttendance = async (facultyId, status) => {
    if (!status) return;

    try {
      await api.post('/faculty-attendance', {
        faculty_id: facultyId,
        date: selectedDate,
        status,
      });

      setAttendance((prev) => ({
        ...prev,
        [facultyId]: status,
      }));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const getStatusClass = (status) => {
    if (status === 'present') return 'bg-emerald-100 text-emerald-600';
    if (status === 'absent') return 'bg-rose-100 text-rose-600';
    if (status === 'leave') return 'bg-amber-100 text-amber-600';
    return 'bg-slate-100 text-slate-500';
  };

  const getDropdownClass = (status) => {
    if (status === 'present') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500';
    }

    if (status === 'absent') {
      return 'bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-500';
    }

    if (status === 'leave') {
      return 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-500';
    }

    return 'bg-slate-50 text-slate-600 border-slate-200 focus:ring-indigo-500';
  };

  const getInitials = (name) => {
    if (!name) return 'FA';

    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const presentCount = Object.values(attendance).filter(
    (s) => s === 'present'
  ).length;

  const absentCount = Object.values(attendance).filter(
    (s) => s === 'absent'
  ).length;

  const leaveCount = Object.values(attendance).filter(
    (s) => s === 'leave'
  ).length;

  const summaryCards = [
    {
      label: 'Faculty Loaded',
      value: filteredFaculty.length,
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
    },
    {
      label: 'Present',
      value: presentCount,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      label: 'Absent',
      value: absentCount,
      icon: XCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-100',
    },
    {
      label: 'Leave',
      value: leaveCount,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
  ];

  return (
    <AdminLayout
      pageLabel="Admin Module"
      title="Faculty Attendance"
      subtitle="Mark faculty attendance and filter faculty by assigned course."
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

      <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-8">
        <h2 className="text-xl font-black text-slate-800 mb-5">
          Attendance Controls
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Courses</option>
            {courses.map((course) => (
              <option key={course} value={course}>
                {course}
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
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={fetchAttendance}
            className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all"
          >
            Refresh Attendance
          </button>
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Users className="text-indigo-600" size={24} />

              <div>
                <h2 className="text-xl font-black text-slate-800">
                  Faculty Attendance List
                </h2>

                <p className="text-sm text-slate-500 font-medium mt-1">
                  Update faculty attendance using dropdown. Present, Absent and
                  Leave are saved instantly.
                </p>
              </div>
            </div>

            <span className="px-4 py-2 rounded-2xl bg-indigo-50 text-indigo-600 font-bold text-sm">
              Showing: {filteredFaculty.length}/{faculty.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-262.5">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                  Faculty
                </th>

                <th className="px-4 py-4 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                  Email
                </th>

                <th className="px-4 py-4 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                  Courses
                </th>

                <th className="px-4 py-4 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                  Subjects
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
              {filteredFaculty.length > 0 ? (
                filteredFaculty.map((f) => {
                  const status = attendance[f.id] || 'not_marked';
                  const facultyCourses = getFacultyCourses(f.id);
                  const facultySubjects = getFacultySubjects(f.id);

                  return (
                    <tr
                      key={f.id}
                      className="border-t border-slate-100 hover:bg-slate-50 transition-all"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">
                            {getInitials(f.name)}
                          </div>

                          <p className="font-bold text-slate-800">{f.name}</p>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-500 font-medium">
                        {f.email}
                      </td>

                      <td className="px-4 py-4">
                        {facultyCourses.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {facultyCourses.map((course) => (
                              <span
                                key={course}
                                className="px-3 py-2 rounded-2xl bg-indigo-100 text-indigo-600 text-sm font-bold"
                              >
                                {course}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">
                            No course assigned
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-slate-700 font-medium">
                        {facultySubjects.length > 0
                          ? facultySubjects.slice(0, 3).join(', ')
                          : 'No subject assigned'}
                      </td>

                      <td className="px-4 py-4 text-slate-500 font-medium">
                        {selectedDate}
                      </td>

                      <td className="px-4 py-4 capitalize">
                        <span
                          className={`inline-flex px-3 py-2 rounded-2xl text-xs font-black uppercase ${getStatusClass(
                            status
                          )}`}
                        >
                          {status === 'not_marked' ? 'Not Marked' : status}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <select
                          value={status === 'not_marked' ? '' : status}
                          onChange={(e) => markAttendance(f.id, e.target.value)}
                          className={`px-4 py-3 rounded-2xl border outline-none focus:ring-2 font-bold min-w-40 capitalize ${getDropdownClass(
                            status
                          )}`}
                        >
                          <option value="">Select Status</option>
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="leave">Leave</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-10 text-center text-slate-500 font-medium"
                  >
                    No faculty found for this course.
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

export default FacultyAttendanceManagement;