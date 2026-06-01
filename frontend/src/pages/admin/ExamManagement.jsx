import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Plus,
  Trash2,
  Users,
  DoorOpen,
  Sparkles,
  CheckCircle2,
  Download,
  RefreshCw,
  ClipboardList,
  BookOpen,
  GraduationCap,
  Layers,
  CheckSquare,
  ShieldCheck,
  UserCheck,
  Search,
  X,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import api from '../../api';

const ExamManagement = () => {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupSubjects, setGroupSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);

  const [selectedExamId, setSelectedExamId] = useState('');
  const [examDetails, setExamDetails] = useState(null);

  const [selectedGroups, setSelectedGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  const [examSearch, setExamSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [examAttendanceSearch, setExamAttendanceSearch] = useState('');
  const [examAttendanceFilter, setExamAttendanceFilter] = useState('all');
  const [savingSeatingId, setSavingSeatingId] = useState(null);

  const [examForm, setExamForm] = useState({
    exam_name: '',
    course_name: '',
    level_name: '',
    subject_id: '',
    exam_date: '',
    start_time: '',
    end_time: '',
  });

  const [roomForm, setRoomForm] = useState({
    room_name: '',
    capacity: '',
    invigilator_id: '',
  });

  const fetchBaseData = async () => {
    setLoading(true);

    try {
      const [examRes, groupRes, subjectRes, userRes] = await Promise.all([
        api.get('/exams'),
        api.get('/student-attendance/groups'),
        api.get('/student-attendance/group-subjects'),
        api.get('/users'),
      ]);

      const examData = Array.isArray(examRes.data) ? examRes.data : [];
      const groupData = Array.isArray(groupRes.data) ? groupRes.data : [];
      const subjectData = Array.isArray(subjectRes.data) ? subjectRes.data : [];
      const userData = Array.isArray(userRes.data)
        ? userRes.data
        : userRes.data.users || [];

      const uniqueSubjects = [];
      const seenSubjects = new Set();

      subjectData.forEach((subject) => {
        const id = subject.subject_id || subject.id;

        if (id && !seenSubjects.has(String(id))) {
          seenSubjects.add(String(id));
          uniqueSubjects.push({
            id,
            subject_name: subject.subject_name,
          });
        }
      });

      setExams(examData);
      setGroups(groupData);
      setGroupSubjects(subjectData);
      setSubjects(uniqueSubjects);
      setFaculty(userData.filter((user) => user.role === 'faculty'));

      if (!selectedExamId && examData.length > 0) {
        setSelectedExamId(String(examData[0].id));
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to load exam data');
    } finally {
      setLoading(false);
    }
  };

  const fetchExamDetails = async (examId) => {
    if (!examId) {
      setExamDetails(null);
      return;
    }

    try {
      const res = await api.get(`/exams/${examId}`);
      setExamDetails(res.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to load exam details');
      setExamDetails(null);
    }
  };

  useEffect(() => {
    fetchBaseData();
  }, []);

  useEffect(() => {
    fetchExamDetails(selectedExamId);
  }, [selectedExamId]);

  const selectedExam = examDetails?.exam;

  const courses = useMemo(() => {
    return [...new Set(groups.map((group) => group.course_name).filter(Boolean))];
  }, [groups]);

  const levelsForCourse = useMemo(() => {
    if (!examForm.course_name) return [];

    return [
      ...new Set(
        groups
          .filter((group) => group.course_name === examForm.course_name)
          .map((group) => group.semester)
          .filter(Boolean)
      ),
    ];
  }, [groups, examForm.course_name]);

  const examCourseOptions = useMemo(() => {
    return [
      ...new Set(exams.map((exam) => exam.course_name).filter(Boolean)),
    ].sort();
  }, [exams]);

  const examLevelOptions = useMemo(() => {
    return [
      ...new Set(exams.map((exam) => exam.level_name).filter(Boolean)),
    ].sort();
  }, [exams]);

  const getSubjectName = (subjectId) => {
    const subject = subjects.find(
      (item) => String(item.id) === String(subjectId)
    );

    return subject?.subject_name || '';
  };

  const getExamStatus = (exam) => {
    if (!exam?.exam_date) return 'upcoming';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const examDate = new Date(exam.exam_date);
    examDate.setHours(0, 0, 0, 0);

    return examDate >= today ? 'upcoming' : 'past';
  };

  const resetExamFilters = () => {
    setExamSearch('');
    setCourseFilter('all');
    setLevelFilter('all');
    setDateFilter('');
    setStatusFilter('all');
  };

  const filteredExams = useMemo(() => {
    const query = examSearch.toLowerCase().trim();

    return exams.filter((exam) => {
      const subjectName = exam.subject_name || getSubjectName(exam.subject_id);

      const searchableText = `
        ${exam.exam_name || ''}
        ${exam.course_name || ''}
        ${exam.level_name || ''}
        ${subjectName || ''}
        ${exam.exam_date || ''}
        ${exam.start_time || ''}
        ${exam.end_time || ''}
      `.toLowerCase();

      const matchesSearch = searchableText.includes(query);

      const matchesCourse =
        courseFilter === 'all' ||
        String(exam.course_name || '') === courseFilter;

      const matchesLevel =
        levelFilter === 'all' ||
        String(exam.level_name || '') === levelFilter;

      const matchesDate =
        !dateFilter || String(exam.exam_date || '').slice(0, 10) === dateFilter;

      const matchesStatus =
        statusFilter === 'all' || getExamStatus(exam) === statusFilter;

      return (
        matchesSearch &&
        matchesCourse &&
        matchesLevel &&
        matchesDate &&
        matchesStatus
      );
    });
  }, [
    exams,
    subjects,
    examSearch,
    courseFilter,
    levelFilter,
    dateFilter,
    statusFilter,
  ]);

  const availableSubjectsForCourseLevel = useMemo(() => {
    if (!examForm.course_name || !examForm.level_name) return [];

    const eligibleGroupIds = groups
      .filter(
        (group) =>
          group.course_name === examForm.course_name &&
          group.semester === examForm.level_name
      )
      .map((group) => String(group.id));

    const seen = new Set();

    return groupSubjects
      .filter((item) => eligibleGroupIds.includes(String(item.group_id)))
      .filter((item) => {
        const subjectId = String(item.subject_id || item.id);

        if (seen.has(subjectId)) return false;

        seen.add(subjectId);
        return true;
      })
      .map((item) => ({
        id: item.subject_id || item.id,
        subject_name: item.subject_name,
      }));
  }, [groups, groupSubjects, examForm.course_name, examForm.level_name]);

  const eligibleGroupsForSelectedExam = useMemo(() => {
    if (!selectedExam) return [];

    return groups.filter((group) => {
      const matchesCourse =
        String(group.course_name) === String(selectedExam.course_name);

      const matchesLevel =
        String(group.semester) === String(selectedExam.level_name);

      const hasSubject = groupSubjects.some(
        (item) =>
          String(item.group_id) === String(group.id) &&
          String(item.subject_id || item.id) === String(selectedExam.subject_id)
      );

      return matchesCourse && matchesLevel && hasSubject;
    });
  }, [groups, groupSubjects, selectedExam]);

  useEffect(() => {
    if (!selectedExam) return;

    const allowedIds = new Set(
      eligibleGroupsForSelectedExam.map((group) => String(group.id))
    );

    setSelectedGroups((prev) =>
      prev.filter((groupId) => allowedIds.has(String(groupId)))
    );
  }, [selectedExam?.id, eligibleGroupsForSelectedExam]);

  const totalStudents = examDetails?.seating?.length || 0;

  const presentCount =
    examDetails?.seating?.filter((seat) => seat.attendance_status === 'present')
      .length || 0;

  const absentCount = totalStudents - presentCount;

  const upcomingExamCount = exams.filter(
    (exam) => getExamStatus(exam) === 'upcoming'
  ).length;

  const pastExamCount = exams.filter(
    (exam) => getExamStatus(exam) === 'past'
  ).length;

  const cleanValue = (value) => {
    if (value === null || value === undefined) return '';

    return `"${String(value).replace(/"/g, '""')}"`;
  };

  const downloadCsv = () => {
    const rows = (examDetails?.seating || []).map((seat) => ({
      Exam: selectedExam?.exam_name || '',
      Course: selectedExam?.course_name || '',
      Level: selectedExam?.level_name || '',
      Subject: selectedExam?.subject_name || '',
      Date: selectedExam?.exam_date || '',
      Start_Time: selectedExam?.start_time || '',
      End_Time: selectedExam?.end_time || '',
      Room: seat.room_name,
      Invigilator: seat.invigilator_name || '',
      Seat_Number: seat.seat_number,
      Student_ID: seat.student_id,
      Student_Name: seat.student_name,
      Email: seat.student_email,
      Student_Course: seat.course_name,
      Student_Level: seat.semester,
      Section: seat.section_name,
      Attendance: seat.attendance_status,
      Signature: '',
    }));

    if (rows.length === 0) {
      alert('No seating data to export');
      return;
    }

    const headers = Object.keys(rows[0]);

    const csv = [
      headers.map(cleanValue).join(','),
      ...rows.map((row) =>
        headers.map((header) => cleanValue(row[header])).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${selectedExam?.exam_name || 'exam'}_attendance_sheet.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();

    try {
      await api.post('/exams', {
        exam_name: examForm.exam_name,
        course_name: examForm.course_name,
        level_name: examForm.level_name,
        subject_id: examForm.subject_id,
        exam_date: examForm.exam_date,
        start_time: examForm.start_time,
        end_time: examForm.end_time,
      });

      setExamForm({
        exam_name: '',
        course_name: '',
        level_name: '',
        subject_id: '',
        exam_date: '',
        start_time: '',
        end_time: '',
      });

      await fetchBaseData();
      alert('Exam created successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create exam');
    }
  };

  const handleDeleteExam = async (id) => {
    if (!window.confirm('Delete this exam and all seating data?')) return;

    try {
      await api.delete(`/exams/${id}`);

      setSelectedExamId('');
      setExamDetails(null);
      setSelectedGroups([]);

      await fetchBaseData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete exam');
    }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();

    if (!selectedExamId) {
      alert('Select an exam first');
      return;
    }

    try {
      await api.post(`/exams/${selectedExamId}/rooms`, {
        room_name: roomForm.room_name,
        capacity: Number(roomForm.capacity),
        invigilator_id: roomForm.invigilator_id || null,
      });

      setRoomForm({
        room_name: '',
        capacity: '',
        invigilator_id: '',
      });

      fetchExamDetails(selectedExamId);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add room');
    }
  };

  const handleDeleteRoom = async (roomId) => {
    const confirmed = window.confirm(
      'Delete this room? Existing seating in this room will be removed.'
    );

    if (!confirmed) return;

    try {
      await api.delete(`/exams/rooms/${roomId}`);
      fetchExamDetails(selectedExamId);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete room');
    }
  };

  const toggleGroup = (groupId) => {
    setSelectedGroups((prev) => {
      const exists = prev.includes(String(groupId));

      if (exists) {
        return prev.filter((id) => id !== String(groupId));
      }

      return [...prev, String(groupId)];
    });
  };

  const selectAllEligibleSections = () => {
    setSelectedGroups(
      eligibleGroupsForSelectedExam.map((group) => String(group.id))
    );
  };

  const clearSelectedSections = () => {
    setSelectedGroups([]);
  };

  const generateSeating = async () => {
    if (!selectedExamId) {
      alert('Select an exam first');
      return;
    }

    if (selectedGroups.length === 0) {
      alert('Select at least one eligible section');
      return;
    }

    try {
      const res = await api.post(`/exams/${selectedExamId}/generate-seating`, {
        group_ids: selectedGroups,
      });

      alert(res.data.message || 'Seating generated successfully');
      fetchExamDetails(selectedExamId);
      fetchBaseData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to generate seating');
    }
  };

  const updateAttendance = async (seatingId, attendance_status) => {
    if (!attendance_status) return;

    setSavingSeatingId(seatingId);

    try {
      await api.patch(`/exams/seating/${seatingId}/attendance`, {
        attendance_status,
      });

      await fetchExamDetails(selectedExamId);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update attendance');
    } finally {
      setSavingSeatingId(null);
    }
  };

  const getExamAttendanceBadgeClass = (status) => {
    if (status === 'present') return 'bg-emerald-100 text-emerald-700';
    return 'bg-rose-100 text-rose-700';
  };

  const getExamAttendanceDropdownClass = (status) => {
    if (status === 'present') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500';
    }

    return 'bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-500';
  };

  const filteredGroupedSeating = useMemo(() => {
    const grouped = {};
    const query = examAttendanceSearch.toLowerCase().trim();

    (examDetails?.seating || []).forEach((seat) => {
      const status = seat.attendance_status || 'absent';

      const searchableText = `
        ${seat.student_name || ''}
        ${seat.student_email || ''}
        ${seat.room_name || ''}
        ${seat.seat_number || ''}
        ${seat.course_name || ''}
        ${seat.semester || ''}
        ${seat.section_name || ''}
      `.toLowerCase();

      const matchesSearch = searchableText.includes(query);

      const matchesStatus =
        examAttendanceFilter === 'all' || status === examAttendanceFilter;

      if (!matchesSearch || !matchesStatus) return;

      if (!grouped[seat.room_name]) {
        grouped[seat.room_name] = [];
      }

      grouped[seat.room_name].push(seat);
    });

    return grouped;
  }, [examDetails, examAttendanceSearch, examAttendanceFilter]);

  const summaryCards = [
    {
      label: 'Total Exams',
      value: exams.length,
      icon: ClipboardList,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
      onClick: () => setStatusFilter('all'),
    },
    {
      label: 'Upcoming Exams',
      value: upcomingExamCount,
      icon: CalendarDays,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      onClick: () => setStatusFilter('upcoming'),
    },
    {
      label: 'Past Exams',
      value: pastExamCount,
      icon: CalendarDays,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
      onClick: () => setStatusFilter('past'),
    },
    {
      label: 'Exam Rooms',
      value: examDetails?.rooms?.length || 0,
      icon: DoorOpen,
      color: 'text-violet-600',
      bg: 'bg-violet-100',
      onClick: () => {},
    },
    {
      label: 'Allocated Students',
      value: totalStudents,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      onClick: () => {},
    },
    {
      label: 'Present / Absent',
      value: `${presentCount}/${absentCount}`,
      icon: CheckCircle2,
      color: 'text-rose-600',
      bg: 'bg-rose-100',
      onClick: () => {},
    },
  ];

  const hasActiveExamFilters =
    examSearch ||
    courseFilter !== 'all' ||
    levelFilter !== 'all' ||
    dateFilter ||
    statusFilter !== 'all';

  return (
    <AdminLayout
      pageLabel="Admin Module"
      title="Exam Seating"
      subtitle="Create course-level exams, assign invigilators, prevent clashes, allocate rooms, and export attendance sheets."
    >
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-6 mb-10">
        {summaryCards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={card.onClick}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-left hover:shadow-lg hover:-translate-y-1 transition-all"
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
          </button>
        ))}
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-8">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800">
              Smart Exam Filters
            </h2>

            <p className="text-sm text-slate-500 font-medium mt-1">
              {filteredExams.length} exam
              {filteredExams.length !== 1 ? 's' : ''} found
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 w-full xl:w-auto">
            <div className="relative xl:col-span-2">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search exam, subject..."
                value={examSearch}
                onChange={(e) => setExamSearch(e.target.value)}
                className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />

              {examSearch && (
                <button
                  type="button"
                  onClick={() => setExamSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 font-black"
                >
                  ×
                </button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming Only</option>
              <option value="past">Past Only</option>
            </select>

            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">All Courses</option>
              {examCourseOptions.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>

            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">All Levels</option>
              {examLevelOptions.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>
        </div>

        {hasActiveExamFilters && (
          <button
            type="button"
            onClick={resetExamFilters}
            className="mt-4 px-4 py-2 rounded-2xl bg-slate-100 text-slate-600 text-sm font-black hover:bg-slate-200 flex items-center gap-2"
          >
            <X size={15} />
            Clear Filters
          </button>
        )}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-800">
              Create Course-Level Exam
            </h2>

            <p className="text-sm text-slate-500 font-medium mt-1">
              Select course and level first. Only subjects assigned to that level
              will appear.
            </p>
          </div>

          <form
            onSubmit={handleCreateExam}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <input
              type="text"
              placeholder="Exam name e.g. Final Term Examination"
              value={examForm.exam_name}
              onChange={(e) =>
                setExamForm({ ...examForm, exam_name: e.target.value })
              }
              className="px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 md:col-span-2"
              required
            />

            <select
              value={examForm.course_name}
              onChange={(e) =>
                setExamForm({
                  ...examForm,
                  course_name: e.target.value,
                  level_name: '',
                  subject_id: '',
                })
              }
              className="px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select Course</option>
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>

            <select
              value={examForm.level_name}
              onChange={(e) =>
                setExamForm({
                  ...examForm,
                  level_name: e.target.value,
                  subject_id: '',
                })
              }
              className="px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={!examForm.course_name}
              required
            >
              <option value="">Select Level</option>
              {levelsForCourse.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>

            <select
              value={examForm.subject_id}
              onChange={(e) =>
                setExamForm({ ...examForm, subject_id: e.target.value })
              }
              className="px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 md:col-span-2"
              disabled={!examForm.course_name || !examForm.level_name}
              required
            >
              <option value="">Select Subject</option>
              {availableSubjectsForCourseLevel.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.subject_name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={examForm.exam_date}
              onChange={(e) =>
                setExamForm({ ...examForm, exam_date: e.target.value })
              }
              className="px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="time"
                value={examForm.start_time}
                onChange={(e) =>
                  setExamForm({ ...examForm, start_time: e.target.value })
                }
                className="px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />

              <input
                type="time"
                value={examForm.end_time}
                onChange={(e) =>
                  setExamForm({ ...examForm, end_time: e.target.value })
                }
                className="px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <button
              type="submit"
              className="md:col-span-2 px-5 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Create Exam
            </button>
          </form>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-800">
                Select Exam
              </h2>

              <p className="text-sm text-slate-500 font-medium mt-1">
                Choose exam to manage rooms and seating.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchBaseData}
              disabled={loading}
              className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center disabled:opacity-60"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
          >
            <option value="">Select Exam</option>
            {filteredExams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.exam_name} - {exam.course_name} {exam.level_name}
              </option>
            ))}
          </select>

          {filteredExams.length === 0 && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 font-bold mb-4">
              No exam matches the selected filters.
            </div>
          )}

          {selectedExam && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    getExamStatus(selectedExam) === 'upcoming'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {getExamStatus(selectedExam)}
                </span>
              </div>

              <h3 className="font-black text-slate-800">
                {selectedExam.exam_name}
              </h3>

              <div className="space-y-2 mt-3 text-sm text-slate-500 font-medium">
                <p className="flex items-center gap-2">
                  <GraduationCap size={16} />
                  {selectedExam.course_name} / {selectedExam.level_name}
                </p>

                <p className="flex items-center gap-2">
                  <BookOpen size={16} />
                  {selectedExam.subject_name || 'Subject not set'}
                </p>

                <p className="flex items-center gap-2">
                  <CalendarDays size={16} />
                  {selectedExam.exam_date} •{' '}
                  {selectedExam.start_time?.slice(0, 5)} -{' '}
                  {selectedExam.end_time?.slice(0, 5)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteExam(selectedExam.id)}
                className="mt-4 px-4 py-3 rounded-2xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete Exam
              </button>
            </div>
          )}
        </div>
      </section>

      {selectedExam && (
        <>
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-800 mb-1">
                Add Exam Room
              </h2>

              <p className="text-sm text-slate-500 font-medium mb-5">
                Add room, capacity, and invigilator. Leave invigilator empty for
                auto-assign.
              </p>

              <form onSubmit={handleAddRoom} className="space-y-4">
                <input
                  type="text"
                  placeholder="Room name e.g. Hall A"
                  value={roomForm.room_name}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, room_name: e.target.value })
                  }
                  className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />

                <input
                  type="number"
                  placeholder="Capacity e.g. 30"
                  value={roomForm.capacity}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, capacity: e.target.value })
                  }
                  className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />

                <select
                  value={roomForm.invigilator_id}
                  onChange={(e) =>
                    setRoomForm({
                      ...roomForm,
                      invigilator_id: e.target.value,
                    })
                  }
                  className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Auto assign available faculty</option>
                  {faculty.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} - {item.email}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="w-full px-5 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Add Room
                </button>
              </form>
            </div>

            <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-800 mb-1">
                Exam Rooms & Invigilators
              </h2>

              <p className="text-sm text-slate-500 font-medium mb-5">
                Room and invigilator clashes are checked before saving.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(examDetails?.rooms || []).length > 0 ? (
                  examDetails.rooms.map((room) => (
                    <div
                      key={room.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-4"
                    >
                      <div>
                        <h3 className="font-black text-slate-800">
                          {room.room_name}
                        </h3>

                        <p className="text-sm text-slate-500 font-medium mt-1">
                          Capacity: {room.capacity} • Assigned:{' '}
                          {room.assigned_count || 0}
                        </p>

                        <p className="text-sm text-slate-500 font-medium mt-2 flex items-center gap-2">
                          <ShieldCheck size={16} />
                          {room.invigilator_name || 'No invigilator assigned'}
                        </p>

                        {room.invigilator_email && (
                          <p className="text-xs text-slate-400 font-semibold mt-1">
                            {room.invigilator_email}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteRoom(room.id)}
                        className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="md:col-span-2 p-8 text-center rounded-2xl bg-slate-50">
                    <DoorOpen size={30} className="mx-auto text-slate-300" />

                    <p className="font-bold text-slate-600 mt-3">
                      No rooms added yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-8">
            <div className="mb-6 flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-800">
                  Eligible Sections & Mixed Seating
                </h2>

                <p className="text-sm text-slate-500 font-medium mt-1">
                  Only sections under {selectedExam.course_name} /{' '}
                  {selectedExam.level_name} that study{' '}
                  {selectedExam.subject_name} are shown.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={selectAllEligibleSections}
                  className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 flex items-center gap-2"
                >
                  <CheckSquare size={18} />
                  Select All Eligible
                </button>

                <button
                  type="button"
                  onClick={clearSelectedSections}
                  className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={generateSeating}
                  className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Sparkles size={18} />
                  Generate Mixed Seating
                </button>

                <button
                  type="button"
                  onClick={downloadCsv}
                  className="px-5 py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex items-center gap-2"
                >
                  <Download size={18} />
                  Export Attendance Sheet
                </button>
              </div>
            </div>

            <div className="mb-5 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold flex items-center gap-3">
              <Layers size={19} />
              {selectedGroups.length} of {eligibleGroupsForSelectedExam.length}{' '}
              eligible section(s) selected
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {eligibleGroupsForSelectedExam.length > 0 ? (
                eligibleGroupsForSelectedExam.map((group) => {
                  const active = selectedGroups.includes(String(group.id));

                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className={`p-4 rounded-2xl border text-left transition ${
                        active
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-slate-50 border-slate-100 text-slate-700 hover:border-indigo-200'
                      }`}
                    >
                      <h3 className="font-black">{group.course_name}</h3>

                      <p
                        className={`text-sm font-medium mt-1 ${
                          active ? 'text-indigo-100' : 'text-slate-500'
                        }`}
                      >
                        {group.semester} - {group.section_name}
                      </p>
                    </button>
                  );
                })
              ) : (
                <div className="xl:col-span-4 p-8 text-center rounded-2xl bg-rose-50 border border-rose-100">
                  <p className="font-black text-rose-600">
                    No eligible sections found.
                  </p>

                  <p className="text-sm text-rose-500 font-medium mt-1">
                    Check subject assignment for this course and level.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-800">
                    Room-wise Exam Attendance
                  </h2>

                  <p className="text-sm text-slate-500 font-medium mt-1">
                    Search students and update exam attendance using the dropdown.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <span className="px-4 py-2 rounded-2xl bg-emerald-50 text-emerald-600 font-black text-sm">
                    Present: {presentCount}
                  </span>

                  <span className="px-4 py-2 rounded-2xl bg-rose-50 text-rose-600 font-black text-sm">
                    Absent: {absentCount}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-5">
                <div className="relative xl:col-span-2">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    placeholder="Search student, email, room, seat..."
                    value={examAttendanceSearch}
                    onChange={(e) => setExamAttendanceSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <select
                  value={examAttendanceFilter}
                  onChange={(e) => setExamAttendanceFilter(e.target.value)}
                  className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="all">All Status</option>
                  <option value="present">Present Only</option>
                  <option value="absent">Absent Only</option>
                </select>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {Object.keys(filteredGroupedSeating).length > 0 ? (
                Object.entries(filteredGroupedSeating).map(([roomName, seats]) => (
                  <div
                    key={roomName}
                    className="border border-slate-200 rounded-3xl overflow-hidden"
                  >
                    <div className="bg-indigo-600 text-white px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <h3 className="font-black text-lg">{roomName}</h3>

                        <p className="text-sm text-indigo-100 font-semibold">
                          {seats.length} student
                          {seats.length !== 1 ? 's' : ''} shown
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-indigo-100 font-bold">
                        <UserCheck size={17} />
                        {seats[0]?.invigilator_name || 'No invigilator'}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-275">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500">
                            <th className="px-4 py-3 text-left text-sm font-black">
                              Seat
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-black">
                              Student
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-black">
                              Email
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-black">
                              Course / Level / Section
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-black">
                              Current Status
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-black">
                              Update
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {seats.map((seat) => {
                            const status = seat.attendance_status || 'absent';

                            return (
                              <tr
                                key={seat.id}
                                className="border-t border-slate-100 hover:bg-slate-50"
                              >
                                <td className="px-4 py-3 font-black text-slate-800">
                                  {seat.seat_number}
                                </td>

                                <td className="px-4 py-3 font-bold text-slate-800">
                                  {seat.student_name}
                                </td>

                                <td className="px-4 py-3 text-slate-500 font-medium">
                                  {seat.student_email}
                                </td>

                                <td className="px-4 py-3 text-slate-500 font-medium">
                                  {seat.course_name} / {seat.semester} /{' '}
                                  {seat.section_name}
                                </td>

                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex px-3 py-2 rounded-2xl text-xs font-black uppercase ${getExamAttendanceBadgeClass(
                                      status
                                    )}`}
                                  >
                                    {status}
                                  </span>
                                </td>

                                <td className="px-4 py-3">
                                  <select
                                    value={status}
                                    disabled={savingSeatingId === seat.id}
                                    onChange={(e) =>
                                      updateAttendance(seat.id, e.target.value)
                                    }
                                    className={`px-4 py-3 rounded-2xl border outline-none focus:ring-2 font-bold min-w-36 ${getExamAttendanceDropdownClass(
                                      status
                                    )}`}
                                  >
                                    <option value="present">Present</option>
                                    <option value="absent">Absent</option>
                                  </select>

                                  {savingSeatingId === seat.id && (
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
                  </div>
                ))
              ) : (
                <div className="p-10 text-center rounded-3xl bg-slate-50">
                  <Users size={34} className="mx-auto text-slate-300" />

                  <h3 className="text-xl font-black text-slate-800 mt-4">
                    No seating records shown.
                  </h3>

                  <p className="text-slate-500 font-medium mt-2">
                    Generate seating first or adjust the search/status filter.
                  </p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </AdminLayout>
  );
};

export default ExamManagement;