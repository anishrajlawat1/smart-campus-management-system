import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckSquare,
  BookOpen,
  CalendarDays,
  Users,
  ClipboardList,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock3,
  XCircle,
  MinusCircle,
} from 'lucide-react';
import api from '../../api';
import FacultyLayout from './FacultyLayout';

const FacultyAttendancePage = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [assignments, setAssignments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [subjectsByGroup, setSubjectsByGroup] = useState({});
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [studentSearch, setStudentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [savingStudentId, setSavingStudentId] = useState(null);

  const getFallbackImage = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name || 'Student'
    )}&background=4f46e5&color=ffffff&size=256`;

  const fetchFacultyAssignments = async () => {
    try {
      const res = await api.get('/student-attendance/faculty-subjects', {
        params: { faculty_id: user?.id },
      });

      const data = Array.isArray(res.data) ? res.data : [];
      setAssignments(data);

      const groupMap = new Map();
      const subjectMap = {};

      data.forEach((item) => {
        if (!groupMap.has(item.group_id)) {
          groupMap.set(item.group_id, {
            id: item.group_id,
            course_name: item.course_name,
            semester: item.semester,
            section_name: item.section_name,
          });
        }

        if (!subjectMap[item.group_id]) {
          subjectMap[item.group_id] = [];
        }

        const exists = subjectMap[item.group_id].some(
          (subject) => Number(subject.id) === Number(item.subject_id)
        );

        if (!exists) {
          subjectMap[item.group_id].push({
            id: item.subject_id,
            subject_name: item.subject_name,
          });
        }
      });

      setGroups(Array.from(groupMap.values()));
      setSubjectsByGroup(subjectMap);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to load assigned classes');
    }
  };

  const fetchStudentsByGroup = async (groupId) => {
    if (!groupId) {
      setStudents([]);
      return;
    }

    try {
      const res = await api.get(`/student-attendance/groups/${groupId}/students`);
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to fetch students');
      setStudents([]);
    }
  };

  const fetchAttendance = async () => {
    if (!selectedGroup || !selectedSubject || !selectedDate) {
      setAttendance([]);
      return;
    }

    try {
      const res = await api.get('/student-attendance', {
        params: {
          date: selectedDate,
          group_id: selectedGroup,
          subject_id: selectedSubject,
        },
      });

      setAttendance(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to fetch attendance');
      setAttendance([]);
    }
  };

  useEffect(() => {
    fetchFacultyAssignments();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchStudentsByGroup(selectedGroup);
    } else {
      setStudents([]);
    }

    setSelectedSubject('');
    setAttendance([]);
    setStudentSearch('');
    setStatusFilter('all');
  }, [selectedGroup]);

  useEffect(() => {
    fetchAttendance();
  }, [selectedGroup, selectedSubject, selectedDate]);

  const attendanceMap = useMemo(() => {
    const map = {};

    attendance.forEach((record) => {
      map[String(record.student_id)] = record;
    });

    return map;
  }, [attendance]);

  const currentSubjects = subjectsByGroup[selectedGroup] || [];

  const selectedSubjectName =
    currentSubjects.find((subject) => String(subject.id) === String(selectedSubject))
      ?.subject_name || 'Selected Subject';

  const getStudentAttendanceRecord = (studentId) => {
    return attendanceMap[String(studentId)] || null;
  };

  const markAttendance = async (studentId, status) => {
    if (!selectedGroup || !selectedSubject || !selectedDate) {
      alert('Please select section, subject and date first');
      return;
    }

    if (!status) return;

    setSavingStudentId(studentId);

    try {
      await api.post('/student-attendance', {
        student_id: Number(studentId),
        subject_id: Number(selectedSubject),
        group_id: Number(selectedGroup),
        faculty_id: Number(user?.id),
        date: selectedDate,
        status,
      });

      await fetchAttendance();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSavingStudentId(null);
    }
  };

  const markAllPresent = async () => {
    if (!selectedGroup || !selectedSubject || !selectedDate) {
      alert('Please select section, subject and date first');
      return;
    }

    if (students.length === 0) {
      alert('No students found in this section');
      return;
    }

    const confirmed = window.confirm('Mark all loaded students as present?');
    if (!confirmed) return;

    try {
      for (const student of students) {
        await api.post('/student-attendance', {
          student_id: Number(student.id),
          subject_id: Number(selectedSubject),
          group_id: Number(selectedGroup),
          faculty_id: Number(user?.id),
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

  const filteredStudents = useMemo(() => {
    const query = studentSearch.toLowerCase().trim();

    return students.filter((student) => {
      const record = getStudentAttendanceRecord(student.id);
      const currentStatus = record?.status || 'unmarked';

      const matchesSearch = `${student.name || ''} ${student.email || ''}`
        .toLowerCase()
        .includes(query);

      const matchesStatus =
        statusFilter === 'all' || currentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [students, attendanceMap, studentSearch, statusFilter]);

  const totalStudents = students.length;
  const presentCount = attendance.filter((a) => a.status === 'present').length;
  const lateCount = attendance.filter((a) => a.status === 'late').length;
  const absentCount = attendance.filter((a) => a.status === 'absent').length;
  const markedCount = attendance.length;
  const unmarkedCount = Math.max(totalStudents - markedCount, 0);

  const getStatusBadgeClass = (status) => {
    if (status === 'present') return 'bg-emerald-100 text-emerald-700';
    if (status === 'late') return 'bg-amber-100 text-amber-700';
    if (status === 'absent') return 'bg-rose-100 text-rose-700';
    return 'bg-slate-100 text-slate-500';
  };

  const getDropdownClass = (status) => {
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

  const summaryCards = [
    {
      label: 'Assigned Classes',
      value: groups.length,
      icon: BookOpen,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
    },
    {
      label: 'Students',
      value: totalStudents,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      label: 'Marked',
      value: markedCount,
      icon: CheckSquare,
      color: 'text-sky-600',
      bg: 'bg-sky-100',
    },
    {
      label: 'Unmarked',
      value: unmarkedCount,
      icon: ClipboardList,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
  ];

  const statusCards = [
    {
      label: 'Present',
      value: presentCount,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      filter: 'present',
    },
    {
      label: 'Late',
      value: lateCount,
      icon: Clock3,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      filter: 'late',
    },
    {
      label: 'Absent',
      value: absentCount,
      icon: XCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      filter: 'absent',
    },
    {
      label: 'Unmarked',
      value: unmarkedCount,
      icon: MinusCircle,
      color: 'text-slate-600',
      bg: 'bg-slate-50',
      filter: 'unmarked',
    },
  ];

  return (
    <FacultyLayout
      pageLabel="Faculty Module"
      title="Mark Student Attendance"
      subtitle="Select your assigned class and update attendance directly from one table."
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
        <div className="mb-6 flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800">
              Attendance Controls
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Choose an assigned section, subject, and date.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              fetchFacultyAssignments();
              fetchAttendance();
            }}
            className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        {assignments.length === 0 ? (
          <div className="p-5 rounded-2xl bg-amber-50 text-amber-700 font-bold">
            No assigned classes found. Ask admin to assign you to a section and subject.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
              >
                <option value="">Select Assigned Section</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.course_name} - {group.semester} - Section{' '}
                    {group.section_name}
                  </option>
                ))}
              </select>

              <select
                className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={!selectedGroup}
              >
                <option value="">Select Assigned Subject</option>
                {currentSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.subject_name}
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

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={fetchAttendance}
                className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <Search size={18} />
                Load Attendance
              </button>

              <button
                type="button"
                onClick={markAllPresent}
                disabled={!selectedGroup || !selectedSubject || students.length === 0}
                className="px-5 py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <CheckCircle2 size={18} />
                Mark All Present
              </button>
            </div>
          </>
        )}
      </section>

      {selectedGroup && selectedSubject && (
        <section className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          {statusCards.map((card) => (
            <button
              key={card.label}
              type="button"
              onClick={() => setStatusFilter(card.filter)}
              className={`p-5 rounded-3xl border text-left transition-all hover:shadow-md ${
                statusFilter === card.filter
                  ? 'bg-white border-indigo-300 ring-2 ring-indigo-100'
                  : 'bg-white border-slate-100'
              }`}
            >
              <div
                className={`w-12 h-12 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center mb-4`}
              >
                <card.icon size={22} />
              </div>

              <p className="text-sm text-slate-500 font-bold">{card.label}</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">
                {card.value}
              </h3>
            </button>
          ))}
        </section>
      )}

      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-800">
                Attendance Table
              </h2>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Update attendance using the status dropdown. Changes are saved instantly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full xl:w-auto">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  placeholder="Search student..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full md:w-72 pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="all">All Status</option>
                <option value="present">Present Only</option>
                <option value="late">Late Only</option>
                <option value="absent">Absent Only</option>
                <option value="unmarked">Unmarked Only</option>
              </select>
            </div>
          </div>
        </div>

        {!selectedGroup ? (
          <div className="p-10 text-center text-slate-500 font-medium">
            Please select an assigned section first.
          </div>
        ) : !selectedSubject ? (
          <div className="p-10 text-center text-slate-500 font-medium">
            Please select an assigned subject first.
          </div>
        ) : students.length === 0 ? (
          <div className="p-10 text-center text-slate-500 font-medium">
            No students found for this section.
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-10 text-center text-slate-500 font-medium">
            No students match the selected filters.
          </div>
        ) : (
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
                    Subject
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                    Date
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                    Current Status
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                    Update
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((student, index) => {
                  const record = getStudentAttendanceRecord(student.id);
                  const currentStatus = record?.status || 'unmarked';

                  return (
                    <tr
                      key={student.id}
                      className={`border-t border-slate-100 hover:bg-slate-50 transition-all ${
                        index === 0 ? 'border-t-0' : ''
                      }`}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              student.profile_image ||
                              getFallbackImage(student.name)
                            }
                            alt={student.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-slate-100"
                            onError={(e) => {
                              e.currentTarget.src = getFallbackImage(
                                student.name
                              );
                            }}
                          />

                          <span className="font-bold text-slate-800">
                            {student.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-slate-500 font-medium">
                        {student.email}
                      </td>

                      <td className="px-6 py-5 text-slate-700 font-medium">
                        {selectedSubjectName}
                      </td>

                      <td className="px-6 py-5 text-slate-500 font-medium">
                        {selectedDate}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex px-3 py-2 rounded-2xl text-sm font-bold capitalize ${getStatusBadgeClass(
                            currentStatus
                          )}`}
                        >
                          {currentStatus === 'unmarked'
                            ? 'Unmarked'
                            : currentStatus}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <select
                          value={currentStatus === 'unmarked' ? '' : currentStatus}
                          disabled={savingStudentId === student.id}
                          onChange={(e) =>
                            markAttendance(student.id, e.target.value)
                          }
                          className={`px-4 py-3 rounded-2xl border outline-none focus:ring-2 font-bold capitalize min-w-40 ${getDropdownClass(
                            currentStatus
                          )}`}
                        >
                          <option value="">Select Status</option>
                          <option value="present">Present</option>
                          <option value="late">Late</option>
                          <option value="absent">Absent</option>
                        </select>

                        {savingStudentId === student.id && (
                          <span className="ml-3 text-xs text-slate-400 font-bold">
                            Saving...
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </FacultyLayout>
  );
};

export default FacultyAttendancePage;